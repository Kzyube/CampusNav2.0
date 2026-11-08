"use client";

import { gsap } from "gsap";
import { useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { BoxGeometry, Group, MathUtils, Vector3, type Mesh } from "three";
import { buildings, buildingById, edges, type Edge, type Vertex } from "@/lib/graph";
import type { GraphState } from "@/lib/algorithms";
import { nodeColor } from "./network-map";
import { CampusDetails, CampusLife } from "./campus-details";

const cube = new BoxGeometry(1, 1, 1);
const cameraRest = new Vector3(9.2, 18.2, 19.6);
type Vec3 = [number, number, number];

function Box({ at, size, color }: { at: Vec3; size: Vec3; color: string }) {
  return <mesh position={at} scale={size} geometry={cube} dispose={null}><meshStandardMaterial color={color} roughness={0.9} /></mesh>;
}

const models: Record<Vertex, { offset: [number, number]; width: number; depth: number; height: number; wall: string; roof: string }> = {
  A: { offset: [-0.85, -0.66], width: 2.4, depth: 1.32, height: 0.9, wall: "#bdb69b", roof: "#e2d9b8" },
  B: { offset: [-0.12, -1.05], width: 2.65, depth: 1.37, height: 1.17, wall: "#b2c3ac", roof: "#dce6c7" },
  C: { offset: [-0.83, 0.83], width: 1.58, depth: 1.8, height: 1.16, wall: "#9cb0a9", roof: "#c9dbd1" },
  D: { offset: [0.43, -0.84], width: 2.14, depth: 1.27, height: 1.74, wall: "#a1b7b6", roof: "#d7e0ce" },
  E: { offset: [-0.21, 1.0], width: 2.66, depth: 1.65, height: 0.83, wall: "#b7ab89", roof: "#ddd5ac" },
  F: { offset: [0.98, 0.35], width: 1.82, depth: 1.84, height: 1.13, wall: "#b0c19d", roof: "#dae8bf" },
};

function point(id: Vertex): [number, number] {
  const [x, y] = buildingById[id].point;
  return [(x - 353) / 35, (y - 235) / 38];
}

function GraphMarker({ color, active, delay }: { color: string; active: boolean; delay?: number }) {
  const marker = useRef<Mesh>(null);
  const invalidate = useThree(store => store.invalidate);
  useEffect(() => {
    const scale = marker.current?.scale;
    if (!scale || delay === undefined) return;
    const tween = gsap.from(scale, {
      x: .001, y: .001, z: .001, delay, duration: .36, ease: "back.out(1.6)", onUpdate: invalidate,
    });
    invalidate();
    return () => { tween.revert(); };
  }, [delay, invalidate]);

  return <mesh ref={marker} position={[0, 0.17, 0]}>
    <cylinderGeometry args={[.19, .19, .14, 14]} />
    <meshStandardMaterial color={color} emissive={active ? "#4b600f" : "#242d17"} />
  </mesh>;
}

function Building({ id, selected, state, graph, markerDelay, onSelect }: {
  id: Vertex; selected?: Vertex; state: GraphState; graph: boolean; markerDelay?: number; onSelect?: (id: Vertex) => void;
}) {
  const [x, z] = point(id);
  const { offset, width, depth, height, wall, roof } = models[id];
  const active = selected === id || state.current === id;
  const accent = nodeColor(id, state, selected);
  const roofColor = active ? "#d6f66f" : roof;
  const windows = id === "E" ? 3 : 5;
  return (
    <group position={[x, 0, z]}>
      <group position={[offset[0], 0, offset[1]]} onClick={onSelect ? event => { event.stopPropagation(); onSelect(id); } : undefined}>
        <Box at={[0, 0.025, 0]} size={[width + 0.49, 0.1, depth + 0.48]} color={active ? "#b8d264" : "#586758"} />
        <Box at={[0, height / 2 + 0.08, 0]} size={[width, height, depth]} color={wall} />
        <Box at={[0, height + 0.12, 0]} size={[width + 0.1, 0.12, depth + 0.11]} color={roofColor} />
        {id === "B" && <Box at={[0.52, height + 0.23, 0]} size={[1.36, 0.18, 0.62]} color="#657b68" />}
        {id === "C" && <Box at={[-0.59, height + 0.33, -0.39]} size={[0.58, 0.4, 0.63]} color={roofColor} />}
        {id === "D" && <Box at={[-0.72, 0.6, 0.56]} size={[1.21, 1.03, 1.06]} color={roofColor} />}
        {id === "A" && <Box at={[0, 0.76, depth / 2 + 0.11]} size={[0.82, 0.1, 0.41]} color={roofColor} />}
        {id === "E" && <Box at={[0, height + 0.22, 0]} size={[width - 0.19, 0.14, depth - 0.17]} color={roofColor} />}
        {id === "F" && <Box at={[-0.63, 0.44, 0.69]} size={[1.49, 0.7, 0.7]} color={roofColor} />}
        {Array.from({ length: windows }, (_, index) => (
          <Box key={index} at={[(index - (windows - 1) / 2) * (width / (windows + 1)), height * 0.68, depth / 2 + 0.012]}
            size={[width / (windows + 2) * 0.57, id === "E" ? 0.11 : 0.27, 0.035]} color="#35534e" />
        ))}
        <Box at={[width / 2 + 0.01, height * 0.66, -0.12]} size={[0.028, 0.17, depth * 0.65]} color="#45605a" />
        <Box at={[0.13, 0.28, depth / 2 + 0.02]} size={[0.28, 0.4, 0.036]} color="#334640" />
        {(id === "B" || id === "D") && [-.48, -.16, .16, .48].map(x => (
          <Box key={x} at={[x, height + .24, -.3]} size={[.28, .04, .36]} color="#41667b" />
        ))}
        {(id === "A" || id === "C" || id === "E") && <>
          <Box at={[width * .27, height + .31, -depth * .24]} size={[.3, .26, .28]} color="#73867e" />
          <Box at={[width * .27, height + .45, -depth * .24]} size={[.35, .04, .32]} color="#d0d6b9" />
        </>}
        {id === "F" && <>
          <Box at={[0, height + .22, -.21]} size={[1.34, .075, .62]} color="#7f9a66" />
          {[-.43, 0, .43].map(x => <Box key={x} at={[x, height + .29, -.21]} size={[.22, .12, .28]} color="#a4be74" />)}
        </>}
      </group>
      {graph && <GraphMarker color={accent} active={active} delay={markerDelay} />}
    </group>
  );
}

function LinkStrip({ edge, state, graph, reduced, revealDelay }: { edge: Edge; state: GraphState; graph: boolean; reduced: boolean; revealDelay?: number }) {
  const fromIndex = state.route?.indexOf(edge.from) ?? -1;
  const toIndex = state.route?.indexOf(edge.to) ?? -1;
  const onRoute = fromIndex >= 0 && toIndex >= 0 && Math.abs(fromIndex - toIndex) === 1;
  const reverse = onRoute && toIndex < fromIndex;
  const delay = revealDelay ?? (onRoute ? Math.min(fromIndex, toIndex) * 0.16 : 0);
  const [x1, z1] = point(reverse ? edge.to : edge.from);
  const [x2, z2] = point(reverse ? edge.from : edge.to);
  const length = Math.hypot(x2 - x1, z2 - z1);
  const active = state.active === edge.id;
  const marked = state.highlighted?.includes(edge.id);
  const removed = state.removed?.includes(edge.id);
  const color = active && state.activeKind === "reject" ? "#ffa491" : active && state.activeKind === "inspect" ? "#8bddcf" : active || marked || revealDelay !== undefined ? "#d6f66f" : "#7b9283";
  const animated = useRef<Group>(null);
  const elapsed = useRef(0);
  const invalidate = useThree(store => store.invalidate);
  const moves = graph && !removed && (Boolean(active || marked) || revealDelay !== undefined) && !reduced;
  useEffect(() => {
    if (!animated.current) return;
    elapsed.current = -delay;
    animated.current.scale.x = moves ? 0.001 : 1;
    invalidate();
  }, [moves, delay, invalidate]);
  useFrame((_, delta) => {
    if (!animated.current || !moves || elapsed.current >= 0.45) return;
    elapsed.current += Math.min(delta, 0.05);
    animated.current.scale.x = Math.max(0.001, MathUtils.smoothstep(elapsed.current, 0, 0.45));
    invalidate();
  });

  return (
    <group position={[x1, 0, z1]} rotation={[0, -Math.atan2(z2 - z1, x2 - x1), 0]}>
      {!removed && <Box at={[length / 2, 0.044, 0]} size={[length, 0.085, 0.34]} color="#859286" />}
      {graph && !removed && <group ref={animated}>
        <Box at={[length / 2, 0.111, 0]} size={[length, 0.035, active || marked || revealDelay !== undefined ? 0.14 : 0.055]} color={color} />
      </group>}
    </group>
  );
}

const trees: [number, number, number][] = [
  [-8.3, -3.45, 0.8], [-8.05, -2.56, 0.66], [-7.99, 0.35, 0.9], [-7.54, 1.13, 0.6], [-7.43, 3.6, 0.79],
  [-6.15, -5.64, 0.92], [-4.65, -5.61, 0.61], [-.3, -5.17, 0.72], [.9, -5.02, 0.9],
  [2.75, -5.09, 0.8], [4.05, -5.3, 0.65], [5.15, -5.28, 0.8], [8.54, -3.62, 0.83],
  [8.05, -2.46, 0.55], [8.15, -1.74, 0.77], [8.55, 3.2, 0.95], [7.95, 3.65, 0.72],
  [6.56, 5.46, 0.79], [6.98, 4.64, 0.56], [-5.93, 4.45, 0.77], [-4.83, 4.63, 0.66],
  [-2.21, 3.93, 0.85], [-1.58, 4.51, 0.69], [0.15, 4.82, 0.88], [-0.42, -0.54, 0.64],
  [0.29, -0.35, 0.54], [4.22, 0.61, 0.56], [5.03, 0.3, 0.61], [3.11, 3.93, 0.82],
];

function Ground() {
  return <>
    <Box at={[0, -0.61, 0]} size={[18.8, 0.52, 11.55]} color="#26382f" />
    <Box at={[0, -0.17, 0]} size={[18.85, 0.34, 11.6]} color="#4b5e4a" />
    <Box at={[-6.95, 0.009, 0.75]} size={[3.2, 0.023, 8.73]} color="#51674e" />
    <Box at={[5.9, 0.013, -3.05]} size={[5.9, 0.025, 3.3]} color="#52694e" />
    <Box at={[6.85, 0.015, 3.6]} size={[3.9, 0.031, 2.94]} color="#577050" />
    <Box at={[-0.17, 0.025, 0.08]} size={[1.88, 0.05, 1.1]} color="#687963" />
    <Box at={[0, -0.27, 5.82]} size={[18.84, 0.075, 0.07]} color="#9aa88b" />
    <Box at={[9.44, -0.27, 0]} size={[0.07, 0.075, 11.58]} color="#9aa88b" />
    <gridHelper position={[0, -0.888, 0]} args={[75, 75, "#40564c", "#273a31"]} />
    {trees.map(([x, z, scale], index) => <group key={index} position={[x, 0, z]} scale={scale}>
      <Box at={[0, 0.19, 0]} size={[0.085, 0.4, 0.085]} color="#77694b" />
      <mesh position={[0, 0.57, 0]} rotation={[0, index, 0]} scale={[0.38, 0.48, 0.36]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={["#718e58", "#8da16b", "#668059", "#a4b17b"][index % 4]} roughness={1} />
      </mesh>
    </group>)}
  </>;
}

function CameraSetup({ reduced, topDown, graphTour, onLost }: { reduced: boolean; topDown: boolean; graphTour: boolean; onLost: () => void }) {
  const { camera, gl, invalidate, size } = useThree();
  const elapsed = useRef(0);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  useEffect(() => {
    if (!graphTour || camera.type !== "OrthographicCamera") return;
    const destination = topDown ? { x: 0, y: 26, z: 3.25 } : { x: cameraRest.x, y: cameraRest.y, z: cameraRest.z };
    const tween = gsap.to(camera.position, {
      ...destination, duration: reduced ? 0 : .95, ease: "power3.inOut",
      onUpdate() { camera.lookAt(0, 0, 0); invalidate(); },
    });
    return () => { tween.kill(); };
  }, [camera, graphTour, topDown, reduced, invalidate]);
  useFrame(() => {
    if (graphTour || reduced || elapsed.current >= 12) return;
    elapsed.current++;
    camera.position.lerp(cameraRest, 0.11);
    camera.lookAt(0, 0, 0);
    invalidate();
  });
  return <>
    <OrthographicCamera makeDefault position={[10.2, 18, 19.7]} zoom={Math.min(size.width / 24.5, size.height / 13.25)} near={0.1} far={100} />
    <OrbitControls makeDefault enabled={!topDown} enableDamping={!reduced} enableZoom={false} enablePan={false}
      minPolarAngle={graphTour ? .08 : .39} maxPolarAngle={1.13} minAzimuthAngle={-0.43} maxAzimuthAngle={0.93} />
  </>;
}

type Annotation = { id: string; at: Vec3 };

const buildingAnnotations = buildings.map(({ id }) => {
  const [x, z] = point(id);
  const { offset, height } = models[id];
  return { id, at: [x + offset[0], height + 0.47, z + offset[1]] as Vec3 };
});

const weightAnnotations = edges.map(edge => {
  const [x1, z1] = point(edge.from);
  const [x2, z2] = point(edge.to);
  return { id: edge.id, at: [(x1 + x2) / 2, 0.2, (z1 + z2) / 2] as Vec3 };
});

function PositionAnnotations({ annotations, elements }: { annotations: Annotation[]; elements: RefObject<Map<string, HTMLElement>> }) {
  const vector = useRef(new Vector3());
  useFrame(({ camera, size }) => {
    camera.updateMatrixWorld();
    for (const { id, at } of annotations) {
      const label = elements.current.get(id);
      if (!label) continue;
      const p = vector.current.set(...at).project(camera);
      const x = Math.round((p.x + 1) * size.width / 2);
      const y = Math.round((1 - p.y) * size.height / 2);
      label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      label.style.visibility = p.z > -1 && p.z < 1 ? "visible" : "hidden";
    }
  });
  return null;
}

export default function CampusScene({ state, selected, onSelect, graph, graphTour = false, weights, reduced, paused, onLost }: {
  state: GraphState; selected?: Vertex; onSelect?: (id: Vertex) => void; graph: boolean; graphTour?: boolean; weights: boolean; reduced: boolean; paused: boolean; onLost: () => void;
}) {
  const elements = useRef(new Map<string, HTMLElement>());
  const annotations = graph && weights ? [...buildingAnnotations, ...weightAnnotations] : buildingAnnotations;
  function bind(id: string) {
    return (element: HTMLElement | null) => {
      if (element) elements.current.set(id, element);
      else elements.current.delete(id);
    };
  }

  return <div className="scene-viewport">
    <Canvas className="campus-canvas" frameloop="demand" dpr={[1, 1.35]}
      gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}>
      <color attach="background" args={["#1c2b24"]} />
      <hemisphereLight args={["#f3f2df", "#788076", 1.7]} />
      <directionalLight position={[-8, 13, 7]} intensity={2.25} color="#fff4db" />
      <directionalLight position={[5, 5, -8]} intensity={0.57} color="#c3e7f4" />
      <CameraSetup reduced={reduced} graphTour={graphTour} topDown={graphTour && graph} onLost={onLost} />
      <Ground />
      <CampusDetails />
      {edges.map((edge, index) => <LinkStrip key={edge.id} edge={edge} state={state} graph={graph} reduced={reduced} revealDelay={graphTour ? .63 + index * .052 : undefined} />)}
      {buildings.map(({ id }, index) => <Building key={id} id={id} state={state} selected={selected} graph={graph} onSelect={onSelect} markerDelay={graphTour && !reduced ? .27 + index * .052 : undefined} />)}
      {!(graphTour && graph) && <CampusLife active={!reduced && !paused} />}
      <PositionAnnotations annotations={annotations} elements={elements} />
    </Canvas>
    <div className="scene-annotations">
      {graph && weights && edges.filter(edge => !state.removed?.includes(edge.id)).map(edge => (
        <span key={edge.id} ref={bind(edge.id)} className="scene-weight" aria-hidden="true">{edge.weight}</span>
      ))}
      {buildings.map(({ id, label, name }) => {
        const className = `scene-label ${selected === id || state.current === id ? "is-active" : ""}`;
        const text = <><b>{id}</b> {label}</>;
        return onSelect ? <button key={id} type="button" ref={bind(id)} className={className} onClick={() => onSelect(id)}
          aria-label={`Select ${name}`} aria-pressed={selected === id}>{text}</button>
          : <span key={id} ref={bind(id)} className={className}>{text}</span>;
      })}
    </div>
  </div>;
}
