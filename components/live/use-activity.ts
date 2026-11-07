"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { FromServer, PublicRound, ToServer } from "@/lib/live";

export type ActivitySocket = Socket<FromServer, ToServer>;
export const studentKey = "campusnav:student";
export const presenterKey = "campusnav:presenter";

export function getSaved(key: string, session = false) {
  try { return (session ? sessionStorage : localStorage).getItem(key); }
  catch { return null; }
}

export function save(key: string, value: string | null, session = false) {
  try {
    const storage = session ? sessionStorage : localStorage;
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch { /* The activity still works for the current connection. */ }
}

export function connectActivity(): ActivitySocket {
  return io({ autoConnect: false });
}

export function useClock(round: PublicRound | null) {
  const [now, setNow] = useState(0);
  const [offset, setOffset] = useState(0);
  const serverTime = round?.serverTime;
  const endsAt = round?.endsAt;
  useEffect(() => {
    if (serverTime === undefined || endsAt == null) return;
    const receipt = Date.now();
    const schedule = window.setTimeout(() => { setOffset(serverTime - receipt); setNow(receipt); }, 0);
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearTimeout(schedule); window.clearInterval(interval); };
  }, [serverTime, endsAt]);
  const remaining = Math.max(0, endsAt && now ? endsAt - now - offset : round?.remaining ?? 120_000);
  const seconds = Math.ceil(remaining / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export const phaseLabel = {
  ready: "Waiting to start",
  running: "Submissions open",
  paused: "Paused",
  ended: "Time is up",
  revealed: "Answer revealed",
};
