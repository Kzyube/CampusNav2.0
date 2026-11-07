"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { playDeckSound } from "./deck-sound";
import { ArrowDown, ArrowUp, Mouse } from "lucide-react";

export type LessonStep = { label: string; text: string };

export function ScrollLesson({ steps, renderVisual, featured = false }: {
  steps: LessonStep[];
  featured?: boolean;
  renderVisual: (index: number) => ReactNode;
}) {
  const [position, setPosition] = useState(0);
  const soundedStep = useRef(0);
  const viewport = useRef<HTMLDivElement>(null);
  const last = steps.length - 1;
  const active = Math.min(last, Math.max(0, Math.round(position)));
  const step = steps[active];
  const visual = useMemo(() => renderVisual(active), [active, renderVisual]);

  function go(index: number) {
    const pane = viewport.current;
    const row = pane?.firstElementChild;
    if (!pane || !(row instanceof HTMLElement)) return;
    pane.scrollTo({ top: Math.min(last, Math.max(0, index)) * row.offsetHeight });
  }

  return <div className={featured ? "scroll-lesson scroll-lesson--featured" : "scroll-lesson"}>
    <div className="lesson-rail">
      <div className="lesson-instructions"><Mouse size={15} /> Scroll the titles or choose a step</div>
      <div className="lesson-wheel">
        <div className="lesson-wheel-band" aria-hidden="true" />
        <div className="lesson-wheel-titles" aria-hidden="true">
          {steps.map(({ label }, index) => {
            const offset = index - position;
            const angle = Math.max(-1.5, Math.min(1.5, offset * .49));
            const distance = Math.abs(offset);
            return <span key={label} className="lesson-wheel-title" data-current={index === active}
              style={{
                transform: `translate(-50%, -50%) translateY(calc(var(--wheel-row) * ${Math.sin(angle) * 2.13})) rotateX(${-angle * 57.3}deg) scale(${1 - Math.min(distance, 3) * .085})`,
                opacity: distance > 3.2 ? 0 : index === active ? 1 : Math.max(.13, .62 - distance * .15),
              }}>{label}</span>;
          })}
        </div>
        <div className="lesson-scroll" ref={viewport} tabIndex={0} role="region" aria-label="Lesson steps"
          aria-describedby="current-lesson-step" data-scroll-lesson
          onScroll={event => {
            const pane = event.currentTarget;
            const row = pane.firstElementChild;
            if (row instanceof HTMLElement && row.offsetHeight) {
              const next = pane.scrollTop / row.offsetHeight;
              const centered = Math.min(last, Math.max(0, Math.round(next)));
              if (soundedStep.current !== centered) {
                soundedStep.current = centered;
                playDeckSound("step");
              }
              setPosition(next);
            }
          }}
          onKeyDown={event => {
            const index = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: last }[event.key];
            if (index === undefined) return;
            event.preventDefault();
            go(index);
          }}>
          {steps.map(({ label }) => <div key={label} className="lesson-scroll-stop" aria-hidden="true" />)}
        </div>
      </div>
      <div className="lesson-copy" id="current-lesson-step" aria-live="polite">
        <span className="eyebrow">Step {active + 1} / {steps.length}</span>
        <h3 className="sr-only">{step.label}</h3>
        <p>{step.text}</p>
      </div>
      <div className="lesson-controls">
        <button className="button button--secondary" type="button" aria-label="Previous lesson step" disabled={active === 0} onClick={() => go(active - 1)}><ArrowUp size={15} /></button>
        <div className="lesson-stops" aria-label="Choose a lesson step">
          {steps.map(({ label }, index) => <button className="lesson-stop" key={label} type="button" aria-label={label} title={label} aria-current={index === active ? "step" : undefined} onClick={() => go(index)}>{index + 1}</button>)}
        </div>
        <button className="button button--secondary" type="button" aria-label="Next lesson step" disabled={active === last} onClick={() => go(active + 1)}><ArrowDown size={15} /></button>
      </div>
    </div>
    <div className="lesson-visual">{visual}</div>
  </div>;
}
