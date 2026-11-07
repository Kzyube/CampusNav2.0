import assert from "node:assert/strict";
import { test } from "node:test";
import { bfs, connectivity, dfs, dijkstra, findRoute, kruskal, validateRoute } from "../lib/algorithms";
import { adjacency, buildings, edges, isolatedFEdges, vertices, type Vertex } from "../lib/graph";
import { presenters, slides } from "../lib/slides";
import { tagalogNotes } from "../lib/tagalog-notes";

test("the campus graph has the specified buildings and weights", () => {
  assert.deepEqual(buildings.map(({ id, name }) => [id, name]), [
    ["A", "Administration Building"], ["B", "Library"], ["C", "Science Building"],
    ["D", "Engineering Building"], ["E", "Gymnasium"], ["F", "Student Center"],
  ]);
  assert.deepEqual(edges.map(({ id, weight }) => [id, weight]), [
    ["A-B", 4], ["A-C", 2], ["B-C", 1], ["B-D", 5], ["B-F", 12],
    ["C-D", 8], ["C-E", 10], ["D-E", 2], ["D-F", 6], ["E-F", 3],
  ]);
});

test("traversal order, backtracking, and connectivity match the brief", () => {
  assert.deepEqual(bfs().order, ["A", "B", "C", "D", "F", "E"]);
  const depth = dfs();
  assert.deepEqual(depth.order, ["A", "B", "C", "D", "E", "F"]);
  assert.deepEqual(depth.steps.filter(step => step.title.startsWith("Backtrack")).map(step => step.active), ["E-F", "D-E", "C-D", "B-C", "A-B"]);
  for (const id of isolatedFEdges) assert.equal(connectivity([id]).groups.length, 1);
  assert.deepEqual(isolatedFEdges, ["B-F", "D-F", "E-F"]);
  assert.deepEqual(connectivity(isolatedFEdges).groups.map(group => [...group].sort()), [["A", "B", "C", "D", "E"], ["F"]]);
});

test("Dijkstra matches the required result and exhaustive simple paths for every pair", () => {
  const result = dijkstra("A", "F", true);
  assert.deepEqual(result.distances, { A: 0, B: 3, C: 2, D: 8, E: 10, F: 13 });
  assert.deepEqual(result.route, ["A", "C", "B", "D", "E", "F"]);
  assert.equal(result.distance, 13);
  assert.equal(result.steps.at(-1)?.title, "Shortest route · 13 units");

  function brute(target: Vertex, path: Vertex[], weight: number): number {
    if (path.at(-1) === target) return weight;
    const candidates = adjacency[path.at(-1)!].filter(({ id }) => !path.includes(id));
    return Math.min(...candidates.map(next => brute(target, [...path, next.id], weight + next.weight)));
  }
  for (const start of vertices) {
    for (const target of vertices) assert.equal(dijkstra(start, target).distance, brute(target, [start], 0));
  }
});

test("Kruskal matches the required tree and every five-edge combination", () => {
  const tree = kruskal();
  assert.deepEqual(tree.accepted, ["B-C", "A-C", "D-E", "E-F", "B-D"]);
  assert.deepEqual(tree.rejected, ["A-B"]);
  assert.equal(tree.total, 13);
  assert.equal(tree.accepted.length, vertices.length - 1);
  let cheapest = Infinity;
  for (let mask = 0; mask < 1 << edges.length; mask++) {
    const included = edges.filter((_, index) => mask & (1 << index));
    if (included.length !== vertices.length - 1) continue;
    const removed = edges.filter(edge => !included.includes(edge)).map(edge => edge.id);
    if (connectivity(removed).groups.length !== 1) continue;
    cheapest = Math.min(cheapest, included.reduce((sum, edge) => sum + edge.weight, 0));
  }
  assert.equal(tree.total, cheapest);
});

test("route validation checks topology, endpoints, and optimality", () => {
  assert.deepEqual(validateRoute(["A", "C", "B", "D", "E", "F"], "A", "F"),
    { route: ["A", "C", "B", "D", "E", "F"], weight: 13, best: 13, optimal: true });
  assert.deepEqual(validateRoute(["A", "B", "F"], "A", "F"),
    { route: ["A", "B", "F"], weight: 16, best: 13, optimal: false });
  assert.deepEqual(validateRoute(["B", "C"], "B", "C"),
    { route: ["B", "C"], weight: 1, best: 1, optimal: true });
  for (const route of [["A", "F"], ["B", "F"], ["A", "B", "A", "C", "D", "F"], ["A", "G", "F"], null]) {
    assert.ok("error" in validateRoute(route, "A", "F"));
  }
});

test("slide ownership, order, timing, and speaker notes cover the full presentation", () => {
  assert.deepEqual(presenters.map(person => person.name), [
    "Kzyube Napoles", "Hance Subaldo", "Lowell Ronamo", "Hilary Cañas", "Princess Man Oyao", "Gary Dapilaga", "Ram Alferez", "Jinson Oplimo",
  ]);
  assert.deepEqual(slides.map(slide => slide.presenter), [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7]);
  assert.deepEqual(slides.map(slide => slide.layout), [
    "cover", "problem", "solution", "terms", "storage", "breadth", "bfs", "dfs", "compare", "connection",
    "components", "challenge", "relax", "dijkstra", "tree", "mst", "union", "kruskal", "tech", "close",
  ]);
  assert.equal(slides.reduce((total, slide) => total + slide.seconds, 0), 1800);
  assert.equal(new Set(slides.map(slide => slide.guide)).size, 20);
  assert.ok(slides.every(slide => slide.guide && slide.cue && slide.notes.length === 5 && slide.notes.every(Boolean)));
});


test("every slide has a distinct Tagalog guide, cue, and spoken script", () => {
  assert.equal(tagalogNotes.length, slides.length);
  assert.equal(new Set(tagalogNotes.map(([guide]) => guide)).size, slides.length);
  assert.ok(tagalogNotes.every(entry => entry.length === 5 && entry.every(text => text.trim())));
});


test("demonstration paths respect open walkways and show Kruskal’s actual cycle", () => {
  const available = edges.map(({ id }) => id);
  assert.deepEqual(findRoute("A", "F", available.filter(id => id !== "B-F")), ["A", "B", "D", "F"]);
  assert.deepEqual(findRoute("A", "F", available.filter(id => id !== "B-F" && id !== "D-F")), ["A", "C", "E", "F"]);
  assert.deepEqual(findRoute("A", "F", available.filter(id => !isolatedFEdges.includes(id))), []);
  const rejected = kruskal().steps.find(step => step.active === "A-B")!;
  assert.deepEqual(findRoute("A", "B", rejected.highlighted ?? []), ["A", "C", "B"]);
});
