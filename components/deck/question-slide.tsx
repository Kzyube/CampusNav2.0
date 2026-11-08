"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shuffle, Sparkles, UsersRound } from "lucide-react";
import { questionGroups, questionSets } from "@/lib/questions";

type Group = (typeof questionGroups)[number];
type Draw = "group" | "student" | null;

export function QuestionSlide({ presenter }: { presenter: number }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [student, setStudent] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<Draw>(null);
  const [revealed, setRevealed] = useState([false, false]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  const questions = questionSets[presenter].questions;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function chooseGroup() {
    const selected = questionGroups[Math.floor(Math.random() * questionGroups.length)];
    setDrawing("group");
    setGroup(null);
    setStudent(null);
    timer.current = setTimeout(() => { setGroup(selected); setDrawing(null); }, reducedMotion ? 0 : 650);
  }

  function chooseStudent() {
    if (!group) return;
    const selected = group.students[Math.floor(Math.random() * group.students.length)];
    setDrawing("student");
    setStudent(null);
    timer.current = setTimeout(() => { setStudent(selected); setDrawing(null); }, reducedMotion ? 0 : 650);
  }

  return <div className="question-layout">
    <div className="question-list" aria-label="Discussion questions">
      {questions.map((question, index) => <article className="question-card" key={question}>
        <span className="question-number">0{index + 1}</span><div className="question-card-content"><p>{question}</p>
          <button className="answer-toggle" type="button" aria-expanded={revealed[index]} aria-controls={`question-answer-${index}`} onClick={() => setRevealed(current => current.map((value, i) => i === index ? !value : value))}>{revealed[index] ? "Hide answer" : "Reveal answer"} <span aria-hidden="true">{revealed[index] ? "−" : "+"}</span></button>
          <div id={`question-answer-${index}`} hidden={!revealed[index]} className="question-answer"><strong>Suggested answer</strong><span>{questionSets[presenter].answers[index]}</span></div>
        </div><span className="question-card-star" aria-hidden="true">✳</span>
      </article>)}
    </div>
    <aside className="question-draw" aria-label="Classmate selection">
      <div className="draw-orbit draw-orbit--one" aria-hidden="true" /><div className="draw-orbit draw-orbit--two" aria-hidden="true" />
      <div className="draw-heading"><span className="draw-icon"><UsersRound size={20} /></span><div><span className="eyebrow">Your turn</span><h2>Let’s hear from you.</h2></div>
        <div className={`draw-die${drawing ? " is-rolling" : ""}`} aria-hidden="true">
          <div className="draw-die-body">{["?", "✦", "?", "✦", "?", "✦"].map((face, i) => <span key={i}>{face}</span>)}</div>
          <Sparkles className="draw-die-sparkle" size={14} />
        </div>
      </div>
      <div className="draw-result" aria-live="polite" aria-atomic="true">
        <span className="draw-result-label">{drawing === "group" ? "Choosing a group…" : drawing === "student" ? "Choosing a student…" : group ? `Group ${group.number}` : "First, choose a group"}</span>
        <AnimatePresence mode="wait">
          <motion.strong key={student ?? (group ? `group-${group.number}` : "empty")} initial={reducedMotion ? false : { opacity: 0, y: 12, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .25 }}>
            {student ?? (group ? "Now choose a student" : "Ready to pick?")}
          </motion.strong>
        </AnimatePresence>
        <span className="draw-result-caption">{student ? "Your classmate is up!" : "Groups 1, 3, 4 & 5"}</span>
      </div>
      <div className="draw-actions">
        <button className="button draw-group-button" type="button" disabled={drawing !== null} onClick={chooseGroup}><Shuffle size={16} /> {group ? "Select Group Again" : "Select Group"}</button>
        <button className="button draw-student-button" type="button" disabled={!group || drawing !== null} onClick={chooseStudent}>{student ? "Select Again" : "Select Student"} <ArrowRight size={16} /></button>
      </div>
    </aside>
  </div>;
}
