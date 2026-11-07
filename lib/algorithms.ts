import { adjacency, edgeById, edgeId, edges, isVertex, makeAdjacency, routeEdges, routeText, vertexRecord, vertices, type EdgeId, type Vertex } from "./graph";

export type GraphState = {
  current?: Vertex;
  visited?: Vertex[];
  active?: EdgeId;
  activeKind?: "reject" | "inspect";
  highlighted?: EdgeId[];
  route?: Vertex[];
  removed?: EdgeId[];
  components?: Vertex[][];
};

export type TraceStep = GraphState & {
  title: string;
  detail: string;
  order?: Vertex[];
  worklist?: Vertex[];
  distances?: Record<Vertex, number>;
  predecessors?: Record<Vertex, Vertex | null>;
  rejected?: EdgeId[];
  total?: number;
};

export function bfs(start: Vertex = "A") {
  const queue = [start];
  const seen = new Set(queue);
  const order: Vertex[] = [];
  const tree: EdgeId[] = [];
  const steps: TraceStep[] = [];
  function record(title: string, detail: string, head: number, current?: Vertex, active?: EdgeId) {
    steps.push({ title, detail, current, active, visited: [...seen], order: [...order], worklist: queue.slice(head), highlighted: [...tree] });
  }

  record(`Enqueue ${start}`, "Mark the starting building as discovered.", 0);
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    order.push(current);
    record(`Dequeue ${current}`, "Take the building at the front of the queue.", head + 1, current);
    for (const next of adjacency[current]) {
      if (seen.has(next.id)) continue;
      seen.add(next.id);
      queue.push(next.id);
      tree.push(next.edge);
      record(`Discover ${next.id} from ${current}`, `Mark ${next.id} and add it to the back of the queue.`, head + 1, current, next.edge);
    }
  }
  record("Queue empty", `Visit order · ${routeText(order)}`, queue.length);
  return { steps, order };
}

export function dfs(start: Vertex = "A") {
  const stack: Vertex[] = [];
  const order: Vertex[] = [];
  const seen = new Set<Vertex>();
  const tree: EdgeId[] = [];
  const steps: TraceStep[] = [];
  function record(title: string, detail: string, current?: Vertex, active?: EdgeId, activeKind?: GraphState["activeKind"]) {
    steps.push({ title, detail, current, active, activeKind, visited: [...order], order: [...order], worklist: [...stack], highlighted: [...tree] });
  }
  function visit(current: Vertex, parent?: Vertex) {
    const edge = parent && edgeId(parent, current);
    if (edge) tree.push(edge);
    seen.add(current);
    order.push(current);
    stack.push(current);
    record(`Enter ${current}`, `Mark ${current} as visited and push it onto the call stack.`, current, edge);
    for (const next of adjacency[current]) {
      if (!seen.has(next.id)) visit(next.id, current);
    }
    stack.pop();
    if (parent) record(`Backtrack ${current} → ${parent}`, `Pop ${current}. Resume the call for ${parent}.`, parent, edge, "inspect");
    else record(`Return from ${current}`, "The first call ends. The stack is empty.");
  }

  record(`Ready at ${start}`, "The first recursive call will start the traversal.");
  visit(start);
  record("Traversal complete", `Discovery order · ${routeText(order)}`);
  return { steps, order };
}

export function connectivity(removed: EdgeId[] = []) {
  const list = makeAdjacency(removed);
  const groups: Vertex[][] = [];
  const seen = new Set<Vertex>();
  const steps: TraceStep[] = [{ title: "Start with an empty visited set", detail: "Scan buildings in alphabetical order.", removed }];
  for (const vertex of vertices) {
    if (seen.has(vertex)) continue;
    const queue = [vertex];
    const component: Vertex[] = [];
    seen.add(vertex);
    groups.push(component);
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      component.push(current);
      for (const next of list[current]) {
        if (seen.has(next.id)) continue;
        seen.add(next.id);
        queue.push(next.id);
      }
      steps.push({
        title: head ? `Add ${current} to component ${groups.length}` : `Start component ${groups.length} at ${current}`,
        detail: head ? "This building is reachable from the same start." : "Start a fresh BFS from an unvisited building.",
        current, removed, components: groups.map(group => [...group]), worklist: queue.slice(head + 1),
      });
    }
  }
  steps.push({ title: `${groups.length} connected ${groups.length === 1 ? "component" : "components"}`, detail: "Every building now belongs to exactly one group.", removed, components: groups });
  return { groups, steps };
}

function shortestPaths(start: Vertex, target: Vertex, steps?: TraceStep[]) {
  const distances = vertexRecord(() => Infinity);
  const predecessors = vertexRecord<Vertex | null>(() => null);
  const settled = new Set<Vertex>();
  distances[start] = 0;
  function record(title: string, detail: string, state: GraphState = {}) {
    if (!steps) return;
    steps.push({ title, detail, visited: [...settled], distances: { ...distances }, predecessors: { ...predecessors }, ...state });
  }
  record(`Set distance to ${start} = 0`, "All other distances start at infinity.");
  while (settled.size < vertices.length) {
    let current: Vertex | undefined;
    for (const vertex of vertices) {
      if (!settled.has(vertex) && distances[vertex] < (current ? distances[current] : Infinity)) current = vertex;
    }
    if (!current) break;

    settled.add(current);
    record(`Settle ${current} at ${distances[current]}`, "This is the smallest tentative distance, so it is now final.", { current });
    for (const next of adjacency[current]) {
      if (settled.has(next.id)) continue;
      const old = distances[next.id];
      const candidate = distances[current] + next.weight;
      const improves = candidate < old;
      if (improves) {
        distances[next.id] = candidate;
        predecessors[next.id] = current;
      }
      record(improves ? `Update ${next.id} to ${candidate}` : `Keep ${next.id} at ${old}`,
        `${distances[current]} + ${next.weight} = ${candidate}. ${improves ? `Better than ${old === Infinity ? "∞" : old}. Set predecessor to ${current}.` : "The existing distance is already as good or better."}`,
        { current, active: next.edge, activeKind: improves ? undefined : "inspect" });
    }
  }

  const route: Vertex[] = [];
  if (Number.isFinite(distances[target])) {
    for (let current: Vertex | null = target; current; current = predecessors[current]) route.unshift(current);
  }
  const distance = distances[target];
  record(`Shortest route · ${distance} units`, routeText(route), { highlighted: routeEdges(route), route });
  return { route, distance, distances, predecessors };
}

export function dijkstra(start: Vertex = "A", target: Vertex = "F", trace = false) {
  const steps: TraceStep[] = [];
  return { ...shortestPaths(start, target, trace ? steps : undefined), steps };
}

export function kruskal() {
  const sorted = [...edges].sort((a, b) => a.weight - b.weight || a.id.localeCompare(b.id));
  const parent = vertexRecord(id => id);
  const rank = vertexRecord(() => 0);
  const accepted: EdgeId[] = [];
  const rejected: EdgeId[] = [];
  const steps: TraceStep[] = [];
  let total = 0;

  function find(id: Vertex): Vertex {
    if (parent[id] !== id) parent[id] = find(parent[id]);
    return parent[id];
  }
  function union(a: Vertex, b: Vertex) {
    if (rank[a] < rank[b]) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a]++;
  }
  function record(title: string, detail: string, active?: EdgeId, activeKind?: GraphState["activeKind"]) {
    const groups = new Map<Vertex, Vertex[]>();
    for (const vertex of vertices) {
      const root = find(vertex);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(vertex);
    }
    steps.push({ title, detail, active, activeKind, highlighted: [...accepted], rejected: [...rejected], total, components: [...groups.values()] });
  }

  record("Sort edges by weight", "Begin with six separate components. Ties use alphabetical edge order.");
  for (const edge of sorted) {
    const a = find(edge.from);
    const b = find(edge.to);
    if (a === b) {
      rejected.push(edge.id);
      record(`Reject ${edge.from}–${edge.to} · ${edge.weight}`, `${edge.from} and ${edge.to} already share a component. Adding this link would create a cycle.`, edge.id, "reject");
    } else {
      union(a, b);
      accepted.push(edge.id);
      total += edge.weight;
      record(`Accept ${edge.from}–${edge.to} · ${edge.weight}`, "The endpoints were in different components. Merge them.", edge.id);
    }
    if (accepted.length === vertices.length - 1) break;
  }
  record("Minimum spanning tree complete", `${accepted.length} links connect all ${vertices.length} buildings at a total cost of ${total}.`);
  return { sorted, accepted, rejected, total, steps };
}

type RouteValidation = { error: string } | { route: Vertex[]; weight: number; best: number; optimal: boolean };

export function validateRoute(value: unknown, start: Vertex, target: Vertex): RouteValidation {
  if (!Array.isArray(value) || value.length < 2 || value.length > vertices.length || !value.every(isVertex)) {
    return { error: "Choose a route with two to six campus buildings." } as const;
  }
  const route = value as Vertex[];
  if (route[0] !== start || route.at(-1) !== target) {
    return { error: `Begin at ${start} and end at ${target}.` } as const;
  }
  if (new Set(route).size !== route.length) return { error: "Choose a route without repeated buildings." } as const;
  let weight = 0;
  for (const id of routeEdges(route)) {
    const edge = edgeById.get(id);
    if (!edge) return { error: `There is no direct walkway between ${id.replace("-", " and ")}.` } as const;
    weight += edge.weight;
  }
  const best = dijkstra(start, target).distance;
  return { route, weight, best, optimal: weight === best } as const;
}

/** Find a route using only the links available to the current demonstration. */
export function findRoute(start: Vertex, target: Vertex, available: readonly EdgeId[]): Vertex[] {
  const allowed = new Set(available);
  const queue: Vertex[][] = [[start]];
  const visited = new Set<Vertex>([start]);
  for (const route of queue) {
    const current = route.at(-1)!;
    if (current === target) return route;
    for (const next of adjacency[current]) {
      if (!allowed.has(next.edge) || visited.has(next.id)) continue;
      visited.add(next.id);
      queue.push([...route, next.id]);
    }
  }
  return [];
}
