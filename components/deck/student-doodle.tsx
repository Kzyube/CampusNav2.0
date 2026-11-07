const captions = { lost: "Which way?", learning: "Follow the map" } as const;

export function StudentArt({ mood, compact = false }: { mood: keyof typeof captions; compact?: boolean }) {
  return <svg className="student-spotlight-art" viewBox="0 0 178 250" width={compact ? 96 : undefined} height={compact ? 135 : undefined} fill="none">
      {!compact && <><path d="M12 192c48 3 25-119 72-132 36-10 44 15 74 3" stroke="#6c9681" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round"  />
      <circle cx="91" cy="108" r="66" fill="#e0eed3" />
      <circle cx="91" cy="108" r="60" stroke="#bdd2b0" /></>}
      <ellipse cx="91" cy="227" rx="52" ry="9" fill="#a5bc9e" opacity=".35" />
      <g className="student-character" stroke="#253e33" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M55 113q-10 8-11 25l2 25 23 6 3-57z" fill="#ebc45f" />
        <path d="m65 168 3 44 17 1 6-35 8 35h17l2-51" fill="#405b63" />
        <path d="M68 210q-6 3-13 8-7 7 2 9h24q5-2 5-10l-1-7m16 0-1 10q0 7 7 7h26q7-3 1-9l-17-8" fill="#f7e8bf" />
        <path d="M72 108q-16 5-19 21l6 19 6 21q25 9 51-1l5-36-13-21z" fill="#4d8e7b" />
        <path d="M74 112q-10 12-13 27m49-27q7 9 9 20" stroke="#ebc45f" strokeWidth="5" />
        <path d="M83 97v13q8 10 17 0V96" fill="#e2a978" />
        <path d="M67 69q-5-17 6-23 7-9 23-7 18 2 22 14l-1 22-10 12H73z" fill="#293e35" />
        <path d="M69 70q-8-5-9 2 0 8 10 10m44-12q8-5 9 2 0 8-10 10" fill="#efba8c" />
        <path d="M69 71q2 31 22 31 19 0 23-31-16-1-24-15-10 13-21 15z" fill="#f3c397" />
        <path d={mood === "lost" ? "M81 77h.2m20 0h.2m-15 13q5-5 11-1" : "M81 77h.2m20 0h.2m-15 10q5 6 11 0"} />
        <path d="M60 130q-4 22 10 24l10-3m38-24q8 20-4 24l-12-1" stroke="#f3c397" strokeWidth="9" />
        <path d="m65 132 16-9 18 7 17-8v28l-17 8-18-7-16 8z" fill="#fff09e" />
        <path d="M81 123v28m18-21v28m-25-17 11-8 11 9 11-10" stroke="#679272" strokeWidth="1.9" />
      </g>
      {!compact && (mood === "lost" ? <path d="M125 44q-2-10 9-11 11 1 9 9-1 4-8 8l-1 5m-1 7h.1" className="student-signal" />
        : <path d="M129 49l5 5 13-16m1 33v10m-5-5h10" className="student-signal" />)}
    </svg>;
}

export function StudentDoodle({ mood }: { mood: keyof typeof captions }) {
  return <figure className="student-spotlight" aria-hidden="true">
    <StudentArt mood={mood} />
    <figcaption>{captions[mood]}</figcaption>
  </figure>;
}
