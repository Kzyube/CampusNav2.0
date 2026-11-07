"use client";

import { buildings, buildingById, edges, routeEdges, type Vertex } from "@/lib/graph";
import { MapMotion, type MapEmphasis } from "./map-motion";
import type { GraphState } from "@/lib/algorithms";

export const componentColors = ["#d6f66f", "#8bddcf", "#edb478", "#c8cfdd", "#f3a39b", "#a7caef"];

export function nodeColor(id: Vertex, state: GraphState, selected?: Vertex) {
  if (state.current === id || selected === id) return "#efffb9";
  const component = state.components?.findIndex(group => group.includes(id)) ?? -1;
  if (component >= 0) return componentColors[component];
  if (state.visited?.includes(id)) return "#d6f66f";
  return "#e0e9df";
}

type Props = {
  state?: GraphState;
  selected?: Vertex;
  onSelect?: (id: Vertex) => void;
  showWeights?: boolean;
  showGroupOutline?: boolean;
  showNames?: boolean;
  label?: string;
  emphasis?: MapEmphasis;
  revealGraph?: boolean;
};

export function NetworkMap({ state = {}, selected, onSelect, showWeights = true, showNames = true, showGroupOutline = false, label = "Campus graph", emphasis, revealGraph }: Props) {
  const drawnEdges = edges.filter(edge => !state.removed?.includes(edge.id)).map(edge => ({
    ...edge,
    kind: state.active === edge.id ? state.activeKind ?? "active" : state.highlighted?.includes(edge.id) ? "marked" : "base",
    start: buildingById[edge.from].point,
    end: buildingById[edge.to].point,
  }));
  const enlargedWeights = emphasis?.route && (emphasis.kind === "relax" || emphasis.kind === "accept") ? routeEdges(emphasis.route) : [];
  const linkDelay = (index: number) => revealGraph ? { animationDelay: `${.24 + index * .045}s` } : undefined;

  return (
    <svg className={revealGraph ? "network-map network-map--reveal" : "network-map"} viewBox="31 19 647 431" role={onSelect ? "group" : "img"} aria-label={label}>
      <path className="survey-corners" d="M59 65v-17h17m557 0h17v17m0 339v17h-17m-557 0H59v-17" />
      {drawnEdges.map(({ id, kind, start: [x1, y1], end: [x2, y2] }, index) => (
        <g key={id} className={`map-link map-link--${kind}`} style={linkDelay(index)}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={revealGraph ? 1 : undefined} />
        </g>
      ))}
      {emphasis && <MapMotion {...emphasis} />}
      {showWeights && drawnEdges.map(({ id, kind, start: [x1, y1], end: [x2, y2], weight }, index) =>
        !enlargedWeights.includes(id) && <g key={id} className={`map-link map-link--${kind}`} style={linkDelay(index)}
          transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
          <rect x="-16" y="-13" width="32" height="26" rx="3" />
          <text textAnchor="middle" dy=".34em">{weight}</text>
        </g>
      )}
      {buildings.map(({ id, name, label: shortName, point: [x, y] }, index) => {
        const group = showGroupOutline ? state.components?.findIndex(vertices => vertices.includes(id)) ?? -1 : -1;
        const focused = selected === id || state.current === id;
        return (
          <g key={id} className={`map-node ${onSelect ? "map-node--button" : ""}`} transform={`translate(${x} ${y})`}
            role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}
            aria-label={`${id}, ${name}`} aria-pressed={onSelect ? selected === id : undefined}
            onClick={onSelect ? () => onSelect(id) : undefined}
            onKeyDown={onSelect ? event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(id);
              }
            } : undefined}>
            {group >= 0 && <circle className="map-group-ring" data-group={group} r="23" />}
            {focused && <circle className="map-focus" r="26" />}
            <circle className="node-disc" r="19" fill={nodeColor(id, state, selected)} style={revealGraph ? { animationDelay: `${index * .055}s` } : undefined} />
            <text className="node-letter" textAnchor="middle" dy=".34em">{id}</text>
            {showNames && <text className="node-name" textAnchor="middle" y={id === "B" || id === "A" ? -31 : 39}>{shortName}</text>}
          </g>
        );
      })}
    </svg>
  );
}
