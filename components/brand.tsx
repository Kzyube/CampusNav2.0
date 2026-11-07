import Link from "next/link";

export function Mark({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x=".5" y=".5" width="31" height="31" rx="6" fill="#d6f66f" />
    <path d="M8 23l6.2-14.3 3.9 9 5.9-8.1M8 23h14.4" stroke="#17241d" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="24" cy="9.6" r="2.2" fill="#17241d" /><circle cx="22.4" cy="23" r="2" fill="#17241d" />
  </svg>;
}

export function Brand() {
  return <Link className="brand" href="/" aria-label="CampusNav presentation"><Mark /><span>CampusNav<span>.</span></span></Link>;
}
