import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fleet renewal calculator",
  description: "Calculate your IT fleet renewal cost and savings.",
};

export default function FleetCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
