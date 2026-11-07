"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Eye, LockKeyhole, Pause, Play, RotateCcw, Users } from "lucide-react";
import { Brand } from "../brand";
import { routeText } from "@/lib/graph";
import { games, type Action, type Game, type GameResult, type Participant, type PublicRound } from "@/lib/live";
import { JoinCode } from "./join-code";
import { connectActivity, getSaved, phaseLabel, presenterKey, save, useClock, type ActivitySocket } from "./use-activity";

function ParticipantTable({ participants, revealed = false, onRemove }: { participants: Participant[]; revealed?: boolean; onRemove?: (participant: Participant) => void }) {
  const ranked = participants.filter(({ submission }) => submission)
    .sort((a, b) => a.submission!.weight - b.submission!.weight || a.submission!.at - b.submission!.at);
  const winner = ranked[0];
  const ranks = new Map(ranked.map((participant, index) => [participant.id, index + 1]));
  const rows = revealed ? [...ranked, ...participants.filter(participant => !ranks.has(participant.id))] : participants;

  return <section className="roster">
    <div className="roster-title"><h2>{revealed ? "Class challenge results" : "Participants"}</h2><span><Users size={16} /> {participants.length} joined</span></div>
    {revealed && <p role="status">{winner ? <>Winner <strong>{winner.nickname}</strong> · {winner.submission!.weight} units</> : "No winner. Nobody submitted a valid route."}</p>}
    {!rows.length ? <div className="roster-empty">Participant names and submissions appear here as classmates join.</div> :
      <div className="roster-table"><table>
        <thead><tr>{revealed && <th scope="col">Rank</th>}<th scope="col">Nickname</th>{!revealed && <th scope="col">Connection</th>}<th scope="col">Route</th><th scope="col">Distance</th><th scope="col">Status</th>{onRemove && <th scope="col">Manage</th>}</tr></thead>
        <tbody>{rows.map(({ id, nickname, online, submission }) => <tr key={id}>
          {revealed && <td className="mono">{ranks.get(id) ?? "—"}</td>}
          <th scope="row">{nickname}</th>{!revealed && <td><span className={`status-dot ${online ? "is-online" : ""}`} />{online ? "Online" : "Offline"}</td>}
          <td className="mono">{submission ? routeText(submission.route) : "—"}</td>
          <td>{submission ? `${submission.weight} units` : "—"}</td>
          <td>{!submission ? (revealed ? "Did not submit" : "Waiting") : !revealed ? "Submitted" : id === winner?.id ? "Winner" : `${id === ranked.at(-1)?.id ? "Last place" : "Runner-up"} · ${submission.optimal ? "shortest route" : `+${submission.weight - submission.best} units`}`}</td>
          {onRemove && <td><button type="button" className="button button--secondary" aria-label={`Remove ${nickname}`} onClick={() => onRemove({ id, nickname, online, submission })}>Remove</button></td>}
        </tr>)}</tbody>
      </table></div>}
    {revealed && <p className="form-hint">Valid routes rank by distance, then submission time. The last ranked entry is the lowest finisher.</p>}
  </section>;
}

export function PresenterConsole() {
  const socket = useRef<ActivitySocket | null>(null);
  const [online, setOnline] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [key, setKey] = useState("");
  const [round, setRound] = useState<PublicRound | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<Partial<Record<Game["id"], GameResult>>>({});
  const [selected, setSelected] = useState<Game["id"]>(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const clock = useClock(round);

  function authorize(client: ActivitySocket, code: string, manual: boolean) {
    if (manual) { setBusy(true); setMessage(""); }
    client.timeout(5000).emit("presenter:authorize", code, (error, reply) => {
      setBusy(false);
      if (error || !reply.ok) {
        if (manual) setMessage(!error && !reply.ok ? reply.error : "The server took too long to respond.");
        return;
      }
      setAuthorized(true);
      if (code) save(presenterKey, code, true);
    });
  }

  useEffect(() => {
    const client = connectActivity();
    socket.current = client;
    client.on("round", setRound);
    client.on("participants", setParticipants);
    client.on("games", setResults);
    client.on("connect", () => {
      setOnline(true);
      authorize(client, getSaved(presenterKey, true) ?? "", false);
    });
    client.on("disconnect", () => { setOnline(false); setAuthorized(false); setBusy(false); });
    client.connect();
    return () => { client.removeAllListeners(); client.disconnect(); socket.current = null; };
  }, []);

  function send(command: ["presenter:control", Action] | ["presenter:game", Game["id"]] | ["presenter:remove", string]) {
    if (!online || !authorized || busy || !socket.current) return;
    setMessage("");
    setBusy(true);
    const client = socket.current.timeout(5000);
    const [event, value] = command;
    const done = (error: Error | null, reply: import("@/lib/live").Reply) => {
      setBusy(false);
      if (error) setMessage("The server took too long to respond.");
      else if (!reply.ok) setMessage(reply.error);
    };
    if (event === "presenter:control") client.emit(event, value, done);
    else if (event === "presenter:game") client.emit(event, value, done);
    else client.emit(event, value, done);
  }

  function control(action: Action) {
    if (action === "reset" && round?.submitted && !window.confirm("Discard submissions for this attempt?")) return;
    send(["presenter:control", action]);
  }

  function remove(participant: Participant) {
    if (window.confirm(`Remove ${participant.nickname} from the live roster?`)) send(["presenter:remove", participant.id]);
  }

  function unlock(event: FormEvent) {
    event.preventDefault();
    if (socket.current?.connected) authorize(socket.current, key.trim(), true);
  }

  const phase = round?.phase;
  const game = games.find(game => game.id === selected)!;
  const result = results[selected];
  return <div className="live-page admin-page">
    <header className="live-header"><Brand /><Link className="button button--secondary" href="/">Open presentation <ArrowUpRight size={16} /></Link></header>
    <main className="admin-main">
      <div className="admin-title">
        <div><span className="eyebrow">Chapter 7 / Live session</span><h1>Presenter controls</h1><p>Run three shortest-route games on the classroom network.</p></div>
        <span className="eyebrow"><span className={`status-dot ${online ? "is-online" : ""}`} />{online ? "Server connected" : "Reconnecting"}</span>
      </div>
      {!authorized ? <section className="unlock-panel">
        <LockKeyhole size={26} /><h2>Unlock the console</h2><p>Use the presenter code from the laptop’s server terminal.</p>
        <form onSubmit={unlock}>
          <label>Presenter code<input type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} required /></label>
          <button className="button button--primary" type="submit" disabled={!online || !key.trim() || busy}>Unlock controls</button>
        </form>
      </section> : <>
        <div className="admin-top">
          <section className="control-board">
            <div className="control-head"><span className="eyebrow">{round ? `Game ${round.game.id} · ${round.game.start} → ${round.game.target}` : "Loading game"}</span><span><span className={`status-dot ${phase === "running" ? "is-online" : ""}`} />{phase ? phaseLabel[phase] : "Connecting"}</span></div>
            <div className="control-clock"><strong aria-label="Time remaining">{clock}</strong><div><span>{round?.online ?? 0} online</span><span>{round?.submitted ?? 0} submitted</span></div></div>
            <div className="control-actions">
              <button type="button" className="button button--primary" disabled={busy || (phase !== "ready" && phase !== "paused")} onClick={() => control("start")}><Play size={15} /> {phase === "paused" ? "Resume" : "Start round"}</button>
              <button type="button" className="button button--secondary" disabled={busy || phase !== "running"} onClick={() => control("pause")}><Pause size={15} /> Pause</button>
              <button type="button" className="button button--secondary" disabled={busy || !phase || phase === "ready" || phase === "revealed"} onClick={() => control("reveal")}><Eye size={16} /> Reveal answer</button>
              <button type="button" className="button button--secondary" disabled={busy || !phase} onClick={() => control("reset")}><RotateCcw size={15} /> Reset round</button>
            </div>
            {round?.answer && <div className="control-answer"><span className="eyebrow">Shortest route</span><strong>{routeText(round.answer.route)} · {round.answer.distance} units</strong></div>}
          </section>
          <JoinCode />
        </div>
        <section className="roster" aria-label="Game details">
          <div className="control-actions" aria-label="Games">
            {games.map(item => <button key={item.id} type="button" className="button button--secondary" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>Game {item.id}</button>)}
          </div>
          <h2>Game {game.id} · {game.start} → {game.target}</h2>
          <p className="form-hint">{round?.game.id === selected ? "Current game" : "Use Load game to switch everyone to this route."}</p>
          <button type="button" className="button button--primary" disabled={busy || (phase !== "ready" && phase !== "revealed") || (phase === "ready" && round?.game.id === selected)}
            onClick={() => send(["presenter:game", selected])}>{round?.game.id === selected ? "Play again" : "Load game"}</button>
          {result ? <>
            <p className="form-hint">Latest completed game · {routeText(result.answer.route)} · {result.answer.distance} units</p>
            <ParticipantTable participants={result.participants} revealed />
          </> : <p className="form-hint">Results appear here after the presenter reveals the answer.</p>}
        </section>
        <ParticipantTable participants={participants} onRemove={remove} />
      </>}
      {message && <p className="form-error" role="alert">{message}</p>}
    </main>
  </div>;
}
