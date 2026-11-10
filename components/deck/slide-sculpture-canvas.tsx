"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { MathUtils, Quaternion, Vector3, type Group, type OrthographicCamera as ThreeCamera } from "three";
import { edges, vertices } from "@/lib/graph";
import type { SculptureKind } from "./slide-sculpture";

type Point = [number, number, number];
const sky = "#8ecde8";
const mint = "#82e0bf";
const lime = "#d6f378";
const lilac = "#c6a8ed";
const gold = "#f7c576";
const dark = "#28473f";
const up = new Vector3(0, 1, 0);

function Block({ at, size, color }: { at: Point; size: Point; color: string }) {
  return <mesh position={at}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.38} /></mesh>;
}

function Rod({ from, to, color, radius = .045 }: { from: Point; to: Point; color: string; radius?: number }) {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  const rotation = new Quaternion().setFromUnitVectors(up, direction.clone().normalize());
  return <mesh position={start.lerp(end, .5)} quaternion={rotation}>
    <cylinderGeometry args={[radius, radius, direction.length(), 8]} />
    <meshStandardMaterial color={color} roughness={.3} />
  </mesh>;
}

function Gem({ at, color, size = .24 }: { at: Point; color: string; size?: number }) {
  return <mesh position={at}><icosahedronGeometry args={[size, 0]} /><meshStandardMaterial color={color} roughness={.27} metalness={.12} /></mesh>;
}

function Ring({ radius, color, at = [0, 0, 0], tilt = 0 }: { radius: number; color: string; at?: Point; tilt?: number }) {
  return <mesh position={at} rotation={[-Math.PI / 2, tilt, 0]}>
    <torusGeometry args={[radius, .027, 8, 56]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.24} />
  </mesh>;
}

function Plinth({ width, color }: { width: number; color: string }) {
  return <>
    <Block at={[0, -.83, 0]} size={[width + .13, .12, 2.13]} color="#305449" />
    <Block at={[0, -.7, 0]} size={[width, .16, 2]} color={color} />
  </>;
}

function Traversal({ queue, stack }: { queue: React.RefObject<Group | null>; stack: React.RefObject<Group | null> }) {
  return <>
    <group position={[-2.35, 0, 0]} rotation={[0, -.13, 0]}>
      <Plinth width={3.75} color="#588473" />
      {[-.48, .48].map(z => <Block key={z} at={[0, -.48, z]} size={[3.5, .22, .064]} color={mint} />)}
      <group ref={queue}>
        {[0, 1, 2, 3].map(i => <group key={i} position={[-1.17 + .78 * i, -.29, 0]}>
          <Block at={[0, 0, 0]} size={[.55, .62, .62]} color={i === 0 ? lime : mint} />
          <Block at={[0, .325, 0]} size={[.58, .045, .65]} color="#d7fff0" />
        </group>)}
      </group>
    </group>
    <group position={[2.35, 0, 0]} rotation={[0, .19, 0]}>
      <Plinth width={3.75} color="#685c87" />
      <Ring at={[0, -.595, 0]} radius={.87} color={lilac} />
      <group ref={stack}>
        {[0, 1, 2, 3].map(i => <group key={i} position={[0, -.48 + i * .3, 0]} rotation={[0, i * .11, 0]}>
          <Block at={[0, 0, 0]} size={[1.18, .23, .92]} color={i === 3 ? "#e2cff6" : lilac} />
          <Block at={[0, .12, 0]} size={[1.21, .025, .95]} color="#f3e7ff" />
        </group>)}
      </group>
    </group>
  </>;
}

const graphPoints: Point[] = [[-1.2, .55, .3], [-.63, 1.28, -.73], [-.48, -.48, .97], [.44, .73, .5], [.88, -.28, -.8], [1.26, .49, -.12]];

function GraphSculpture({ orbit }: { orbit: React.RefObject<Group | null> }) {
  return <>
    <group position={[0, -.5, 0]}>
      <mesh position={[0, -.55, 0]}><cylinderGeometry args={[1.42, 1.59, .26, 8]} /><meshStandardMaterial color={dark} roughness={.43} /></mesh>
      <Ring at={[0, -.4, 0]} radius={1.28} color={mint} />
      <Ring at={[0, -.36, 0]} radius={.99} color="#62a995" />
    </group>
    <group ref={orbit}>
      {edges.map(({ id, from, to }) => <Rod key={id} from={graphPoints[vertices.indexOf(from)]} to={graphPoints[vertices.indexOf(to)]} color="#a7dfbf" />)}
      {graphPoints.map((point, i) => <Gem key={i} at={point} size={i % 2 ? .24 : .28} color={[mint, lime, sky][i % 3]} />)}
      <Ring radius={1.68} tilt={.22} color="#5cb298" />
    </group>
  </>;
}

function Finale({ orbit }: { orbit: React.RefObject<Group | null> }) {
  return <group ref={orbit}>
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh><cylinderGeometry args={[1.02, 1.02, .23, 12]} /><meshStandardMaterial color={gold} roughness={.28} metalness={.2} /></mesh>
      <mesh position={[0, .145, 0]}><cylinderGeometry args={[.87, .87, .11, 12]} /><meshStandardMaterial color="#517b58" roughness={.35} /></mesh>
      <Ring radius={.78} at={[0, .212, 0]} color={lime} />
    </group>
    <Rod from={[-.48, -.02, .225]} to={[-.13, -.32, .225]} color="#f1ffd0" radius={.095} />
    <Rod from={[-.13, -.32, .225]} to={[.48, .31, .225]} color="#f1ffd0" radius={.095} />
    {Array.from({ length: 10 }, (_, i) => {
      const angle = i * Math.PI * 2 / 10;
      return <Gem key={i} at={[Math.cos(angle) * (1.42 + (i % 3) * .16), Math.sin(angle) * 1.28, (i % 3) * .24 - .2]} color={[lime, gold, lilac][i % 3]} size={i % 2 ? .11 : .16} />;
    })}
  </group>;
}

const framing: Record<SculptureKind, [width: number, height: number]> = {
  traversal: [9.5, 3.05], graph: [4.35, 3.5], finale: [4.45, 3.35],
};

function SculptureCamera({ kind }: { kind: SculptureKind }) {
  const camera = useRef<ThreeCamera>(null);
  const { width, height } = useThree(state => state.size);
  const [frameWidth, frameHeight] = framing[kind];
  useLayoutEffect(() => {
    camera.current?.lookAt(0, kind === "finale" ? 0 : -.12, 0);
  }, [kind]);
  return <OrthographicCamera ref={camera} makeDefault position={[0, kind === "finale" ? 1.4 : 3.4, 8]}
    zoom={Math.min(width / frameWidth, height / frameHeight)} near={.1} far={35} />;
}

function Sculpture({ kind, reduced }: { kind: SculptureKind; reduced: boolean }) {
  const root = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  const queue = useRef<Group>(null);
  const stack = useRef<Group>(null);
  const elapsed = useRef(0);
  const visible = useRef(false);
  const { gl, invalidate } = useThree();

  useLayoutEffect(() => {
    elapsed.current = 0;
    invalidate();
  }, [reduced, invalidate]);

  useEffect(() => {
    if (reduced) return;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (visible.current) invalidate();
    });
    observer.observe(gl.domElement);
    return () => observer.disconnect();
  }, [gl, reduced, invalidate]);

  useFrame((_, delta) => {
    const time = elapsed.current;
    const settle = reduced ? 1 : MathUtils.smoothstep(time, 0, .8);
    const cycle = time * Math.PI / 4;
    if (root.current) {
      root.current.position.y = -.32 * (1 - settle);
      root.current.scale.setScalar(.88 + .12 * settle);
      root.current.rotation.y = reduced ? 0 : Math.sin(cycle) * .13 - (1 - settle) * .28;
    }
    queue.current?.children.forEach((tile, i) => {
      const enter = reduced ? 1 : MathUtils.smoothstep(time, .28 + i * .22, 1.13 + i * .22);
      const glide = reduced ? 0 : Math.sin(cycle * 2) * .24;
      tile.position.x = -1.17 + .78 * i + .65 * (1 - enter) + glide * enter;
      tile.scale.setScalar(.34 + .66 * enter);
    });
    stack.current?.children.forEach((tile, i) => {
      const enter = reduced ? 1 : MathUtils.smoothstep(time, .4 + i * .3, 1.22 + i * .3);
      const fan = reduced ? 0 : (1 - Math.cos(cycle * 2)) * .065 * i;
      tile.position.y = -.48 + i * .3 + .76 * (1 - enter) + fan * enter;
      tile.scale.setScalar(.42 + .58 * enter);
    });
    if (orbit.current) orbit.current.rotation.y = (kind === "finale" ? .11 : .38) + (reduced ? 0 : cycle);
    if (!reduced && visible.current) {
      elapsed.current += Math.min(delta, .05);
      invalidate();
    }
  });

  return <group ref={root}>
    {kind === "traversal" && <Traversal queue={queue} stack={stack} />}
    {kind === "graph" && <GraphSculpture orbit={orbit} />}
    {kind === "finale" && <Finale orbit={orbit} />}
  </group>;
}

function ContextEvents({ onLost }: { onLost: (failed: boolean) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLost(true); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

export default function SculptureCanvas({ kind, reduced, onReady, onLost }: {
  kind: SculptureKind; reduced: boolean; onReady: (ready: boolean) => void; onLost: (failed: boolean) => void;
}) {
  return <Canvas frameloop="demand" dpr={[1, 1.4]}
    gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} onCreated={() => onReady(true)}>
    <SculptureCamera kind={kind} />
    <hemisphereLight args={["#effff1", "#557383", 2.05]} />
    <directionalLight position={[-3, 5, 4]} intensity={2.4} color="#ffefd3" />
    <directionalLight position={[4, 3, -5]} intensity={1.8} color="#a1ddff" />
    <Sculpture kind={kind} reduced={reduced} />
    <ContextEvents onLost={onLost} />
  </Canvas>;
}
