import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import { io, type Socket } from "socket.io-client";
import { rankCorrectSubmissions } from "../lib/live";
import type { FromServer, Game, GameResult, Participant, PublicRound, Reply, Self, ToServer } from "../lib/live";

type Client = Socket<FromServer, ToServer>;

const probe = createServer().listen(0, "0.0.0.0");
await once(probe, "listening");
const address = probe.address();
assert.ok(address && typeof address === "object");
const port = address.port;
await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
const local = `http://127.0.0.1:${port}`;
const key = "campusnav-integration-code";
const server = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
  env: { ...process.env, PORT: String(port), PRESENTER_KEY: key, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
const clients: Client[] = [];
let logs = "";
server.stdout.on("data", data => { logs += data; });
server.stderr.on("data", data => { logs += data; });

function connect(origin: string) {
  const client: Client = io(origin, { autoConnect: false, reconnection: false, forceNew: true, timeout: 4000 });
  clients.push(client);
  return client;
}

function open(client: Client) {
  return new Promise<void>((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
    client.connect();
  });
}

function success<T>(reply: Reply<T>) {
  if (!reply.ok) assert.fail(reply.error);
  return reply.value;
}

try {
  let response: Response | undefined;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error("CampusNav exited during startup. Run npm run build before the integration test.");
    response = await fetch(`${local}/api/network`).catch(() => undefined);
    if (response?.ok) break;
    await sleep(200);
  }
  assert.ok(response?.ok, "Custom server did not start");
  const network = await response.json() as { selected: string | null; qr: string | null };
  const lan = network.selected ? new URL(network.selected).origin : local;
  if (network.selected) {
    assert.ok(network.selected.endsWith(`:${port}/join`));
    assert.ok(network.qr?.startsWith("data:image/png;base64,"));
  }
  for (const [path, content] of [["/", "CampusNav"], ["/?slide=17", "CampusNav Challenge"], ["/join", "Join the round"], ["/admin", "Presenter controls"], ["/notes", "Follows the deck"]]) {
    const page = await fetch(`${lan}${path}`);
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes(content), `${path} should serve ${content}`);
  }
  const crossOrigin = await fetch(`${lan}/socket.io/?EIO=4&transport=polling`, { headers: { Origin: "http://other.invalid" } });
  assert.equal(crossOrigin.status, 403);

  const admin = connect(local);
  const alice = connect(lan);
  const ben = connect(lan);
  const casey = connect(lan);
  let publicRound: PublicRound | undefined;
  let roster: Participant[] = [];
  let games: Partial<Record<Game["id"], GameResult>> = {};
  admin.on("games", results => { games = results; });
  let aliceState: Self | null = null;
  let benState: Self | null = null;
  alice.on("round", state => { publicRound = state; });
  alice.on("self", state => { aliceState = state; });
  ben.on("self", state => { benState = state; });
  admin.on("participants", entries => { roster = entries; });
  const unexpectedReceipts: (Self | null)[] = [];
  admin.on("self", state => unexpectedReceipts.push(state));
  await Promise.all([open(admin), open(alice), open(ben), open(casey)]);


  assert.equal((await admin.timeout(4000).emitWithAck("presenter:authorize", "wrong")).ok, false);
  success(await admin.timeout(4000).emitWithAck("presenter:authorize", key));
  assert.equal((await alice.timeout(4000).emitWithAck("presenter:control", "start")).ok, false);

  const token = success(await alice.timeout(4000).emitWithAck("student:join", { nickname: "Alice" }));
  if (typeof token !== "string") throw new Error("Expected a participant token.");
  assert.equal((await ben.timeout(4000).emitWithAck("student:join", { nickname: " alice " })).ok, false);
  success(await ben.timeout(4000).emitWithAck("student:join", { nickname: "Ben" }));
  success(await casey.timeout(4000).emitWithAck("student:join", { nickname: "Casey" }));

  async function until(predicate: () => boolean, label: string) {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (predicate()) return;
      await sleep(25);
    }
    assert.fail(label);
  }

  await until(() => publicRound?.online === 3 && roster.length === 3, "All three participants should appear");
  const roundId = publicRound!.id;
  const best = { roundId, start: "A", target: "F", route: ["A", "C", "B", "D", "E", "F"] } as const;
  const optimal = { ...best, route: [...best.route] };
  assert.equal((await alice.timeout(4000).emitWithAck("student:submit", optimal)).ok, false);
  success(await admin.timeout(4000).emitWithAck("presenter:control", "start"));
  await until(() => publicRound?.phase === "running", "Round should start");
  assert.ok(publicRound!.endsAt! > Date.now());
  assert.equal(publicRound!.answer, undefined);
  assert.equal((await alice.timeout(4000).emitWithAck("student:submit", { ...optimal, route: ["A", "F"] })).ok, false);
  success(await ben.timeout(4000).emitWithAck("student:submit", { ...optimal, route: ["A", "B", "F"] }));
  await until(() => benState?.submission?.weight === 16, "Ben should receive confirmation without a grade");
  assert.equal((benState as Self | null)?.submission?.optimal, undefined);
  success(await alice.timeout(4000).emitWithAck("student:submit", optimal));
  await until(() => aliceState?.submission?.weight === 13, "Alice should receive confirmation");
  assert.equal((aliceState as Self | null)?.submission?.best, undefined);
  assert.equal((await alice.timeout(4000).emitWithAck("student:submit", optimal)).ok, false);

  success(await admin.timeout(4000).emitWithAck("presenter:control", "pause"));
  await until(() => publicRound?.phase === "paused", "Round should pause");
  assert.equal(publicRound!.endsAt, null);
  const alternate = { roundId, start: "C", target: "E", route: ["C", "E"] } as const;
  assert.equal((await casey.timeout(4000).emitWithAck("student:submit", optimal)).ok, false);
  await sleep(180);
  success(await admin.timeout(4000).emitWithAck("presenter:control", "start"));
  assert.equal((await casey.timeout(4000).emitWithAck("student:submit", { ...alternate, route: [...alternate.route] })).ok, false);
  success(await casey.timeout(4000).emitWithAck("student:submit", optimal));

  alice.disconnect();
  await until(() => roster.some(row => row.nickname === "Alice" && !row.online), "Roster should mark Alice offline");
  const refreshed = connect(lan);
  let refreshedState: Self | null = null;
  refreshed.on("self", state => { refreshedState = state; });
  await open(refreshed);
  assert.equal(success(await refreshed.timeout(4000).emitWithAck("student:restore", token)), true);
  await until(() => refreshedState?.submission?.weight === 13 && roster.some(row => row.nickname === "Alice" && row.online), "Refresh should restore submission and status");
  assert.equal((await refreshed.timeout(4000).emitWithAck("student:submit", optimal)).ok, false);

  success(await admin.timeout(4000).emitWithAck("presenter:control", "reveal"));
  await until(() => refreshedState?.submission?.optimal === true && benState?.submission?.optimal === false && !!games[1], "Reveal should notify correct and incorrect students and save the results");
  const game1 = games[1]!.participants;
  const earlyIncorrect = game1.find(row => row.nickname === "Ben")!.submission!;
  const firstCorrect = game1.find(row => row.nickname === "Alice")!.submission!;
  const laterCorrect = game1.find(row => row.nickname === "Casey")!.submission!;
  assert.ok(earlyIncorrect.order < firstCorrect.order && firstCorrect.order < laterCorrect.order);
  assert.deepEqual(rankCorrectSubmissions(game1).map(row => row.nickname), ["Alice", "Casey"]);
  assert.ok(laterCorrect.at - firstCorrect.at - (laterCorrect.elapsedMs - firstCorrect.elapsedMs) >= 180, "Finish time should exclude the paused interval");
  ben.disconnect();
  await until(() => roster.some(row => row.nickname === "Ben" && !row.online), "Roster should mark Ben offline");
  let revealed: PublicRound | undefined;
  refreshed.on("round", state => { revealed = state; });
  const late = connect(lan);
  late.on("round", state => { revealed = state; });
  await open(late);
  await until(() => revealed?.answer?.distance === 13, "Late clients should get the revealed answer");
  assert.deepEqual(revealed!.answer!.route, best.route);
  assert.equal((refreshedState as Self | null)?.nickname, "Alice");
  assert.deepEqual(unexpectedReceipts, [], "Offline participants must not broadcast private receipts");

  success(await admin.timeout(4000).emitWithAck("presenter:control", "reset"));
  await until(() => revealed?.phase === "ready" && revealed.id === roundId + 1 && roster.every(row => !row.submission) && !refreshedState?.submission, "Reset should open a fresh round and clear saved answers");
  assert.deepEqual(unexpectedReceipts, [], "Reset must not broadcast private receipts");
  success(await admin.timeout(4000).emitWithAck("presenter:control", "start"));
  assert.equal((await refreshed.timeout(4000).emitWithAck("student:submit", optimal)).ok, false);
  success(await refreshed.timeout(4000).emitWithAck("student:submit", { ...optimal, roundId: roundId + 1 }));

  assert.equal((await refreshed.timeout(4000).emitWithAck("presenter:remove", roster[0].id)).ok, false);
  success(await admin.timeout(4000).emitWithAck("presenter:remove", roster.find(row => row.nickname === "Alice")!.id));
  await until(() => refreshedState === null && !roster.some(row => row.nickname === "Alice"), "Remove must invalidate an online participant");
  assert.equal(success(await refreshed.timeout(4000).emitWithAck("student:restore", token)), false);
  assert.ok(games[1]?.participants.some(row => row.nickname === "Alice"), "Removal must preserve completed results");
  assert.equal((await admin.timeout(4000).emitWithAck("presenter:game", 2)).ok, false);
  success(await admin.timeout(4000).emitWithAck("presenter:control", "reset"));
  const danaToken = success(await late.timeout(4000).emitWithAck("student:join", { nickname: "Dana" }));
  if (typeof danaToken !== "string") throw new Error("Expected a participant token.");
  for (const [game, distance, start, target, route] of [[2, 8, "C", "E", ["C", "B", "D", "E"]], [3, 10, "B", "F", ["B", "D", "E", "F"]]] as const) {
    success(await admin.timeout(4000).emitWithAck("presenter:game", game));
    await until(() => revealed?.game.id === game, "Students must receive the new game");
    success(await admin.timeout(4000).emitWithAck("presenter:control", "start"));
    success(await late.timeout(4000).emitWithAck("student:submit", { roundId: revealed!.id, start, target, route: [...route] }));
    success(await admin.timeout(4000).emitWithAck("presenter:control", "reveal"));
    await until(() => games[game]?.answer.distance === distance && games[game]?.participants.some(row => row.nickname === "Dana" && row.submission?.optimal), "Each game must retain its own result");
  }
  assert.equal(games[1]?.answer.distance, 13);

  const oldRound = revealed!.id;
  let resetNotice: string | undefined;
  let caseyReset = false;
  late.on("self", (state, reason) => { if (state === null) resetNotice = reason; });
  casey.on("self", (state, reason) => { if (state === null && reason === "game-reset") caseyReset = true; });
  assert.equal((await late.timeout(4000).emitWithAck("presenter:control", "reset-game")).ok, false);
  success(await admin.timeout(4000).emitWithAck("presenter:control", "reset-game"));
  await until(() => resetNotice === "game-reset" && caseyReset && revealed?.phase === "ready" && revealed.id === oldRound + 1 &&
    revealed.online === 0 && revealed.submitted === 0 && !revealed.answer && roster.length === 0 &&
    Object.keys(games).length === 0, "Reset Game must clear every result, empty the roster, and send phones back to join");
  assert.equal(revealed!.game.id, 3, "The selected game should stay loaded");
  assert.equal(success(await late.timeout(4000).emitWithAck("student:restore", danaToken)), false);
  const newToken = success(await late.timeout(4000).emitWithAck("student:join", { nickname: "Dana" }));
  assert.notEqual(newToken, danaToken);
  await until(() => roster.some(row => row.nickname === "Dana"), "A phone can join again under the same name");

  console.log(`Passed production HTTP and Socket.IO integration at ${lan} with multiple clients, fixed endpoints, reconnect, removal, ranked results, and full game reset.`);
} catch (error) {
  if (logs) console.error(logs.replace(/Presenter code\s+[^\n]*/g, "Presenter code [redacted]"));
  throw error;
} finally {
  for (const client of clients) client.disconnect();
  if (server.exitCode === null) {
    server.kill();
    await once(server, "exit");
  }
}
