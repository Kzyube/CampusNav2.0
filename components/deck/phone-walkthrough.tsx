"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Navigation, Pause, Play, RotateCcw } from "lucide-react";
import { buildingById, edgeById } from "@/lib/graph";
import { playDeckSound } from "./deck-sound";
import { NetworkMap } from "../graph/network-map";

const sampleWalkway = edgeById.get("A-B")!;
const [tapX, tapY] = buildingById.B.point;

export function PhoneWalkthrough() {
  const scene = useRef<HTMLDivElement>(null);
  const playback = useRef<gsap.core.Timeline | null>(null);
  const isPaused = useRef(false);
  const [paused, setPaused] = useState(false);

  useLayoutEffect(() => {
    const root = scene.current;
    const line = root?.querySelector<SVGLineElement>(".map-link--marked line");
    if (!root || !line) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const length = line.getTotalLength();
      const timeline = gsap.timeline({ repeat: -1, paused: isPaused.current });
      playback.current = timeline;

      // Hold the result long enough to read before the device turns out and starts again.
      timeline
        .from(".phone-halo", { scale: .7, opacity: .12, duration: .95, ease: "power2.out" }, 0)
        .from(".phone-device", { x: -32, y: 40, rotationY: -52, rotationZ: -12, scale: .82, opacity: 0, duration: .92, ease: "power4.out" }, 0)
        .set(".phone-map-screen", { autoAlpha: 0, y: 8 }, 0)
        .set(line, { strokeDasharray: length, strokeDashoffset: length }, 0)
        .set(".phone-route-total", { y: 7, opacity: 0 }, 0)
        .set(".phone-start-screen", { autoAlpha: 1 }, 0)
        .from(".phone-join-chip", { y: 7, opacity: 0, duration: .32 }, .54)
        .to(".phone-join-chip", { scale: .92, duration: .13, yoyo: true, repeat: 1 }, 1.04)
        .to(".phone-start-screen", { autoAlpha: 0, y: -9, duration: .22, ease: "power2.in" }, 1.2)
        .to(".phone-map-screen", { autoAlpha: 1, y: 0, duration: .3 }, 1.43)
        .to(".phone-camera", { scale: 1.13, duration: .55, ease: "power2.inOut" }, 1.43)
        .call(() => { if (timeline.iteration() === 1) playDeckSound("step"); }, [], 2.03)
        .set(".phone-tap", { opacity: .95, scale: .24 }, 2.03)
        .to(".phone-tap", { opacity: 0, scale: 1.75, duration: .55, ease: "power2.out" }, 2.03)
        .to(line, { strokeDashoffset: 0, duration: .48, ease: "power2.inOut" }, 2.09)
        .to(".phone-route-total", { y: 0, opacity: 1, duration: .31, ease: "power2.out" }, 2.56)
        .to(".phone-camera", { scale: 1, duration: .55, ease: "power2.inOut" }, 2.72)
        .to(".phone-device", { rotationY: 35, y: -12, opacity: 0, duration: .38, ease: "power2.in" }, 4.5);

      return () => { playback.current = null; };
    }, root);
    return () => media.revert();
  }, []);

  function togglePause() {
    isPaused.current = !isPaused.current;
    setPaused(isPaused.current);
    playback.current?.paused(isPaused.current);
  }

  function restart() {
    isPaused.current = false;
    setPaused(false);
    playback.current?.restart();
  }

  return <figure className="phone-walkthrough">
    <figcaption><span>Phone walkthrough</span><div className="phone-playback">
      <button className="icon-button phone-replay" type="button" title={paused ? "Resume phone walkthrough" : "Pause phone walkthrough"}
        aria-label={paused ? "Resume phone walkthrough" : "Pause phone walkthrough"} onClick={togglePause}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>
      <button className="icon-button phone-replay" type="button" title="Replay phone walkthrough"
        aria-label="Replay phone walkthrough" onClick={restart}><RotateCcw size={15} /></button>
    </div></figcaption>
    <div ref={scene} className="phone-world" aria-hidden="true">
      <div className="phone-halo" />
      <div className="phone-camera">
        <div className="phone-device">
          <div className="phone-screen">
            <div className="phone-earpiece" />
            <div className="phone-brand"><Navigation size={12} /> CampusNav</div>
            <div className="phone-start-screen">
              <span>Class challenge</span>
              <strong>Join the route game</strong>
              <div className="phone-nickname">Nickname</div>
              <div className="phone-join-chip">Join activity <ArrowRight size={12} /></div>
            </div>
            <div className="phone-map-screen">
              <strong>Build your route</strong>
              <div className="phone-graph">
                <NetworkMap state={{ highlighted: [sampleWalkway.id], visited: ["A"] }} showWeights={false} showNames={false} />
                <svg viewBox="31 19 647 431"><circle className="phone-tap" cx={tapX} cy={tapY} r="26" /></svg>
              </div>
              <div className="phone-route-total"><span>First hop</span><strong>{sampleWalkway.from} → {sampleWalkway.to}</strong><small>{sampleWalkway.weight} units</small></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <span className="sr-only">The preview shows joining the activity and adding a four-unit walkway from Administration to Library.</span>
  </figure>;
}
