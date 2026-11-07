import type { ReactNode } from "react";
import { presenters, originalSlides } from "@/lib/slides";
import { StudentArt } from "./student-doodle";
import { Mark } from "../brand";

const doodles = [
  { bg: "#dff1a4", shirt: "#49714a", hair: "M25 38Q18 18 38 16Q58 13 61 37L53 32L47 24Q36 34 25 38" },
  { bg: "#ffe5aa", shirt: "#91613e", hair: "M25 39Q20 28 28 21Q35 14 53 21Q61 25 60 39L53 28L47 33L36 27L25 39" },
  { bg: "#cde8dc", shirt: "#3b6e68", hair: "M25 39Q20 29 27 23Q27 14 35 18Q42 10 48 18Q59 15 61 27L59 38L53 29L46 31L39 25L32 31Z" },
  { bg: "#f5d9bc", shirt: "#975d49", hair: "M24 51Q17 36 23 25Q29 14 43 15Q62 15 62 39L62 56L55 56L55 35Q45 31 40 23Q34 34 26 36L30 53Z" },
  { bg: "#e2eabd", shirt: "#556b39", hair: "M22 48Q19 27 27 22Q33 13 46 15Q61 17 63 32L64 53L56 56L55 34Q47 33 44 26Q36 36 27 37L30 53Z" },
  { bg: "#d6e4fa", shirt: "#4a648c", hair: "M24 37Q20 22 34 18Q51 13 59 24L61 38L53 28L45 29L37 25Q33 33 24 37" },
  { bg: "#f5ddb6", shirt: "#91633a", hair: "M24 39L23 30Q23 16 41 17Q57 13 61 27L60 39L54 32L50 23Q40 29 29 29Z" },
  { bg: "#d1ebde", shirt: "#4b6a50", hair: "M25 39Q21 27 27 23L31 14L38 19L48 13L53 20Q64 24 60 38L54 30L47 28L41 23L30 33Z" },
];

function Portrait({ index }: { index: number }) {
  const { bg, shirt, hair } = doodles[index];
  return <svg className="team-doodle" viewBox="0 0 84 84" aria-hidden="true">
    <circle cx="42" cy="42" r="40" fill={bg} stroke="#283b2e" strokeWidth="2" />
    <g stroke="#283b2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 71Q21 61 34 60L51 60Q62 61 69 71Q58 82 42 82Q26 82 15 71Z" fill={shirt} />
      <path d="M37 54v8q5 7 11 0v-8" fill="#eab486" />
      <path d="M26 35q-7-4-6 3q0 6 6 7m32-10q7-4 6 3q0 6-6 7" fill="#edba8d" />
      <path d="M25 37Q23 20 42 20Q60 20 59 38Q59 59 42 59Q27 59 25 37Z" fill="#f3c49a" />
      <path d={hair} fill={index === 2 || index === 6 ? "#513c31" : "#293930"} />
      <path d="M35 40h.2m13.8 0h.2M38 49q4 4 8 0" fill="none" />
      {(index === 1 || index === 6) && <path d="M28 36h12v8H28zm16 0h12v8H44zm-4 3h4" fill="none" strokeWidth="1.4" />}
    </g>
    <path d={index % 2 ? "M68 18v8m-4-4h8" : "M13 23v8m-4-4h8"} stroke="#456b45" strokeWidth="1.6" strokeLinecap="round" />
  </svg>;
}

function StudentArrival() {
  return <svg className="student-arrival" viewBox="0 0 342 132" role="img" aria-label="The student arrives at the Student Center">
    <path d="M15 111C79 111 87 90 140 98S226 107 280 79" className="arrival-route-base" />
    <path d="M15 111C79 111 87 90 140 98S226 107 280 79" pathLength={1} className="arrival-route" />
    <g className="arrival-pin" transform="translate(280 72)">
      <circle r="28" />
      <path d="M0 13Q-14-1-14-10a14 14 0 1 1 28 0Q14-1 0 13Z" />
      <circle cy="-9" r="4" />
    </g>
    <text x="280" y="121" textAnchor="middle" className="arrival-label">Student Center</text>
    <g className="arrival-walk"><StudentArt mood="learning" compact /></g>
  </svg>;
}

export function TeamFinale({ emblem }: { emblem?: ReactNode }) {
  return <div className="close-layout">
    <div className="close-copy">{emblem}<Mark size={44} /><span className="eyebrow">Thank you / Chapter 7</span><h1>{originalSlides[19].headline}</h1><p>{originalSlides[19].lead}</p><StudentArrival /></div>
    <section className="team-panel" aria-label="CampusNav team">
      <h2>Meet the team</h2>
      <ul className="team-grid">
        {presenters.map(({ name }, index) => <li key={name}><Portrait index={index} /><span>{name}</span></li>)}
      </ul>
    </section>
  </div>;
}
