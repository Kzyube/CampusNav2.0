"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Object3D, type Group, type InstancedMesh } from "three";

type Vec3 = [number, number, number];
type Piece = { at: Vec3; size: Vec3; color: string; turn: number };

const staticPieces = { box: [] as Piece[], round: [] as Piece[], canopy: [] as Piece[] };

function buildCampusDetails() {
  const box = (at: Vec3, size: Vec3, color: string, turn = 0) => staticPieces.box.push({ at, size, color, turn });
  const round = (at: Vec3, size: Vec3, color: string) => staticPieces.round.push({ at, size, color, turn: 0 });
  const canopy = (at: Vec3, size: Vec3, color: string, turn = 0) => staticPieces.canopy.push({ at, size, color, turn });

  const paving = "#a7a99a";
  const wood = "#a86a43";
  const metal = "#3d574e";
  const cream = "#f4ebce";

  function lamp(x: number, z: number) {
    round([x, .065, z], [.18, .13, .18], metal);
    round([x, .49, z], [.05, .89, .05], metal);
    canopy([x, .96, z], [.19, .17, .19], "#ffe4a0");
    box([x, 1.04, z], [.22, .06, .22], metal);
  }

  function bench(x: number, z: number) {
    box([x, .17, z], [.62, .07, .23], wood);
    box([x, .31, z - .1], [.62, .13, .055], wood);
    for (const offset of [-.23, .23]) box([x + offset, .08, z], [.06, .16, .22], metal);
  }

  function planter(x: number, z: number, color: string) {
    round([x, .105, z], [.28, .21, .28], "#b57959");
    canopy([x, .26, z], [.32, .25, .32], "#74975c");
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3;
      canopy([x + Math.cos(angle) * .095, .35, z + Math.sin(angle) * .095], [.105, .085, .105], color);
    }
  }

  // Fountain court and planted paths.
  round([-7.28, .024, 2.32], [2.52, .05, 2.52], paving);
  round([-7.28, .125, 2.32], [1.56, .2, 1.56], "#d9d2bc");
  round([-7.28, .235, 2.32], [1.34, .035, 1.34], "#49b4c1");
  round([-7.28, .31, 2.32], [.3, .17, .3], cream);
  round([-7.28, .425, 2.32], [.5, .065, .5], "#8dd1d7");
  for (const x of [-7.94, -6.6]) {
    bench(x, 3.43);
    planter(x, 1.46, "#f4bf70");
  }

  // Sculpture garden in the open lawn between the academic buildings.
  round([-4.45, .026, -1.45], [1.58, .052, 1.58], "#899e77");
  round([-4.45, .092, -1.45], [.64, .13, .64], "#dbcbad");
  for (let i = 0; i < 5; i++) {
    box([-4.45, .2 + i * .11, -1.45], [.34 - i * .034, .11, .34 - i * .034], i % 2 ? "#63a296" : "#dfba67", i * .28);
  }
  bench(-4.45, -.76);
  planter(-5.09, -1.59, "#efa3aa");
  planter(-3.84, -1.62, "#f4bf70");

  // Basketball court, fence, markings and hoops.
  const courtX = 5.85;
  const courtZ = -3.64;
  box([courtX, .045, courtZ], [4.33, .09, 2.38], "#415b50");
  box([courtX, .098, courtZ], [4.15, .025, 2.19], "#4a8c80");
  round([courtX, .12, courtZ], [.76, .018, .76], cream);
  round([courtX, .135, courtZ], [.68, .018, .68], "#4a8c80");
  box([courtX, .15, courtZ], [.028, .008, 2.12], cream);
  for (const side of [-1, 1]) {
    const x = courtX + side * 1.91;
    box([courtX, .12, courtZ + side * 1.04], [3.85, .012, .028], cream);
    box([x, .12, courtZ], [.028, .012, 2.11], cream);
    box([x - side * .36, .12, courtZ], [.72, .015, .82], "#cc835f");
    box([x, .53, courtZ], [.055, .89, .055], metal);
    box([x - side * .08, .94, courtZ], [.055, .3, .49], cream);
    round([x - side * .23, .82, courtZ], [.23, .035, .23], "#d77c50");
  }
  for (let i = 0; i <= 6; i++) box([courtX - 2.13 + i * .71, .27, courtZ - 1.14], [.055, .54, .055], metal);
  for (const y of [.22, .45]) box([courtX, y, courtZ - 1.14], [4.3, .036, .045], "#7b9d89");

  // Arrival parking, cars and a covered shuttle stop.
  box([-5.28, .035, -4.5], [3.63, .07, 1.92], "#58645f");
  for (let i = 0; i <= 4; i++) box([-6.84 + i * .71, .08, -5.06], [.022, .012, .64], cream);
  for (const [x, color] of [[-6.51, "#e3b86d"], [-5.8, "#77b6bb"], [-4.38, "#d18372"]] as const) {
    box([x, .18, -5.04], [.32, .16, .49], color);
    box([x, .285, -5.06], [.24, .09, .24], "#3c5d63");
    for (const xOffset of [-.16, .16]) {
      for (const zOffset of [-.14, .14]) box([x + xOffset, .135, -5.04 + zOffset], [.055, .09, .105], "#313f40");
    }
  }
  box([-3.53, .035, -4.91], [.58, .07, 1.03], paving);
  box([-3.53, .72, -4.91], [.62, .095, 1.08], "#e5ba68");
  box([-3.76, .4, -4.91], [.04, .57, .92], "#7cb1ac");
  for (const z of [-5.36, -4.46]) box([-3.33, .38, z], [.055, .7, .055], metal);
  box([-3.58, .22, -4.91], [.26, .07, .68], wood);

  // Picnic terrace, with a small timber pavilion and café furniture.
  box([4.86, .045, 4.53], [3.04, .09, 1.9], "#a3987f");
  for (let i = 0; i < 8; i++) box([3.48 + i * .39, .095, 4.53], [.015, .012, 1.85], "#c1b399");
  for (const x of [3.62, 4.7]) {
    for (const z of [4.03, 5.02]) box([x, .45, z], [.075, .83, .075], wood);
  }
  for (let i = 0; i < 7; i++) box([3.61 + i * .18, .87, 4.53], [.075, .09, 1.19], "#bb7c52");
  for (const z of [4.03, 5.02]) box([4.16, .82, z], [1.23, .075, .08], "#9a5e41");
  for (const [x, z] of [[4.2, 4.55], [5.24, 4.07], [5.74, 4.94]]) {
    round([x, .23, z], [.08, .43, .08], metal);
    round([x, .44, z], [.53, .055, .53], "#eedbaa");
    for (const offset of [-.4, .4]) {
      round([x + offset, .13, z], [.07, .24, .07], metal);
      round([x + offset, .25, z], [.23, .06, .23], "#c58459");
    }
  }
  round([5.74, .61, 4.94], [.048, 1.14, .048], metal);
  canopy([5.74, 1.13, 4.94], [.77, .19, .77], "#f4c975", .4);

  for (const [x, z] of [[-8.67, 1.5], [-6.17, 2.73], [-5.36, -3.53], [-2.89, -4.87], [3.66, -2.5], [8.32, -2.41], [6.42, 4.96], [2.92, 4.56], [8.55, 2.68], [.48, -4.84]]) lamp(x, z);
  for (const [x, z, color] of [[3.56, 5.29, "#f1ba6c"], [6.1, 3.77, "#e4a8bd"], [-6.05, 3.75, "#edac93"], [-3.21, 3.89, "#f1ba6c"], [8.75, 2.47, "#e4a8bd"], [6.08, .59, "#f1ba6c"], [3.45, .79, "#e4a8bd"]] as const) planter(x, z, color);
  bench(-3.92, 4.38);
  bench(7.93, 2.81);
  bench(7.49, -1.8);
}

buildCampusDetails();

function Pieces({ kind, pieces }: { kind: keyof typeof staticPieces; pieces: Piece[] }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const instances = mesh.current;
    if (!instances) return;
    const model = new Object3D();
    const color = new Color();
    pieces.forEach(({ at, size, color: hex, turn }, index) => {
      model.position.set(...at);
      model.scale.set(...size);
      model.rotation.y = turn;
      model.updateMatrix();
      instances.setMatrixAt(index, model.matrix);
      instances.setColorAt(index, color.set(hex));
    });
    instances.instanceMatrix.needsUpdate = true;
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
    instances.computeBoundingSphere();
  }, [pieces]);

  return <instancedMesh ref={mesh} args={[undefined, undefined, pieces.length]}>
    {kind === "box" ? <boxGeometry /> : kind === "round" ? <cylinderGeometry args={[.5, .5, 1, 20]} /> : <icosahedronGeometry args={[.5, 1]} />}
    <meshStandardMaterial roughness={.85} />
  </instancedMesh>;
}

export function CampusDetails() {
  return <>
    <Pieces kind="box" pieces={staticPieces.box} />
    <Pieces kind="round" pieces={staticPieces.round} />
    <Pieces kind="canopy" pieces={staticPieces.canopy} />
  </>;
}

function MovingBox({ at, size, color }: { at: Vec3; size: Vec3; color: string }) {
  return <mesh position={at} scale={size}><boxGeometry /><meshStandardMaterial color={color} roughness={.8} /></mesh>;
}

const walks = [
  { start: [-4.04, 1.87], end: [1.63, 4.05], speed: .075, phase: .24, color: "#efb659" },
  { start: [1.7, 4.03], end: [7.08, .94], speed: .062, phase: .57, color: "#e7a1b8" },
  { start: [-7.02, -2.15], end: [-1.47, -3.94], speed: .062, phase: .49, color: "#8ed1d0" },
];

export function CampusLife({ active }: { active: boolean }) {
  const people = useRef<Group>(null);
  const shuttle = useRef<Group>(null);
  const fountain = useRef<Group>(null);
  const ball = useRef<Group>(null);
  const elapsed = useRef(0);
  const { gl, invalidate } = useThree();

  useEffect(() => {
    if (!active) return;
    let visible = false;
    let timer: number | undefined;
    function tick() {
      window.clearTimeout(timer);
      if (document.hidden || !visible) return;
      elapsed.current += 1 / 30;
      invalidate();
      timer = window.setTimeout(tick, 1000 / 30);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      tick();
    });
    observer.observe(gl.domElement);
    document.addEventListener("visibilitychange", tick);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", tick);
      window.clearTimeout(timer);
    };
  }, [active, gl, invalidate]);

  useFrame(() => {
    const time = elapsed.current;
    people.current?.children.forEach((student, i) => {
      const { start, end, speed, phase } = walks[i];
      const progress = (time * speed + phase) % 2;
      const forward = progress < 1;
      const fraction = forward ? progress : 2 - progress;
      const stride = Math.sin(time * 10 + i) * .65;
      student.position.set(start[0] + (end[0] - start[0]) * fraction, .095, start[1] + (end[1] - start[1]) * fraction);
      student.rotation.y = Math.atan2(end[0] - start[0], end[1] - start[1]) + (forward ? 0 : Math.PI);
      student.children[0].rotation.x = stride;
      student.children[1].rotation.x = -stride;
    });

    if (shuttle.current) {
      const loop = time * .53;
      shuttle.current.position.set(-5.33 + Math.sin(loop) * 1.12, .085, -4.25 + Math.cos(loop) * .22);
      shuttle.current.rotation.y = Math.atan2(Math.sin(loop) * .22, Math.cos(loop) * 1.12);
    }

    fountain.current?.children.forEach((drop, index) => {
      const angle = index * 2.4;
      const phase = (time * 1.65 + index / 12) % 1;
      const radius = phase * .53;
      drop.position.set(Math.cos(angle) * radius, .43 + 1.42 * phase - 1.58 * phase * phase, Math.sin(angle) * radius);
    });

    if (ball.current) {
      ball.current.position.set(5.82 + Math.sin(time * 1.35) * .68, .2 + Math.abs(Math.sin(time * 4.1)) * .58, -3.53);
      ball.current.rotation.z = -time * 3;
    }
  });

  return <>
    <group ref={people}>{walks.map(({ color }) => <group key={color}>
      <group position={[-.045, .12, 0]}><MovingBox at={[0, -.065, 0]} size={[.057, .14, .064]} color="#354957" /></group>
      <group position={[.045, .12, 0]}><MovingBox at={[0, -.065, 0]} size={[.057, .14, .064]} color="#354957" /></group>
      <MovingBox at={[0, .225, 0]} size={[.19, .22, .115]} color={color} />
      <MovingBox at={[0, .23, -.076]} size={[.13, .16, .06]} color="#5e6653" />
      <mesh position={[0, .4, 0]}><sphereGeometry args={[.082, 10, 8]} /><meshStandardMaterial color="#eac194" /></mesh>
      <mesh position={[0, .45, -.014]}><sphereGeometry args={[.075, 10, 8]} /><meshStandardMaterial color="#353d31" /></mesh>
    </group>)}</group>
    <group ref={shuttle}>
      <MovingBox at={[0, .17, 0]} size={[.61, .27, .27]} color="#e8c66c" />
      <MovingBox at={[.055, .29, 0]} size={[.43, .14, .245]} color="#55808a" />
      <MovingBox at={[.055, .37, 0]} size={[.44, .035, .255]} color="#f7e3aa" />
      {[-.19, .19].flatMap(x => [-.14, .14].map(z => <MovingBox key={`${x}-${z}`} at={[x, .075, z]} size={[.13, .12, .052]} color="#2b3938" />))}
    </group>
    <group ref={fountain} position={[-7.28, 0, 2.32]}>
      {Array.from({ length: 12 }, (_, index) => <mesh key={index}><sphereGeometry args={[.037, 6, 5]} /><meshStandardMaterial color="#a9f3f6" emissive="#308296" emissiveIntensity={.4} /></mesh>)}
    </group>
    <group ref={ball}>
      <mesh><sphereGeometry args={[.105, 12, 8]} /><meshStandardMaterial color="#ec9a55" /></mesh>
      <mesh><torusGeometry args={[.105, .008, 4, 16]} /><meshStandardMaterial color="#754c3c" /></mesh>
    </group>
  </>;
}
