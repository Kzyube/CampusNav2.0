"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowRight, Check, ChevronLeft, Navigation, RotateCcw, Undo2 } from "lucide-react";
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
    client.on("self", next => {
      if (!next && token.current) {
        token.current = null;
        save(studentKey, null);
        setMessage("Your participant entry was removed. Join again to play.");
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
  return <div className="live-page student-page">
    <header className="live-header"><Brand /><span className="eyebrow"><span className={`status-dot ${online ? "is-online" : ""}`} />{online ? "Connected" : "Connecting"}</span></header>
    <main className="student-main">
      <div className="student-title">
        <span className="eyebrow"><Navigation size={15} /> Classroom activity / Game {game.id}</span>
        <h1>The shortest route</h1>
        <p>Find the lowest-distance route from {buildingById[game.start].name} ({game.start}) to {buildingById[game.target].name} ({game.target}).</p>
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
        <div className="student-panel-title"><h2>{self.submission ? "Submission received" : "Build your route"}</h2><span>{self.nickname}</span></div>
        {self.submission ? <div className="submission-receipt">
          <div><Check size={20} /><strong>{routeText(self.submission.route)}</strong><span>{self.submission.weight} units</span></div>
          <p>{self.submission.best === undefined ? "Your route is locked in. Wait for the presenter to reveal the answer." :
            self.submission.optimal ? "You found a shortest route for your endpoints." : `Your route is ${self.submission.weight - self.submission.best} units longer than the shortest route for your endpoints.`}</p>
          {self.submission.answer && <p className="answer-inline"><ArrowDownRight size={17} /> Best route · {routeText(self.submission.answer)} · {self.submission.best} units</p>}
        </div> : round && <RouteBuilder game={game} key={round.id} phase={round.phase} onSubmit={submit} busy={busy || !online} />}
      </section>}
      {message && <p className="form-error" role="alert">{message}</p>}
      {round?.answer && <aside className="revealed-answer"><span className="eyebrow">Class challenge answer</span><strong>{routeText(round.answer.route)}</strong><p>{round.answer.distance} distance units</p></aside>}
      <Link className="live-back" href="/"><ChevronLeft size={16} /> Back to the presentation</Link>
    </main>
  </div>;
}
