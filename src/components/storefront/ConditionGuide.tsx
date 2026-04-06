import { Shield } from "lucide-react";

const GRADES = [
  {
    grade: "Brand New",
    dot: "🟢",
    color: "green" as const,
    desc: "Factory sealed, never used, original packaging and warranty",
    battery: "100%",
    cosmetic: "No marks",
    warranty: "Full OEM",
  },
  {
    grade: "Refurb A+",
    dot: "🔵",
    color: "blue" as const,
    desc: "Open-box or light use. Professionally cleaned. Screen spotless.",
    battery: "≥90%",
    cosmetic: "No visible marks",
    warranty: "6–12 months",
  },
  {
    grade: "Refurb A",
    dot: "🟣",
    color: "purple" as const,
    desc: "Lightly used. Fully functional. Minor hairlines only.",
    battery: "≥80%",
    cosmetic: "Hairlines not visible at arm's length",
    warranty: "3–6 months",
  },
  {
    grade: "Refurb B",
    dot: "🟡",
    color: "yellow" as const,
    desc: "Used. Fully functional. Visible light scratches, no dents.",
    battery: "≥70%",
    cosmetic: "Light scratches visible",
    warranty: "3 months",
  },
  {
    grade: "Refurb C",
    dot: "🟠",
    color: "red" as const,
    desc: "Heavy use. Functional. Cosmetically worn. Possible minor dents.",
    battery: "≥60%",
    cosmetic: "Visible wear",
    warranty: "1 month / As-Is",
  },
];

const border = {
  green: "border-green-500 bg-green-50",
  blue: "border-blue-500 bg-blue-50",
  purple: "border-purple-500 bg-purple-50",
  yellow: "border-yellow-500 bg-yellow-50",
  red: "border-red-500 bg-red-50",
};

export function ConditionGuide() {
  return (
    <div className="space-y-3">
      <h2 className="mb-2 text-lg font-bold text-primary">Rentfoxxy condition standards</h2>
      {GRADES.map((g) => (
        <div
          key={g.grade}
          className={`flex gap-4 rounded-xl border-l-4 p-4 ${border[g.color]}`}
        >
          <span className="text-2xl">{g.dot}</span>
          <div className="flex-1">
            <div className="font-bold text-primary">{g.grade}</div>
            <div className="mt-0.5 text-sm text-muted">{g.desc}</div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
              <span>Battery: {g.battery}</span>
              <span>Cosmetic: {g.cosmetic}</span>
              <span>Warranty: {g.warranty}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="mt-4 flex gap-3 rounded-xl bg-primary/5 p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-primary">
          Refurbished inventory is <strong>physically verified</strong> by Rentfoxxy before listings go live.
        </p>
      </div>
    </div>
  );
}
