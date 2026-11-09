import type { Vertex } from "./graph";

export const roundDuration = 120_000;
export const games = [
  { id: 1, start: "A", target: "F" },
  { id: 2, start: "C", target: "E" },
  { id: 3, start: "B", target: "F" },
] as const;
export type Game = (typeof games)[number];
export type GameResult = { answer: NonNullable<PublicRound["answer"]>; participants: Participant[] };
export type Phase = "ready" | "running" | "paused" | "ended" | "revealed";
export type Action = "start" | "pause" | "reset" | "reset-game" | "reveal";

export type Submission = {
  route: Vertex[];
  start: Vertex;
  target: Vertex;
  weight: number;
  best: number;
  optimal: boolean;
  at: number;
  elapsedMs: number;
  order: number;
};

export type Participant = {
  id: string;
  nickname: string;
  online: boolean;
  submission?: Submission;
};

export function rankCorrectSubmissions(participants: readonly Participant[]) {
  return participants
    .flatMap(participant => participant.submission?.optimal ? [{ ...participant, submission: participant.submission }] : [])
    .sort((a, b) => a.submission.order - b.submission.order);
}

export type PublicRound = {
  id: number;
  game: Game;
  phase: Phase;
  endsAt: number | null;
  remaining: number;
  serverTime: number;
  online: number;
  submitted: number;
  answer?: { route: Vertex[]; distance: number };
};

export type Self = {
  nickname: string;
  submission?: {
    route: Vertex[];
    weight: number;
    best?: number;
    optimal?: boolean;
    answer?: Vertex[];
  };
};

export type Reply<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
export type Ack<T = undefined> = (result: Reply<T>) => void;

export interface FromServer {
  "round": (round: PublicRound) => void;
  "self": (self: Self | null, reason?: "game-reset") => void;
  "games": (results: Partial<Record<Game["id"], GameResult>>) => void;
  "participants": (participants: Participant[]) => void;
}

export interface ToServer {
  "student:restore": (token: string, ack: Ack<boolean>) => void;
  "student:join": (data: { nickname: string }, ack: Ack<string>) => void;
  "student:submit": (data: { roundId: number; start: Vertex; target: Vertex; route: Vertex[] }, ack: Ack) => void;
  "presenter:authorize": (key: string, ack: Ack) => void;
  "presenter:game": (game: Game["id"], ack: Ack) => void;
  "presenter:remove": (id: string, ack: Ack) => void;
  "presenter:control": (action: Action, ack: Ack) => void;
}
