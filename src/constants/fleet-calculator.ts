/** Fleet calculator — shared by tools page and PDF report. */

export const FLEET_NEW_UNIT_PRICE = 45000;

export const FLEET_GRADE_CONFIG = {
  "Refurb A+": {
    price: 28000,
    colorClass: "bg-lot text-white",
    barColor: "#1D4ED8",
    pillClass: "bg-lot-bg text-lot-text",
    desc: "Open-box or lightly used (< 3 months). Spotless. Inspection certified by Rentfoxxy team.",
    warranty: "6-12 months",
    cosmetic: "No visible marks",
  },
  "Refurb A": {
    price: 22000,
    colorClass: "bg-asas text-white",
    barColor: "#7C3AED",
    pillClass: "bg-asas-bg text-asas-text",
    desc: "Lightly used 3-12 months. Professionally cleaned. Minor hairlines only. Inspection certified.",
    warranty: "3-6 months",
    cosmetic: "Hairlines not visible at arm length",
  },
  "Refurb B": {
    price: 16000,
    colorClass: "bg-amber-dark text-white",
    barColor: "#D97706",
    pillClass: "bg-amber-bg text-amber-dark",
    desc: "Used 1-3 years. Fully functional. Visible light scratches, no dents. Inspection certified.",
    warranty: "3 months",
    cosmetic: "Light scratches visible",
  },
} as const;

export type FleetGradeKey = keyof typeof FLEET_GRADE_CONFIG;
