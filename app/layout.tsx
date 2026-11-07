import type { Metadata } from "next";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusNav | Chapter 7",
  description: "An interactive Chapter 7 presentation on graph algorithms and campus navigation.",
  other: { "page-type": "software", "site-kind": "software" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-type="software" data-radius="sharp"><body>{children}</body></html>;
}
