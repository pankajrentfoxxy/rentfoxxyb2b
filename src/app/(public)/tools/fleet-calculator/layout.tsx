import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fleet Renewal Calculator — Rentfoxxy",
  description: "Calculate your IT fleet renewal cost and savings vs buying new.",
};

export default function FleetCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
