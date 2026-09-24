import type { ReactNode } from "react";

type BadgeTone = "blue" | "amber" | "green" | "red" | "gray";

const toneClass: Record<BadgeTone, string> = {
  blue: "b-blue",
  amber: "b-amber",
  green: "b-green",
  red: "b-red",
  gray: "b-gray",
};

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`st-badge ${toneClass[tone]}`}>{children}</span>;
}
