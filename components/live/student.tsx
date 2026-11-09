"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ChevronLeft, CircleCheck, CircleX, Navigation, RotateCcw, Route, Undo2 } from "lucide-react";
import { Brand } from "../brand";
import { NetworkMap } from "../graph/network-map";
import { adjacency, buildingById, edgeById, routeEdges, routeText, type Vertex } from "@/lib/graph";
import { games, type Game, type PublicRound, type Self } from "@/lib/live";
import { connectActivity, getSaved, phaseLabel, save, studentKey, useClock, type ActivitySocket } from "./use-activity";

type Submit = (start: Vertex, target: Vertex, route: Vertex[]) => void;

function RouteBuilder({ phase, onSubmit, busy, game }: { phase: PublicRound["phase"]; onSubmit: Submit; busy: boolean; game: Game }) {
  const { start, target } = game;
  const [route, setRoute] = useState<Vertex[]>([start]);
  const [selectionHint, setSelectionHint] = useState("");
  const current = route[route.length - 1];
  const routeLinks = routeEdges(route);
  const reached = current === target && route.length > 1;
  const neighbors = adjacency[current].filter(neighbor => !route.includes(neighbor.id));
  const weight = routeLinks.reduce((sum, id) => sum + edgeById.get(id)!.weight, 0);
  function step(id: Vertex) {
    if (reached) return setSelectionHint("Destination reached. Undo the last step to change your route.");
    if (route.includes(id)) return setSelectionHint("That building is already in your route.");
    if (!neighbors.some(neighbor => neighbor.id === id)) return setSelectionHint(`There’s no direct walkway from ${current} to ${id}.`);
    setRoute([...route, id]);
    setSelectionHint("");
  }
  function restart(next: Vertex = start) { setRoute([next]); setSelectionHint(""); }

  return <>
    <div className="student-map"><NetworkMap state={{ highlighted: routeLinks, visited: route, current }} onSelect={step} selected={current} label="Campus map. Select an adjacent building to add it to your route." /></div>
    <div className="route-readout">
      <div><span className="eyebrow">Your route</span><strong aria-live="polite">{routeText(route)}</strong></div>
      <div><span className="eyebrow">Distance</span><strong>{weight} <small>units</small></strong></div>
    </div>
    <div className="route-options">
      <span className="field-caption">{reached ? "Destination reached." : `Next walkway from ${current}`}</span>
      {!reached && <div className="neighbors">{neighbors.map(({ id, weight }) => <button className="button button--secondary" type="button" key={id} onClick={() => step(id)}><b>{id}</b> {buildingById[id].label}<small>+{weight}</small></button>)}
        {!neighbors.length && <span>Undo a step to try another walkway.</span>}</div>}
      {selectionHint && <p className="form-hint" role="status">{selectionHint}</p>}
    </div>
    <div className="route-actions">
      <button type="button" className="button button--secondary" disabled={route.length < 2} onClick={() => { setRoute(route.slice(0, -1)); setSelectionHint(""); }}><Undo2 size={16} /> Undo</button>
      <button type="button" className="button button--secondary" disabled={route.length < 2} onClick={() => restart()}><RotateCcw size={16} /> Clear</button>
      <button type="button" className="button button--primary" disabled={!reached || phase !== "running" || busy} onClick={() => onSubmit(start, target, route)}>
        {busy ? "Sending…" : "Submit route"} <ArrowRight size={17} />
      </button>
    </div>
    {phase !== "running" && <p className="form-hint">{phase === "ready" ? "You can plan your route while you wait for the presenter to start the timer." : "The round is closed for submissions."}</p>}
  </>;
}

export function StudentActivity() {
  const socket = useRef<ActivitySocket | null>(null);
  const token = useRef<string | null>(null);
  const [online, setOnline] = useState(false);
  const [round, setRound] = useState<PublicRound | null>(null);
  const [self, setSelf] = useState<Self | null>(null);
  const [nickname, setNickname] = useState("");
  const [restoring, setRestoring] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const clock = useClock(round);

  useEffect(() => {
    const client = connectActivity();
    socket.current = client;
    token.current = getSaved(studentKey);
    client.on("round", setRound);
    client.on("self", (next, reason) => {
      if (!next && (token.current || reason === "game-reset")) {
        token.current = null;
        save(studentKey, null);
        setMessage(reason === "game-reset"
          ? "The presenter reset the game. Join again to play."
          : "Your participant entry is no longer active. Join again to play.");
        setBusy(false);
      }
      setSelf(next);
    });
    client.on("disconnect", () => { setOnline(false); setBusy(false); });
    client.on("connect", () => {
      setOnline(true);
      if (!token.current) { setRestoring(false); return; }
      setRestoring(true);
      client.timeout(4500).emit("student:restore", token.current, (error, reply) => {
        if (!error && reply.ok && !reply.value) {
          token.current = null;
          save(studentKey, null);
        }
        setRestoring(false);
      });
    });
    client.connect();
    return () => { client.removeAllListeners(); client.disconnect(); socket.current = null; };
  }, []);

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online || busy) return;
    setBusy(true);
    setMessage("");
    socket.current?.timeout(5000).emit("student:join", { nickname }, (error, reply) => {
      setBusy(false);
      if (error) return setMessage("The connection timed out. Try joining again.");
      if (!reply.ok) return setMessage(reply.error);
      token.current = reply.value;
      save(studentKey, reply.value);
    });
  }

  function submit(start: Vertex, target: Vertex, route: Vertex[]) {
    if (!online || !round || busy) return;
    setMessage("");
    setBusy(true);
    socket.current?.timeout(5000).emit("student:submit", { roundId: round.id, start, target, route }, (error, reply) => {
      setBusy(false);
      if (error) return setMessage("The connection timed out. Reconnect to check your submission.");
      if (!reply.ok) setMessage(reply.error);
    });
  }

  const game = round?.game ?? games[0];
  const revealed = round?.phase === "revealed";
  const submission = self?.submission;
  const verdict = revealed && submission?.optimal !== undefined && submission.best !== undefined
    ? { correct: submission.optimal, difference: submission.weight - submission.best }
    : null;
  return <div className="live-page student-page">
    <header className="live-header"><Brand /><span className="eyebrow"><span className={`status-dot ${online ? "is-online" : ""}`} />{!online ? "Connecting" : self ? "Connected" : "Ready to join"}</span></header>
    <main className="student-main">
      <div className="student-title">
        <span className="eyebrow"><Navigation size={15} /> Classroom activity / Game {game.id}</span>
        <h1>The shortest route</h1>
        <p>Find the route with the lowest total distance.</p>
        <div className="student-endpoints" role="group" aria-label="Route endpoints">
          <div className="student-endpoint">
            <span className="eyebrow">From · Start</span>
            <div><b>{game.start}</b><strong>{buildingById[game.start].name}</strong></div>
          </div>
          <ArrowRight className="student-endpoint-arrow" size={19} aria-hidden="true" />
          <div className="student-endpoint student-endpoint--destination">
            <span className="eyebrow">To · Destination</span>
            <div><b>{game.target}</b><strong>{buildingById[game.target].name}</strong></div>
          </div>
        </div>
      </div>
      <div className="round-ribbon">
        <span><span className={`status-dot ${round?.phase === "running" ? "is-online" : ""}`} />{!online ? "Reconnecting to the laptop" : round ? phaseLabel[round.phase] : "Connecting"}</span>
        <strong aria-label="Time remaining">{clock}</strong>
      </div>
      {!self ? <section className="student-panel">
        <h2>Join the round</h2>
        <form onSubmit={join}>
          <label>Nickname<input type="text" value={nickname} maxLength={24} required autoComplete="nickname" placeholder="e.g. Alex" onChange={event => setNickname(event.target.value)} /></label>
          <button className="button button--primary" type="submit" disabled={!online || busy || restoring || !nickname.trim()}>{busy ? "Joining…" : "Join activity"} <ArrowRight size={18} /></button>
        </form>
        {!online && <p className="form-hint">Connect to the classroom hotspot and keep this page open.</p>}
      </section> : <section className="student-panel">
        <div className="student-panel-title"><h2>{revealed ? "Your result" : submission ? "Submission received" : "Build your route"}</h2><span>{self.nickname}</span></div>
        <div role="status" aria-atomic="true">
          {submission ? <div className="submission-receipt">
            {verdict && <div className={`submission-verdict submission-verdict--${verdict.correct ? "correct" : "incorrect"}`}>
              {verdict.correct ? <CircleCheck size={23} aria-hidden="true" /> : <CircleX size={23} aria-hidden="true" />}
              <strong>{verdict.correct ? "Correct" : "Incorrect"}</strong>
            </div>}
            <div><Route size={20} aria-hidden="true" /><strong>{routeText(submission.route)}</strong><span>{submission.weight} units</span></div>
            <p>{!verdict ? "Your route is locked in. Wait for the presenter to reveal the answer." :
              verdict.correct ? "You found a shortest route." : `Your route was ${verdict.difference} units longer than a shortest route.`}</p>
          </div> : revealed && <p className="form-hint">You did not submit a route this round.</p>}
        </div>
        {!submission && !revealed && round && <RouteBuilder game={game} key={round.id} phase={round.phase} onSubmit={submit} busy={busy || !online} />}
      </section>}
      {message && <p className="form-error" role="alert">{message}</p>}
      {round?.answer && <aside className="revealed-answer"><span className="eyebrow">Class challenge answer</span><strong>{routeText(round.answer.route)}</strong><p>{round.answer.distance} distance units</p></aside>}
      <Link className="live-back" href="/"><ChevronLeft size={16} /> Back to the presentation</Link>
    </main>
  </div>;
}
