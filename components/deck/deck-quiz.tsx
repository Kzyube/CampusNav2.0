"use client";

import { gsap } from "gsap";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Eye } from "lucide-react";
import type { QuizQuestion } from "@/lib/quiz";
import { SlideSculpture } from "./slide-sculpture";

type Phase = "questions" | "finished" | "review";

function QuestionText({ prompt, emphasis }: Pick<QuizQuestion, "prompt" | "emphasis">) {
  const highlights = emphasis.map((text, index) => ({
    text,
    start: prompt.indexOf(text),
    tone: index === 0 ? "gold" : "mint",
    end: prompt.indexOf(text) + text.length,
  })).filter(({ start }) => start >= 0).sort((a, b) => a.start - b.start);

  return <>{highlights.map(({ text, start, tone }, index) => {
    const before = prompt.slice(highlights[index - 1]?.end ?? 0, start);
    return <Fragment key={start}>{before}<span className={`quiz-emphasis quiz-emphasis--${tone}`}>{text}</span></Fragment>;
  })}{prompt.slice(highlights.at(-1)?.end ?? 0)}</>;
}

export function DeckQuiz({ questions, onClose }: { questions: QuizQuestion[]; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("questions");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const question = questions[index];
  const reviewing = phase === "review";
  const finished = phase === "finished";
  const last = index === questions.length - 1;
  const easyCount = questions.filter(({ difficulty }) => difficulty === "Easy").length;

  useLayoutEffect(() => {
    const root = stage.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const options = root.querySelectorAll(".quiz-option");
      const timeline = gsap.timeline();
      timeline.from(".quiz-prompt", {
        z: -110, rotateX: -16, y: 15, opacity: .72, duration: .72,
        ease: "power4.out", clearProps: "transform,opacity",
      });
      if (options.length) timeline.from(options, {
        z: -70, rotateY: index % 2 === 0 ? -16 : 16, y: 9, opacity: .55,
        duration: .44, stagger: .055, ease: "power3.out", clearProps: "transform,opacity",
      }, .12);
      timeline.from(".quiz-actions", {
        y: 6, opacity: .78, duration: .32, ease: "power2.out", clearProps: "transform,opacity",
      }, .33);
    }, root);
    return () => media.revert();
  }, [phase, index]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      heading.current?.closest("dialog")?.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, index]);

  function goTo(next: number) {
    setIndex(next);
    setRevealed(false);
  }

  function advance() {
    if (!last) goTo(index + 1);
    else if (reviewing) onClose();
    else setPhase("finished");
  }

  return <div className="deck-quiz">
    <aside className="quiz-progress">
      <span className="eyebrow"><ClipboardList size={16} /> {reviewing ? "Answer review" : "Class quiz"}</span>
      <div className="quiz-art" aria-hidden="true"><SlideSculpture kind={finished ? "finale" : "graph"} /></div>
      <div className="quiz-progress-count" role="group" aria-label={finished ? "Quiz complete" : `Question ${index + 1} of ${questions.length}`}>
        <strong>{String(finished ? questions.length : index + 1).padStart(2, "0")}</strong><span>/ {questions.length}</span>
      </div>
      <div className="quiz-progress-track" aria-hidden="true">
        {questions.map(({ prompt }, i) => <i key={prompt} className={finished || i < index ? "is-complete" : i === index ? "is-current" : undefined} />)}
      </div>
      <p>{reviewing ? "Reveal each answer when the class is ready." : `${easyCount} easy · ${questions.length - easyCount} medium`}</p>
    </aside>

    <div className="quiz-main" ref={stage} key={`${phase}-${index}`}>
      {finished ? <>
        <div className="quiz-prompt quiz-prompt--complete">
          <span className="quiz-complete-icon" aria-hidden="true"><Check size={22} /></span>
          <h2 tabIndex={-1} ref={heading}><span className="quiz-emphasis quiz-emphasis--gold">Quiz complete</span></h2>
        </div>
        <p>All 15 questions are done. Go back to question 1 to review the answers together.</p>
        <div className="quiz-actions">
          <button className="button button--primary" type="button" onClick={() => { goTo(0); setPhase("review"); }}><Eye size={17} /> Show answer</button>
        </div>
      </> : <>
        <div className="quiz-prompt">
          <div className="quiz-question-meta"><span className="eyebrow">{question.topic}</span><span className={`quiz-level quiz-level--${question.difficulty.toLowerCase()}`}>{question.difficulty}</span></div>
          <h2 id="quiz-question-title" tabIndex={-1} ref={heading}><QuestionText prompt={question.prompt} emphasis={question.emphasis} /></h2>
        </div>
        <ol className="quiz-options" role="list" aria-labelledby="quiz-question-title">
          {question.choices.map((choice, i) => {
            const correct = revealed && choice === question.answer;
            return <li className={`quiz-option${correct ? " is-correct" : ""}`} key={choice}>
              <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span><span>{choice}</span>
              {correct && <span className="quiz-option-status"><Check size={16} /> Correct answer</span>}
            </li>;
          })}
        </ol>
        {revealed && <p className="quiz-explanation" aria-live="polite"><strong>Why it’s correct</strong>{question.explanation}</p>}
        <div className="quiz-actions">
          <button className="button button--secondary" type="button" disabled={index === 0} onClick={() => goTo(index - 1)}><ArrowLeft size={16} /> Previous question</button>
          {reviewing && <button className={`button button--${revealed ? "secondary" : "primary"}`} type="button" aria-expanded={revealed} onClick={() => setRevealed(value => !value)}><Eye size={17} /> {revealed ? "Hide answer" : "Show answer"}</button>}
          <button className={`button button--${reviewing && !revealed ? "secondary" : "primary"}`} type="button" onClick={advance}>
            {last ? reviewing ? "Back to slides" : "Finish quiz" : "Next question"}<ArrowRight size={16} />
          </button>
        </div>
      </>}
    </div>
  </div>;
}
