export const buildings = [
  { id: "A", name: "Administration Building", label: "Administration", point: [105, 154] },
  { id: "B", name: "Library", label: "Library", point: [302, 84] },
  { id: "C", name: "Science Building", label: "Science", point: [209, 307] },
  { id: "D", name: "Engineering Building", label: "Engineering", point: [420, 232] },
  { id: "E", name: "Gymnasium", label: "Gymnasium", point: [412, 391] },
  { id: "F", name: "Student Center", label: "Student Center", point: [603, 272] },
] as const;

export type Vertex = (typeof buildings)[number]["id"];
export type EdgeId = `${Vertex}-${Vertex}`;
export type Edge = { id: EdgeId; from: Vertex; to: Vertex; weight: number };

export const vertices = buildings.map(({ id }) => id);
export const buildingById = Object.fromEntries(buildings.map(b => [b.id, b])) as Record<Vertex, (typeof buildings)[number]>;
export const isVertex = (value: unknown): value is Vertex => typeof value === "string" && vertices.includes(value as Vertex);
export const edgeId = (a: Vertex, b: Vertex): EdgeId => a < b ? `${a}-${b}` : `${b}-${a}`;

const connections = [
  ["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["B", "F", 12],
  ["C", "D", 8], ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["E", "F", 3],
] as const satisfies readonly (readonly [Vertex, Vertex, number])[];

export const edges: Edge[] = connections.map(([from, to, weight]) => ({ id: edgeId(from, to), from, to, weight }));
export const edgeById = new Map(edges.map(edge => [edge.id, edge]));
export const isolatedFEdges = edges.filter(edge => edge.from === "F" || edge.to === "F").map(edge => edge.id);

export function vertexRecord<T>(makeValue: (id: Vertex) => T): Record<Vertex, T> {
  return Object.fromEntries(vertices.map(id => [id, makeValue(id)])) as Record<Vertex, T>;
}

export function makeAdjacency(excluded: readonly EdgeId[] = []) {
  const list = vertexRecord(() => [] as { id: Vertex; weight: number; edge: EdgeId }[]);
  for (const { id, from, to, weight } of edges) {
    if (excluded.includes(id)) continue;
    list[from].push({ id: to, weight, edge: id });
    list[to].push({ id: from, weight, edge: id });
  }
  for (const neighbors of Object.values(list)) neighbors.sort((a, b) => a.id.localeCompare(b.id));
  return list;
}

export const adjacency = makeAdjacency();
export const routeEdges = (route: readonly Vertex[]) => route.slice(1).map((id, index) => edgeId(route[index], id));
export const routeText = (route: readonly Vertex[]) => route.join(" → ");
