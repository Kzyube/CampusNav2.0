"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowDownRight, ChevronLeft, ChevronRight, ClipboardList, Grid2X2, Maximize, Minimize, NotebookText, Radio, Volume2, VolumeX, X } from "lucide-react";
import { SlideMotionMark, getSlideMark } from "./slide-motion";
import { SlideStage } from "./slide-stage";
import { StudentDoodle } from "./student-doodle";
import { playDeckSound, primeDeckSound, setDeckSound, soundEnabled, subscribeSound } from "./deck-sound";
import { Brand } from "../brand";
import { duration, presenters, slideNumber, slides } from "@/lib/slides";
import { quizQuestions } from "@/lib/quiz";
import { DeckQuiz } from "./deck-quiz";
import { activeSlideKey, NotesLink, SpeakerNotes } from "./notes";
import { Cover, PresenterBadge, SlideBody } from "./slide-content";

function Modal({ open, onClose, label, variant, children }: {
  open: boolean; onClose: () => void; label: string; variant: "overview" | "notes" | "quiz"; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialog.current) return;
    if (open && !dialog.current.open) dialog.current.showModal();
    else if (!open && dialog.current.open) dialog.current.close();
  }, [open]);

  return <dialog ref={dialog} className={`deck-dialog deck-dialog--${variant}`} aria-label={label} onClose={onClose}
    onClick={event => { if (variant !== "quiz" && event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-content">
      <div className="dialog-toolbar"><span className="eyebrow">{label}</span><button className="icon-button" type="button" onClick={onClose} aria-label={`Close ${label.toLowerCase()}`}><X size={20} /></button></div>
      {children}
    </div>
  </dialog>;
}

function Overview({ index, onSelect }: { index: number; onSelect: (index: number) => void }) {
  return <div className="overview-content">
    <h2>Presentation overview</h2><p>{slides.length} slides · {presenters.length} presenters · {slides.reduce((total, item) => total + item.seconds, 0) / 60} minutes</p>
    <div className="overview-grid">{presenters.map((presenter, group) => <section key={presenter.name}>
      <div className="overview-person"><span>{String(group + 1).padStart(2, "0")}</span><div><h3>{presenter.name}</h3><p>{presenter.section}</p></div></div>
      {slides.map((slide, i) => slide.presenter === group && <button type="button" key={slide.title} onClick={() => onSelect(i)} aria-current={i === index ? "step" : undefined}>
        <span>{slideNumber(i)}</span><strong>{slide.title}</strong><small>{duration(slide.seconds)}</small>
      </button>)}
    </section>)}</div>
  </div>;
}

export function Presentation({ initialIndex }: { initialIndex: number }) {
  const [{ index, from }, setSlide] = useState({ index: initialIndex, from: initialIndex });
  const [panel, setPanel] = useState<"overview" | "notes" | "quiz" | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fitScreen, setFitScreen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const slide = slides[index];
  const lastSlide = index === slides.length - 1;
  const mood = slide.layout === "problem" ? "lost" : slide.layout === "solution" ? "learning" : null;
  const presenter = presenters[slide.presenter];
  const startsSection = index === 0 || slides[index - 1].presenter !== slide.presenter;
  const reduced = Boolean(useReducedMotion());
  const mark = getSlideMark(slide.layout);
  const emblem = <SlideMotionMark layout={slide.layout} from={slides[from].layout} reduced={reduced} />;
  const sound = useSyncExternalStore(subscribeSound, soundEnabled, () => true);
  const full = fullscreen || fitScreen;

  const navigate = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    if (clamped === index) return;
    primeDeckSound();
    playDeckSound(clamped > index ? "next" : "back");
    setSlide({ index: clamped, from: index });
    if (window.matchMedia("(max-width: 760px)").matches) {
      if (document.fullscreenElement) frame.current?.scrollTo(0, 0);
      else window.scrollTo(0, 0);
    }
  }, [index]);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (fitScreen) { setFitScreen(false); return; }
    if (frame.current?.requestFullscreen) {
      try { await frame.current.requestFullscreen(); return; }
      catch { /* Some mobile browsers only support fullscreen for video. */ }
    }
    setFitScreen(true);
  }, [fitScreen]);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (index > 0) url.searchParams.set("slide", String(index + 1));
    else url.searchParams.delete("slide");
    window.history.replaceState(window.history.state, "", url);
    try { localStorage.setItem(activeSlideKey, String(index)); } catch { /* In-page notes remain available. */ }
  }, [index]);

  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      if (panel) return;
      const key = event.key.toLowerCase();
      const target = event.target as Element | null;
      if (target?.closest?.("input, select, textarea, [data-scroll-lesson], [contenteditable], [role='button']")) return;
      if (key === " " && target?.closest?.("button, a")) return;
      if (key === "arrowright" || key === "pagedown" || key === " ") { event.preventDefault(); navigate(index + 1); }
      else if (key === "arrowleft" || key === "pageup") { event.preventDefault(); navigate(index - 1); }
      else if (key === "home") { event.preventDefault(); navigate(0); }
      else if (key === "end") { event.preventDefault(); navigate(slides.length - 1); }
      else if (key === "f") void toggleFullscreen();
      else if (key === "o") setPanel("overview");
      else if (key === "n") setPanel("notes");
      else if (key === "escape") setFitScreen(false);
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [index, navigate, panel, toggleFullscreen]);

  return <div ref={frame} onClickCapture={primeDeckSound} onKeyDownCapture={primeDeckSound} className={`deck ${fitScreen ? "deck--fitscreen" : ""}`}>
    <header className="deck-header">
      <div className="deck-header-inner">
        <div className="deck-brand"><Brand /><span className="deck-chapter">CHAPTER 7<span /> COMPUTER SCIENCE</span></div>
        <nav className="deck-tools" aria-label="Presentation tools">
          <button type="button" aria-pressed={sound} aria-label="Presentation sound" title={sound ? "Mute presentation sound" : "Enable presentation sound"} onClick={() => setDeckSound(!sound)}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />} <span>Sound</span></button>
          <button type="button" onClick={() => setPanel("overview")} title="Slide overview (O)" aria-label="Slide overview"><Grid2X2 size={17} /> <span>Overview</span></button>
          <button type="button" onClick={() => setPanel("notes")} title="Speaker notes (N)" aria-label="Speaker notes"><NotebookText size={17} /> <span>Notes</span></button>
          <button type="button" onClick={() => void toggleFullscreen()} title="Fullscreen (F)" aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}>{full ? <Minimize size={17} /> : <Maximize size={17} />} <span>{full ? "Exit fullscreen" : "Fullscreen"}</span></button>
          <a href="/admin" target="_blank" rel="noreferrer" title="Presenter controls" aria-label="Presenter controls"><Radio size={17} /> <span>Live activity</span></a>
        </nav>
      </div>
    </header>

    <main className="deck-main" aria-label="Presentation slides">
      <div className="deck-meta"><span><i /> CampusNav presentation</span><span>{presenters[slide.presenter].section} <b>{slideNumber(index)} / {slides.length}</b></span></div>
      <section className={`deck-stage deck-stage--${slide.layout}`} aria-label={slide.title} style={{ "--scene-ink": mark.color, "--scene-tint": mark.tint } as CSSProperties}>
        <SlideStage key={index} entrance={mark.entrance}>
          {slide.layout === "cover" ? <Cover emblem={emblem} onNext={() => navigate(index + 1)} /> : slide.layout === "close" ? <SlideBody layout="close" emblem={emblem} /> : <div className="standard-slide">
            <div className="slide-heading slide-heading--marked">{emblem}<span className="eyebrow"><i /> {slideNumber(index)} / {presenters[slide.presenter].section}</span><h1>{slide.headline ?? slide.title}</h1><p>{slide.lead}</p>{startsSection && <p className="slide-handoff"><strong>{presenter.name}</strong> <span>{presenter.question}</span></p>}</div>
            <div className={mood ? "slide-body slide-body--story" : "slide-body"}><div className="slide-body-content"><SlideBody layout={slide.layout} presenter={slide.presenter} /></div>{mood && <StudentDoodle mood={mood} />}</div>
            <div className={`takeaway${lastSlide ? " takeaway--quiz" : ""}`}><ArrowDownRight size={18} /><p>{slide.takeaway}</p>
              {lastSlide && <div className="quiz-launch">
                <span>15 questions</span>
                <button className="button button--primary" type="button" onClick={() => setPanel("quiz")}><ClipboardList size={17} /> Start Quiz</button>
              </div>}
            </div>
          </div>}
        </SlideStage>
      </section>
      <div className="deck-footer">
        <PresenterBadge index={slide.presenter} />
        <div className="deck-pagination">
          <button className="button button--secondary" type="button" aria-label="Previous slide" title="Previous slide (←)" disabled={index === 0} onClick={() => navigate(index - 1)}><ChevronLeft size={20} /></button>
          <div className="deck-progress"><div><span>Slide <b>{slideNumber(index)}</b> of {slides.length}</span><span>{duration(slide.seconds)}</span></div><progress max={slides.length} value={index + 1} aria-label="Presentation progress" /></div>
          <button className="button button--primary" type="button" aria-label="Next slide" title="Next slide (→)" disabled={index === slides.length - 1} onClick={() => navigate(index + 1)}><ChevronRight size={20} /></button>
        </div>
        <div className="next-slide"><span className="eyebrow">{index < slides.length - 1 ? slides[index + 1].presenter === slide.presenter ? "Up next" : `Handoff · ${presenters[slides[index + 1].presenter].name}` : "End of presentation"}</span><strong>{slides[index + 1]?.title ?? "Graph quiz"}</strong></div>
      </div>
    </main>
    <Modal open={panel === "overview"} onClose={() => setPanel(current => current === "overview" ? null : current)} label="Slide overview" variant="overview">
      <Overview index={index} onSelect={next => { navigate(next); setPanel(null); }} />
    </Modal>
    <Modal open={panel === "notes"} onClose={() => setPanel(current => current === "notes" ? null : current)} label="Speaker notes" variant="notes">
      <SpeakerNotes index={index} /><div className="notes-footer"><NotesLink /></div>
    </Modal>
    <Modal open={panel === "quiz"} onClose={() => setPanel(current => current === "quiz" ? null : current)} label="Graph quiz" variant="quiz">
      {panel === "quiz" && <DeckQuiz questions={quizQuestions} onClose={() => setPanel(null)} />}
    </Modal>
  </div>;
}
