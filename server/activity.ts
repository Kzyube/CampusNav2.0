import { randomUUID, timingSafeEqual } from "node:crypto";
import type { Server } from "socket.io";
import { dijkstra, validateRoute } from "../lib/algorithms";
import { games, roundDuration, type Game, type GameResult, type Ack, type FromServer, type Participant, type Phase, type PublicRound, type Self, type ToServer } from "../lib/live";

type SocketData = { token?: string; presenter?: boolean };
export type ActivityServer = Server<ToServer, FromServer, object, SocketData>;

export function registerActivity(io: ActivityServer, presenterKey: string, allowLoopback: boolean) {
  const participants = new Map<string, Participant & { sockets: Set<string> }>();
  let game: Game = games[0];
  let results: Partial<Record<Game["id"], GameResult>> = {};
  const answer = () => { const { route, distance } = dijkstra(game.start, game.target); return { route, distance }; };
  let phase: Phase = "ready";
  let id = 1;
  let submissionOrder = 0;
  let remaining = roundDuration;
  let endsAt: number | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function clearTimer() {
    clearTimeout(timeout);
    endsAt = null;
  }

  function expire(at = Date.now()) {
    if (phase !== "running" || endsAt === null || at < endsAt) return false;
    clearTimer();
    remaining = 0;
    phase = "ended";
    return true;
  }

  function round(): PublicRound {
    const list = [...participants.values()];
    return {
      id, game, phase, endsAt, remaining, serverTime: Date.now(),
      online: list.filter(participant => participant.sockets.size > 0).length,
      submitted: list.filter(participant => participant.submission).length,
      answer: phase === "revealed" ? answer() : undefined,
    };
  }

  function selfFor(token?: string): Self | null {
    const participant = token && participants.get(token);
    if (!participant) return null;
    const submission = participant.submission;
    return {
      nickname: participant.nickname,
      submission: submission && {
        route: submission.route, weight: submission.weight,
        ...(phase === "revealed" ? {
          best: submission.best, optimal: submission.optimal, answer: dijkstra(submission.start, submission.target).route,
        } : {}),
      },
    };
  }

  function roster(): Participant[] {
    return [...participants.values()].map(({ id, nickname, sockets, submission }) => ({
      id, nickname, online: sockets.size > 0, submission,
    }));
  }

  function broadcast() {
    io.emit("round", round());
    io.to("presenters").emit("participants", roster());
    io.to("presenters").emit("games", results);
  }

  function reset() {
    clearTimer();
    id++;
    submissionOrder = 0;
    remaining = roundDuration;
    phase = "ready";
    for (const participant of participants.values()) participant.submission = undefined;
  }

  function syncStudents() {
    for (const [token, participant] of participants) {
      if (!participant.sockets.size) continue;
      io.to([...participant.sockets]).emit("self", selfFor(token));
    }
  }

  function revokeStudent(sockets: ReadonlySet<string>, reason?: "game-reset") {
    for (const socketId of sockets) {
      const student = io.sockets.sockets.get(socketId);
      if (!student) continue;
      student.data.token = undefined;
      student.emit("self", null, reason);
    }
  }

  function fail<T>(ack: Ack<T>, error: string) {
    ack({ ok: false, error });
  }

  io.on("connection", socket => {
    if (expire()) broadcast();
    socket.emit("round", round());

    function detach() {
      if (socket.data.token) {
        const participant = participants.get(socket.data.token);
        participant?.sockets.delete(socket.id);
        socket.data.token = undefined;
      }
    }

    function attach(token: string) {
      detach();
      socket.data.token = token;
      participants.get(token)!.sockets.add(socket.id);
      socket.emit("self", selfFor(token));
      broadcast();
    }

    socket.on("student:restore", (token, ack) => {
      if (typeof ack !== "function") return;
      const valid = typeof token === "string" && participants.has(token);
      if (valid) attach(token);
      else socket.emit("self", null);
      ack({ ok: true, value: valid });
    });

    socket.on("student:join", (data, ack) => {
      if (typeof ack !== "function") return;
      if (socket.data.token) return ack({ ok: true, value: socket.data.token });
      const nickname = typeof data?.nickname === "string" ? data.nickname.trim().replace(/\s+/gu, " ") : "";
      if (!nickname || nickname.length > 24 || /[\p{Cc}\p{Cf}]/u.test(nickname)) {
        return fail(ack, "Enter a nickname with 1 to 24 characters.");
      }
      if ([...participants.values()].some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
        return fail(ack, "That nickname is taken. Try another one.");
      }
      if (participants.size >= 200) return fail(ack, "This session has reached 200 participants.");
      const token = randomUUID();
      participants.set(token, { id: randomUUID(), nickname, online: true, sockets: new Set() });
      attach(token);
      ack({ ok: true, value: token });
    });

    socket.on("student:submit", (data, ack) => {
      if (typeof ack !== "function") return;
      const at = Date.now();
      if (expire(at)) broadcast();
      const participant = socket.data.token && participants.get(socket.data.token);
      if (!participant) return fail(ack, "Join the activity before submitting.");
      if (data?.roundId !== id) return fail(ack, "A new round has started. Build your route for this round.");
      if (participant.submission) return fail(ack, "You already submitted a route in this round.");
      if (phase !== "running" || endsAt === null) return fail(ack, "Submissions open while the countdown is running.");
      if (data.start !== game.start || data.target !== game.target) {
        return fail(ack, `Game ${game.id} runs from ${game.start} to ${game.target}.`);
      }
      const validation = validateRoute(data.route, data.start, data.target);
      if ("error" in validation) return fail(ack, validation.error);
      participant.submission = {
        ...validation, start: data.start, target: data.target, at,
        elapsedMs: Math.max(0, roundDuration - (endsAt - at)),
        order: ++submissionOrder,
      };
      io.to([...participant.sockets]).emit("self", selfFor(socket.data.token));
      broadcast();
      ack({ ok: true, value: undefined });
    });

    socket.on("presenter:authorize", async (key, ack) => {
      if (typeof ack !== "function") return;
      const address = socket.request.socket.remoteAddress;
      const local = allowLoopback && (address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1");
      const expected = Buffer.from(presenterKey);
      const supplied = typeof key === "string" ? Buffer.from(key) : Buffer.alloc(0);
      if (!local && (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))) {
        return fail(ack, "Enter the presenter code printed in the server terminal.");
      }
      socket.data.presenter = true;
      await socket.join("presenters");
      expire();
      broadcast();
      ack({ ok: true, value: undefined });
    });

    socket.on("presenter:game", (gameId, ack) => {
      if (typeof ack !== "function") return;
      if (!socket.data.presenter) return fail(ack, "Unlock presenter controls first.");
      if (expire()) broadcast();
      const selected = games.find(candidate => candidate.id === gameId);
      if (!selected) return fail(ack, "Choose a listed game.");
      if (phase !== "ready" && phase !== "revealed") return fail(ack, "Reveal or reset the current game first.");
      game = selected;
      reset();
      broadcast();
      syncStudents();
      ack({ ok: true, value: undefined });
    });

    socket.on("presenter:remove", (participantId, ack) => {
      if (typeof ack !== "function") return;
      if (!socket.data.presenter) return fail(ack, "Unlock presenter controls first.");
      const entry = [...participants.entries()].find(([, participant]) => participant.id === participantId);
      if (!entry) return fail(ack, "That participant has already left the roster.");
      const [token, participant] = entry;
      participants.delete(token);
      revokeStudent(participant.sockets);
      broadcast();
      ack({ ok: true, value: undefined });
    });

    socket.on("presenter:control", (action, ack) => {
      if (typeof ack !== "function") return;
      if (!socket.data.presenter) return fail(ack, "Unlock presenter controls first.");
      if (expire()) broadcast();
      switch (action) {
        case "start":
          if (phase !== "ready" && phase !== "paused") return fail(ack, "Reset the round to start again.");
          phase = "running";
          endsAt = Date.now() + remaining;
          timeout = setTimeout(() => {
            if (expire()) broadcast();
          }, remaining);
          break;
        case "pause":
          if (phase !== "running" || endsAt === null) return fail(ack, "Start the timer before pausing.");
          remaining = Math.max(0, endsAt - Date.now());
          clearTimer();
          phase = remaining ? "paused" : "ended";
          break;
        case "reset":
          reset();
          break;
        case "reset-game": {
          const joined = [...participants.values()];
          participants.clear();
          results = {};
          reset();
          for (const participant of joined) revokeStudent(participant.sockets, "game-reset");
          break;
        }
        case "reveal":
          if (phase === "ready" || phase === "revealed") return fail(ack, "Start a round before revealing its answer.");
          if (endsAt !== null) remaining = Math.max(0, endsAt - Date.now());
          clearTimer();
          phase = "revealed";
          results[game.id] = { answer: answer(), participants: roster() };
          break;
        default:
          return fail(ack, "Unknown presenter action.");
      }
      broadcast();
      if (action === "reset" || action === "reveal") syncStudents();
      ack({ ok: true, value: undefined });
    });

    socket.on("disconnect", () => {
      detach();
      expire();
      broadcast();
    });
  });

  return clearTimer;
}
