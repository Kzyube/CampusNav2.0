import { Presentation } from "@/components/deck/presentation";
import { slides } from "@/lib/slides";

export default async function Home({ searchParams }: { searchParams: Promise<{ slide?: string }> }) {
  const raw = (await searchParams).slide;
  const slide = Number(raw);
  const index = Number.isInteger(slide) && slide >= 1 && slide <= slides.length ? slide - 1 : 0;
  return <Presentation initialIndex={index} />;
}
