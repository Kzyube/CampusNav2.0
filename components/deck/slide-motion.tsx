"use client";

import { motion } from "framer-motion";
import {
  ArrowDownToLine, ArrowLeftRight, ArrowRightToLine, Building2, Cable, Combine, CirclePlus,
  Compass, GitFork, Grid2X2, Layers3, ListOrdered, MapPin, Network, Radio, Route,
  Smartphone, Split, Sprout, Users, Waypoints, type LucideIcon,
} from "lucide-react";
import type { Layout } from "@/lib/slides";

type Mark = { icon: LucideIcon; route: string; color: string; tint: string; entrance: "rise" | "split" | "lift" | "unfold" | "settle" };

const marks: Record<Layout, Mark> = {
  cover: { icon: Compass, route: "M12 56 L34 45 L56 51 L76 23 L95 34 L124 13", color: "#57771e", tint: "#e9f6be", entrance: "lift" },
  problem: { icon: GitFork, route: "M12 55 L39 54 L60 35 L82 35 L102 15 L124 17", color: "#8a4b24", tint: "#f9e7c9", entrance: "split" },
  solution: { icon: Building2, route: "M12 57 L30 57 L49 33 L71 43 L97 24 L124 24", color: "#317361", tint: "#dcefe3", entrance: "unfold" },
  terms: { icon: Waypoints, route: "M12 56 L39 19 L61 56 L81 19 L102 56 L124 20", color: "#536d27", tint: "#eaf2c9", entrance: "unfold" },
  storage: { icon: Grid2X2, route: "M12 23 L41 23 L41 48 L73 48 L73 25 L124 25", color: "#3c617f", tint: "#e1ecf8", entrance: "split" },
  breadth: { icon: Radio, route: "M12 47 L29 39 L50 33 L73 33 L99 38 L124 49", color: "#3a7364", tint: "#dceee7", entrance: "lift" },
  bfs: { icon: ListOrdered, route: "M12 46 L32 46 L54 46 L76 46 L98 46 L124 46", color: "#5d741d", tint: "#ecf4c8", entrance: "rise" },
  dfs: { icon: ArrowDownToLine, route: "M12 17 L41 17 L41 33 L70 33 L70 56 L124 56", color: "#65568a", tint: "#ebe5f7", entrance: "settle" },
  compare: { icon: ArrowLeftRight, route: "M12 22 L37 22 L61 52 L81 52 L105 22 L124 22", color: "#3c617f", tint: "#e0edf6", entrance: "split" },
  connection: { icon: Split, route: "M12 52 L38 52 L57 23 L83 23 L101 52 L124 52", color: "#8d5731", tint: "#f7e8d7", entrance: "unfold" },
  components: { icon: Network, route: "M12 51 L31 20 L47 43 L89 43 L105 22 L124 51", color: "#2e766c", tint: "#daefe9", entrance: "split" },
  challenge: { icon: Smartphone, route: "M12 47 L27 36 L47 36 L66 53 L92 29 L124 29", color: "#627a1e", tint: "#e8f4b4", entrance: "lift" },
  relax: { icon: CirclePlus, route: "M12 23 L30 23 L57 56 L79 56 L103 28 L124 28", color: "#99562d", tint: "#f9ead8", entrance: "settle" },
  dijkstra: { icon: Route, route: "M12 52 L36 40 L49 25 L77 40 L98 19 L124 14", color: "#486c25", tint: "#e8f3cc", entrance: "rise" },
  tree: { icon: Sprout, route: "M12 54 L37 54 L63 36 L77 48 L101 24 L124 24", color: "#377361", tint: "#dff0e4", entrance: "unfold" },
  mst: { icon: Cable, route: "M12 36 L34 36 L57 20 L78 54 L103 36 L124 36", color: "#86552d", tint: "#f6ead5", entrance: "lift" },
  union: { icon: Combine, route: "M12 25 L36 48 L58 48 L78 28 L103 28 L124 49", color: "#66528b", tint: "#eee6f7", entrance: "split" },
  kruskal: { icon: ArrowRightToLine, route: "M12 54 L33 50 L55 43 L77 34 L102 23 L124 16", color: "#457028", tint: "#e7f2ca", entrance: "rise" },
  tech: { icon: Layers3, route: "M12 56 L33 41 L57 53 L80 28 L103 36 L124 16", color: "#3f6583", tint: "#e4eef8", entrance: "settle" },
  close: { icon: Users, route: "M12 52 L34 42 L56 38 L78 31 L102 21 L124 21", color: "#42682f", tint: "#eaf6c5", entrance: "lift" },
};

export function getSlideMark(layout: Layout) { return marks[layout]; }

export function SlideMotionMark({ layout, from, reduced }: { layout: Layout; from: Layout; reduced: boolean }) {
  const mark = marks[layout];
  const Icon = mark.icon;
  const points = mark.route.match(/\d+ \d+/g)!.map(point => point.split(" ").map(Number));

  return <div className="slide-motion-mark" aria-hidden="true">
    <svg className="slide-mark-path" viewBox="0 0 136 72">
      <path d="M4 18V7h11m106 0h11v11m0 36v11h-11m-106 0H4V54" className="slide-mark-corners" />
      <motion.path className="slide-mark-route" initial={reduced ? false : { d: marks[from].route, pathLength: 0.25 }}
        animate={{ d: mark.route, pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: .68, ease: [0.2, 0.8, 0.2, 1] }} />
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 5 ? 3.9 : 2.2} className={i === 5 ? "slide-mark-destination" : "slide-mark-point"}
        style={{ animationDelay: `${0.16 + i * .056}s` }} />)}
    </svg>
    <span className="slide-mark-icon"><Icon size="57%" strokeWidth={1.7} /></span>
    <span className="slide-mark-pin"><MapPin size={10} strokeWidth={2.5} /></span>
  </div>;
}
