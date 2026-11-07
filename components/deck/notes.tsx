"use client";

import { useSyncExternalStore } from "react";
import { ArrowLeft, Clock3, ExternalLink } from "lucide-react";
import { Brand } from "../brand";
import { questionSets } from "@/lib/questions";
import { tagalogNotes } from "@/lib/tagalog-notes";
import { duration, presenters, slideNumber, slides } from "@/lib/slides";

export const activeSlideKey = "campusnav:active-slide";

const languageKey = "campusnav:notes-language";

function getLanguage() {
  try { return localStorage.getItem(languageKey) === "tl" ? "tl" : "en"; }
  catch { return "en"; }
}

const noteLabels = ["Opening", "Explanation", "Technical details", "CampusNav example", "Handoff"];

export function SpeakerNotes({ index }: { index: number }) {
  const slide = slides[index];
  const speaker = presenters[slide.presenter];
  const language = useSyncExternalStore(subscribe, getLanguage, () => "en");
  const questionSet = questionSets[slide.presenter];
  const [about, cue, opening, explanation, handoff] = slide.layout === "question"
    ? [
      `Balikan ang ${speaker.section} gamit ang dalawang tanong.`,
      "Pindutin ang Select Group at pagkatapos ay Select Student. Basahin ang unang tanong. Puwede ulitin ang pagpili para sa ikalawang tanong.",
      `“Balikan natin ang ating tinalakay. Pipili muna ako ng grupo, pagkatapos ay isang estudyante.”`,
      `Itanong: “${questionSet.tagalogQuestions[0]}” Hintayin ang sagot. Gabay sa sagot: ${questionSet.tagalogAnswers[0]} Pagkatapos, itanong: “${questionSet.tagalogQuestions[1]}” Gabay sa sagot: ${questionSet.tagalogAnswers[1]}`,
      slide.presenter < presenters.length - 1 ? `“Salamat sa pagsagot. Ituloy naman natin kay ${presenters[slide.presenter + 1].name}.”` : "“Salamat sa inyong pakikilahok.”",
    ]
    : tagalogNotes[slide.sourceIndex!];
  const entries = language === "tl"
    ? [["Tungkol saan ang slide na ito?", about], ["Gawin sa screen", cue], ["Sabihin muna", opening], ["Ipaliwanag", explanation], ["Panglipat sa susunod", handoff]]
    : [["What is this slide about?", slide.guide], ["Do on screen", slide.cue], ...slide.notes.map((text, i) => [noteLabels[i], text])];

  return <div className="speaker-notes">
    <span className="eyebrow">Slide {slideNumber(index)} / {speaker.section}</span>
    <h2>{slide.title}</h2>
    <div className="notes-speaker"><div><strong>{speaker.name}</strong><span>{speaker.role}</span></div><span><Clock3 size={16} /> {duration(slide.seconds)} suggested</span></div>
    <div className="notes-language" role="group" aria-label="Notes language">
      {(["en", "tl"] as const).map(value => <button key={value} type="button" className="button button--secondary" aria-pressed={language === value} onClick={() => {
        try { localStorage.setItem(languageKey, value); } catch { return; }
        window.dispatchEvent(new Event("campusnav:notes-language"));
      }}>{value === "en" ? "English" : "Tagalog"}</button>)}
    </div>
    <dl lang={language}>{entries.map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>
  </div>;
}

export function NotesLink() {
  return <a className="button button--secondary" href="/notes" target="_blank" rel="noreferrer">Open separate window <ExternalLink size={15} /></a>;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("campusnav:notes-language", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("campusnav:notes-language", onChange);
  };
}

function getSlide() {
  try {
    const index = Number(localStorage.getItem(activeSlideKey));
    return Number.isInteger(index) && index >= 0 && index < slides.length ? index : 0;
  } catch { return 0; }
}

export function NotesWindow() {
  const index = useSyncExternalStore(subscribe, getSlide, () => 0);
  return <div className="live-page notes-page">
    <header className="live-header"><Brand /><a className="button button--secondary" href={`/?slide=${index + 1}`}><ArrowLeft size={15} /> Back to deck</a></header>
    <main><span className="eyebrow"><span className="status-dot is-online" /> Follows the deck in this browser</span><SpeakerNotes index={index} /></main>
  </div>;
}
