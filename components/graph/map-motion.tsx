import { buildingById, edgeById, edgeId, type EdgeId, type Vertex } from "@/lib/graph";

export type MapEmphasis = {
  route?: Vertex[];
  kind?: "detour" | "relax" | "cycle" | "accept";
  closed?: EdgeId;
  isolated?: Vertex;
};

export function MapMotion({ route, kind, closed, isolated }: MapEmphasis) {
  const closedEdge = closed && edgeById.get(closed);
  const isolatedPoint = isolated && buildingById[isolated].point;
  return <g aria-hidden="true">
    {closedEdge && <line key={closed} className="map-motion-closed"
      x1={buildingById[closedEdge.from].point[0]} y1={buildingById[closedEdge.from].point[1]}
      x2={buildingById[closedEdge.to].point[0]} y2={buildingById[closedEdge.to].point[1]} />}
    {route && kind && <g key={route.join("-")} className={`map-motion-route map-motion-route--${kind}`}>
      {route.slice(1).map((end, index) => {
        const start = route[index];
        const [x1, y1] = buildingById[start].point;
        const [x2, y2] = buildingById[end].point;
        const isRejected = kind === "cycle" && index === route.length - 2;
        const weight = kind === "relax" || kind === "accept" ? edgeById.get(edgeId(start, end))?.weight : undefined;
        const delay = `${index * .23}s`;
        return <g key={index}>
          <line className={isRejected ? "map-motion-rejected" : "map-motion-segment"} pathLength={1}
            x1={x1} y1={y1} x2={x2} y2={y2} style={{ animationDelay: delay }} />
          {weight !== undefined && <g transform={`translate(${(x1 + x2) / 2} ${(y1 + y2) / 2})`}>
            <g className="map-motion-weight" style={{ animationDelay: delay }}>
              <rect x="-22" y="-20" width="44" height="40" rx="8" />
              <text textAnchor="middle" dominantBaseline="central">{weight}</text>
            </g>
          </g>}
        </g>;
      })}
    </g>}
    {isolatedPoint && <g transform={`translate(${isolatedPoint[0]} ${isolatedPoint[1]})`}>
      <circle className="map-isolated-ring" r="36" />
      <g className="map-isolated-label" transform="translate(-105 -54)">
        <rect width="115" height="29" rx="5" />
        <text x="57.5" y="20" textAnchor="middle">ISOLATED</text>
      </g>
    </g>}
  </g>;
}
