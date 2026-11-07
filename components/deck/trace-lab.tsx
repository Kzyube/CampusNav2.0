"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { bfs, connectivity, dfs, dijkstra, findRoute, kruskal, type TraceStep } from "@/lib/algorithms";
import { edgeById, isolatedFEdges, routeText, vertices, type Edge } from "@/lib/graph";
import { playDeckSound } from "./deck-sound";
import { CampusVisual } from "../graph/campus-visual";

const minimumTree = kruskal();
const traces = {
  bfs: { label: "Breadth-first search", steps: bfs().steps, worklist: "Queue · front to back" },
  dfs: { label: "Depth-first search", steps: dfs().steps, worklist: "Call stack · bottom to top" },
  components: { label: "Reachability after closures", steps: connectivity(isolatedFEdges).steps, worklist: "BFS queue" },
  dijkstra: { label: "Distance from A", steps: dijkstra("A", "F", true).steps, worklist: undefined },
  kruskal: { label: "Candidate infrastructure links", steps: minimumTree.steps, worklist: undefined },
};

function Tokens({ label, values }: { label: string; values: string[] }) {
  return <div className="trace-data"><span className="eyebrow">{label}</span><div className="tokens">
    {values.length ? values.map((value, index) => <span key={`${value}-${index}`}>{value}</span>) : <small>Empty</small>}
  </div></div>;
}

function MovingWorklist({ kind, values }: { kind: "bfs" | "dfs"; values: string[] }) {
  const stack = kind === "dfs";
  const reduced = useReducedMotion();
  const ordered = stack ? [...values].reverse() : values;
  return <div className={`worklist worklist--${kind}`}>
    <div className="worklist-title"><span>{stack ? "Call stack" : "Queue"}</span><small>{stack ? "Top leaves first" : "First in, first out"}</small></div>
    <div className="worklist-track" aria-label={stack ? "Stack, top to bottom" : "Queue, front to back"}>
      <AnimatePresence initial={false} mode="popLayout">
        {ordered.map((letter, i) => <motion.span key={letter} layout={reduced ? false : "position"} className="worklist-token"
          data-next={i === 0} initial={reduced ? false : { x: stack ? 0 : 46, y: stack ? -36 : 0, scale: .69, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { x: stack ? 0 : -48, y: stack ? -35 : 0, scale: .78, opacity: 0 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 27 }}>
          <b>{letter}</b>{stack && i === 0 && <small>Top</small>}
        </motion.span>)}
      </AnimatePresence>
      {values.length === 0 && <span className="worklist-empty">Empty</span>}
    </div>
    {!stack && <div className="worklist-direction"><span>← Front</span><span>Back ←</span></div>}
  </div>;
}

function EdgeLedger({ sorted, step }: { sorted: Edge[]; step: TraceStep }) {
  return <div className="edge-ledger">
    <div className="edge-ledger-title"><span className="eyebrow">Edges by weight</span><strong className="edge-total" key={step.total}>{step.total ?? 0} cost units</strong></div>
    <div className="edge-list">
      {sorted.map(edge => {
        const status = step.highlighted?.includes(edge.id) ? "accepted" : step.rejected?.includes(edge.id) ? "rejected" : "pending";
        return <div key={edge.id} className={`edge-item edge-item--${status}${step.active === edge.id ? " is-current" : ""}`}>
          <span>{edge.from}–{edge.to}</span><b>{edge.weight}</b><span aria-label={status}>{status === "accepted" ? "✓" : status === "rejected" ? "×" : "·"}</span>
        </div>;
      })}
    </div>
  </div>;
}

export function TraceLab({ kind }: { kind: keyof typeof traces }) {
  const { steps, label, worklist } = traces[kind];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = steps[index];
  const last = steps.length - 1;
  const active = playing && index < last;
  const showResult = index === last && (kind === "dijkstra" || kind === "kruskal");
  const considered = kind === "kruskal" && step.active ? edgeById.get(step.active) : undefined;
  const cycle = considered && step.activeKind === "reject" ? findRoute(considered.from, considered.to, step.highlighted ?? []) : [];
  const emphasis = considered ? (cycle.length
    ? { route: [...cycle, considered.from], kind: "cycle" as const }
    : { route: [considered.from, considered.to], kind: "accept" as const }) : undefined;

  const stepDuration = cycle.length ? 1750 : 1200;
  const advanceTo = useCallback((next: number) => {
    const destination = steps[next];
    if (next !== index) playDeckSound(destination.activeKind === "reject" ? "reject" : next === last ? "finish" : kind === "kruskal" && destination.active ? "accept" : "step");
    setIndex(next);
  }, [index, kind, last, steps]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => advanceTo(index + 1), stepDuration);
    return () => window.clearTimeout(timer);
  }, [active, advanceTo, index, stepDuration]);

  function go(next: number) {
    setPlaying(false);
    advanceTo(Math.min(last, Math.max(0, next)));
  }

  function play() {
    if (active) return setPlaying(false);
    if (index === last) setIndex(0);
    setPlaying(true);
  }

  return <section className="trace-lab" aria-label={label}>
    <CampusVisual title={label} state={step} emphasis={emphasis} groupLabels={kind === "components" ? step.components?.map((_, i) => `Group ${i + 1}`) : undefined} weights={kind === "dijkstra" || kind === "kruskal"} />
    <div className="trace-console">
      <div className={showResult ? "trace-log trace-log--result" : "trace-log"} aria-live={active ? "off" : "polite"}>
        <span className="eyebrow">Step {String(index + 1).padStart(2, "0")} / {steps.length}</span>
        <h3>{step.title}</h3><p>{step.detail}</p>
      </div>
      {step.worklist && (kind === "bfs" || kind === "dfs")
        ? <MovingWorklist kind={kind} values={step.worklist} />
        : worklist && step.worklist && <Tokens label={worklist} values={step.worklist} />}
      {step.order && <div className="trace-data trace-order"><span className="eyebrow">Visit order</span><strong>{routeText(step.order) || "—"}</strong></div>}
      {step.components && kind === "components" && <Tokens label="Components found" values={step.components.map(group => `{${[...group].sort().join(", ")}}`)} />}
      {step.distances && <div className="distance-grid" aria-label="Tentative distance and predecessor">
        {vertices.map(id => <div key={id} className={step.visited?.includes(id) ? "is-settled" : ""}>
          <span>{id}</span><b>{Number.isFinite(step.distances![id]) ? step.distances![id] : "∞"}</b><small>{step.predecessors?.[id] ? `via ${step.predecessors[id]}` : "—"}</small>
        </div>)}
      </div>}
      {cycle.length > 0 && considered && <div className="cycle-caption">{routeText([...cycle, considered.from])} would close a loop</div>}
      {kind === "kruskal" && <EdgeLedger sorted={minimumTree.sorted} step={step} />}
    </div>
    <div className="trace-controls">
      <button type="button" className="button button--primary" onClick={play}>{active ? <Pause size={16} /> : <Play size={16} />} {active ? "Pause" : "Play"}</button>
      <button type="button" className="button button--secondary" aria-label="Previous step" title="Previous step" disabled={index === 0} onClick={() => go(index - 1)}><ChevronLeft size={17} /></button>
      <button type="button" className="button button--secondary" aria-label="Next step" title="Next step" disabled={index === last} onClick={() => go(index + 1)}><ChevronRight size={17} /></button>
      <button type="button" className="button button--secondary" aria-label="Final step" title="Final step" disabled={index === last} onClick={() => go(last)}><SkipForward size={16} /></button>
      <button type="button" className="button button--secondary" aria-label="Reset trace" title="Reset trace" disabled={index === 0 && !active} onClick={() => go(0)}><RotateCcw size={16} /></button>
      <progress value={index} max={last} aria-label="Trace progress" />
    </div>
  </section>;
}
