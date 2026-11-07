"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Cable, MapPin, Navigation, Radio, Waypoints } from "lucide-react";
import { bfs, connectivity, dfs, findRoute, kruskal, type GraphState } from "@/lib/algorithms";
import { adjacency, edges, edgeById, edgeId, isolatedFEdges, routeText, vertices, type EdgeId, type Vertex } from "@/lib/graph";
import { type Layout, presenters, slides } from "@/lib/slides";
import { CampusVisual } from "../graph/campus-visual";
import { JoinCode } from "../live/join-code";
import { playDeckSound } from "./deck-sound";
import { PhoneWalkthrough } from "./phone-walkthrough";
import { TeamFinale } from "./team-finale";
import { TraceLab } from "./trace-lab";
import { QuestionSlide } from "./question-slide";
import { ScrollLesson } from "./scroll-lesson";

const mst = kruskal();
const maxSteps = bfs().order;
const depths = new Map<Vertex, number>([["A", 0]]);
for (const step of bfs().steps) {
  if (!step.active || !step.current) continue;
  const edge = edgeById.get(step.active)!;
  const next = edge.from === step.current ? edge.to : edge.from;
  depths.set(next, depths.get(step.current)! + 1);
}

function MapKey({ entries }: { entries: [string, string][] }) {
  return <dl className="map-key">{entries.map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl>;
}

function Problem() {
  return <div className="problem-layout">
    <div className="problem-lanes">
      <article><span className="eyebrow"><Navigation size={17} /> Wayfinding</span><h3>A route for one student</h3><p>From Administration to the Student Center, with the smallest total walking distance.</p><div className="route-strip"><b>A</b><span /><ArrowRight size={23} /><b>F</b></div></article>
      <article><span className="eyebrow"><Cable size={17} /> Infrastructure</span><h3>A network for six buildings</h3><p>Connect the entire campus with the smallest total conduit cost.</p><div className="route-strip route-strip--many">{vertices.map(id => <b key={id}>{id}</b>)}</div></article>
    </div>
  </div>;
}

const terms: { label: string; text: string; state: GraphState }[] = [
  { label: "Vertex", text: "B is the Library. Each building is one vertex, also called a node.", state: { current: "B" } },
  { label: "Edge", text: "A–C is a walkway. The connection works in both directions.", state: { highlighted: ["A-C"] } },
  { label: "Weight", text: "A–C has weight 2. We can read it as distance or installation cost.", state: { active: "A-C" } },
  { label: "Degree", text: "B has degree 4. It touches the edges to A, C, D, and F.", state: { current: "B", highlighted: adjacency.B.map(edge => edge.edge) } },
  { label: "Path", text: "A → C → B is a path. Each pair is adjacent and no building repeats.", state: { highlighted: ["A-C", "B-C"], visited: ["A", "C", "B"] } },
  { label: "Cycle", text: "A → B → C → A closes a loop. Only the start and end repeat.", state: { highlighted: ["A-B", "A-C", "B-C"] } },
];

function Terminology() {
  return <ScrollLesson featured steps={terms} renderVisual={index =>
    <CampusVisual title="Buildings, edges and weights" state={terms[index].state} allow3D={false} />
  } />;
}

function Storage() {
  const [highlight, setHighlight] = useState<Vertex>("B");
  return <div className="storage-layout">
    <div className="storage-side">
      <div className="section-label"><h3>Adjacency matrix</h3><span>O(V²) space</span></div>
      <table className="matrix-table" aria-label="Weighted adjacency matrix">
        <thead><tr><th scope="col"><span className="sr-only">Building</span></th>{vertices.map(id => <th scope="col" key={id}>{id}</th>)}</tr></thead>
        <tbody>{vertices.map(from => <tr className={highlight === from ? "is-marked" : ""} key={from}>
          <th scope="row"><button type="button" onClick={() => setHighlight(from)} aria-pressed={highlight === from} aria-label={`Highlight row ${from}`}>{from}</button></th>
          {vertices.map(to => <td key={to}>{edgeById.get(edgeId(from, to))?.weight ?? "—"}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <div className="storage-side">
      <div className="section-label"><h3>Adjacency list</h3><span>O(V + E) space</span></div>
      <div className="neighbor-table">{vertices.map(id => <button key={id} type="button" aria-pressed={id === highlight} onClick={() => setHighlight(id)}>
        <b>{id}</b><span>{adjacency[id].map(neighbor => `${neighbor.id} (${neighbor.weight})`).join("  ·  ")}</span>
      </button>)}</div>
    </div>
  </div>;
}

function Breadth() {
  const groups = [0, 1, 2].map(depth => maxSteps.filter(vertex => depths.get(vertex) === depth));
  const steps = [
    { label: "Start at A", text: "Put Administration in the queue. The first building in the queue is the first one out." },
    { label: "One walkway away", text: "From A, add Library (B) and Science (C) to the back of the queue. Both are one edge away." },
    { label: "Two walkways away", text: "Process B, then C. Together they find D, F and E. Each is two edges from A." },
  ];
  return <ScrollLesson steps={steps} renderVisual={index =>
    <CampusVisual title="Layers from A" groupLabels={["Start", "1 walkway", "2 walkways"]} state={{ components: groups.slice(0, index + 1) }} weights={false} allow3D={false} />
  } />;
}

function Comparison() {
  return <div className="comparison-layout">
    <table aria-label="BFS and DFS compared">
      <thead><tr><th scope="col">From A</th><th scope="col">Breadth-first search</th><th scope="col">Depth-first search</th></tr></thead>
      <tbody>
        <tr><th scope="row">Worklist</th><td>Queue · FIFO</td><td>Stack or recursion · LIFO</td></tr>
        <tr><th scope="row">Discovery order</th><td>{routeText(bfs().order)}</td><td>{routeText(dfs().order)}</td></tr>
        <tr><th scope="row">Strategy</th><td>Explore by distance in edges</td><td>Explore a branch, then return</td></tr>
        <tr><th scope="row">Adjacency list</th><td>O(V + E)</td><td>O(V + E)</td></tr>
        <tr><th scope="row">Adjacency matrix</th><td>O(V²)</td><td>O(V²)</td></tr>
      </tbody>
    </table>
  </div>;
}

function Connection() {
  const [{ removed, closed }, setClosures] = useState<{ removed: EdgeId[]; closed?: EdgeId }>({ removed: [] });
  const { groups } = connectivity(removed);
  const detour = removed.length ? findRoute("A", "F", edges.filter(edge => !removed.includes(edge.id)).map(edge => edge.id)) : [];
  const isolated = groups.length > 1;
  function toggle(id: EdgeId) {
    playDeckSound(removed.includes(id) ? "accept" : "close");
    setClosures(current => current.removed.includes(id)
      ? { removed: current.removed.filter(edge => edge !== id) }
      : { removed: [...current.removed, id], closed: id });
  }
  return <div className="content-split content-split--sidebar">
    <div className="concept-picker">
      <h3>Close a walkway to F</h3>
      <div className="term-buttons">{isolatedFEdges.map(id => <button key={id} type="button" className="button button--secondary" aria-pressed={removed.includes(id)}
        onClick={() => toggle(id)}>{id.replace("-", "–")}</button>)}</div>
      <div className="term-definition" aria-live="polite"><h3>{groups.length === 1 ? "Campus connected" : "Student Center isolated"}</h3>
        <p>{detour.length ? `Open detour · ${routeText(detour)}` : isolated ? "F has no open walkway." : "Try closing one walkway to the Student Center."}</p>
      </div>
    </div>
    <CampusVisual title="Walkway closures" groupLabels={groups.length === 1 ? ["Connected campus"] : ["Main campus", "Isolated building"]} state={{ components: groups, removed }} emphasis={{ route: detour, kind: "detour", closed, isolated: isolated ? "F" : undefined }} weights={false} allow3D={false} />
  </div>;
}

function Relaxation() {
  const [updated, setUpdated] = useState(false);
  return <div className="content-split content-split--sidebar">
    <div className="relax-explainer">
      <span className="eyebrow">Tentative distance to B</span>
      <div className="distance-equation"><span className={updated ? "distance-replaced" : undefined}>4</span>{updated && <><ArrowRight size={24} /><b className="distance-new">3</b></>}</div>
      {updated && <div className="distance-via">2 + 1 · via C</div>}
      <p>{updated ? "Via C, the sum drops from 4 to 3. Record C as B’s predecessor." : "The first estimate comes from the direct A–B walkway."}</p>
      <button className="button button--primary" type="button" onClick={() => { playDeckSound(updated ? "step" : "accept"); setUpdated(!updated); }}>{updated ? "Reset update" : "Relax C–B"} <ArrowRight size={16} /></button>
    </div>
    <CampusVisual title="Compare the two paths to B" state={{ current: updated ? "C" : "A", highlighted: updated ? ["A-C", "B-C"] : ["A-B"] }} emphasis={updated ? { route: ["A", "C", "B"], kind: "relax" } : undefined} allow3D={false} />
  </div>;
}

function TreeComparison() {
  const removed = edges.filter(edge => !mst.accepted.includes(edge.id)).map(edge => edge.id);
  const steps = [
    { label: "Start with ten links", text: "Every walkway is a possible place to run a cable. The number on each link is its cost." },
    { label: "Reach all six buildings", text: "These five links reach every building without a loop. That makes them a spanning tree." },
    { label: "Add up the costs", text: `The five costs add to ${mst.total}. No other spanning tree on this map costs less.` },
  ];
  return <ScrollLesson steps={steps} renderVisual={index =>
    <CampusVisual title={index === 0 ? "All 10 candidate links" : "5 links in the spanning tree"}
      state={index === 0 ? undefined : { removed, highlighted: mst.accepted }} allow3D={false} />
  } />;
}

function Union() {
  const [merged, setMerged] = useState(false);
  const step = mst.steps[merged ? 2 : 1];
  return <div className="content-split content-split--sidebar">
    <div className="concept-picker">
      <MapKey entries={[["Find", "Look up the representative of a component."], ["Union", "Merge two components when their representatives differ."]]} />
      <button className="button button--primary" type="button" onClick={() => setMerged(value => !value)}>{merged ? "Undo merge" : "Merge with A–C"} <ArrowRight size={16} /></button>
      <p className="form-hint" aria-live="polite">{merged ? "A and B now share a component. A–B would create a cycle." : "B and C already share a component. A is still separate."}</p>
    </div>
    <CampusVisual title="Union-Find components" state={step} allow3D={false} />
  </div>;
}

function Technology() {
  const rows = [
    { icon: Navigation, title: "Wayfinding", desc: "Dijkstra finds the lowest-distance walk.", output: "Shortest route" },
    { icon: Radio, title: "Campus access", desc: "BFS or DFS finds which buildings remain reachable.", output: "Reachable buildings" },
    { icon: Cable, title: "Infrastructure", desc: "Kruskal selects a minimum-cost set of links.", output: "Spanning tree" },
  ];
  return <div className="technology-layout">
    <div className="tech-source"><Waypoints size={40} strokeWidth={1.5} /><h3>Campus graph</h3><span>6 buildings · 10 links</span><ArrowDown className="tech-mobile-arrow" size={20} /></div>
    <div className="tech-destinations">{rows.map(({ icon: Icon, title, desc, output }) => <article key={title}><Icon size={24} strokeWidth={1.7} /><div><h3>{title}</h3><p>{desc}</p></div><span>{output}</span></article>)}</div>
  </div>;
}

export function SlideBody({ layout, emblem, presenter }: { layout: Layout; emblem?: ReactNode; presenter?: number }) {
  switch (layout) {
    case "question": return <QuestionSlide presenter={presenter!} />;
    case "problem": return <Problem />;
    case "solution": return <div className="content-split content-split--sidebar"><MapKey entries={[["Buildings", "Six vertices identify campus destinations."], ["Walkways", "Ten undirected edges connect them."], ["Weights", "A number measures distance or installation cost."]]} /><CampusVisual initialMode="3D" graph={false} graphTour inspect title="Campus model / Graph overlay" /></div>;
    case "terms": return <Terminology />;
    case "storage": return <Storage />;
    case "breadth": return <Breadth />;
    case "bfs": return <TraceLab kind="bfs" />;
    case "dfs": return <TraceLab kind="dfs" />;
    case "compare": return <Comparison />;
    case "connection": return <Connection />;
    case "components": return <TraceLab kind="components" />;
    case "challenge": return <div className="challenge-layout">
      <div className="challenge-brief">
        <span className="eyebrow"><MapPin size={16} /> Game 1</span>
        <div className="challenge-endpoints">A <ArrowRight size={33} /> F</div>
        <p>Find the shortest route in two minutes. Submit one route per round.</p>
        <a className="button button--primary" href="/admin" target="_blank" rel="noreferrer">Presenter controls <ArrowUpRight size={16} /></a>
      </div>
      <PhoneWalkthrough />
      <JoinCode monitor />
    </div>;
    case "relax": return <Relaxation />;
    case "dijkstra": return <TraceLab kind="dijkstra" />;
    case "tree": return <TreeComparison />;
    case "mst": return <div className="content-split content-split--sidebar"><div className="cost-layout"><span className="eyebrow">Total installation cost</span><strong>{mst.total}<small> units</small></strong><div className="cost-edges">{mst.accepted.map(id => <span key={id}>{id.replace("-", "–")} <b>{edgeById.get(id)!.weight}</b></span>)}</div></div>
      <CampusVisual title="Minimum-cost infrastructure network" initialMode="3D" inspect state={{ highlighted: mst.accepted, removed: edges.filter(edge => !mst.accepted.includes(edge.id)).map(edge => edge.id) }} /></div>;
    case "union": return <Union />;
    case "kruskal": return <TraceLab kind="kruskal" />;
    case "tech": return <Technology />;
    case "close": return <TeamFinale emblem={emblem} />;
    default: return null;
  }
}

export function Cover({ onNext, emblem }: { onNext: () => void; emblem: ReactNode }) {
  return <div className="cover-layout">
    <div className="cover-copy">
      {emblem}
      <span className="eyebrow cover-index"><span /> CHAPTER 7 / GRAPH ALGORITHMS</span>
      <h1>CampusNav<span>.</span></h1>
      <p className="cover-tagline">Connecting Places.<br />Finding Better Paths.</p>
      <p className="cover-description">{slides[0].lead}</p>
      <p className="slide-handoff"><strong>{presenters[0].name}</strong> <span>{presenters[0].question}</span></p>
      <button className="button button--primary" type="button" onClick={onNext}>Start presentation <ArrowRight size={19} /></button>
      <dl className="cover-stats">
        <div><dt>06</dt><dd>Buildings</dd></div>
        <div><dt>10</dt><dd>Walkways</dd></div>
        <div><dt>08</dt><dd>Presenters</dd></div>
      </dl>
    </div>
    <div className="cover-map-window"><CampusVisual initialMode="3D" inspect title="Campus model / Site 01" /></div>
  </div>;
}

export function PresenterBadge({ index }: { index: number }) {
  const person = presenters[index];
  return <div className="presenter-badge"><span className="presenter-avatar">{person.initials}</span><div><strong>{person.name}</strong><small>{person.role}</small></div></div>;
}
