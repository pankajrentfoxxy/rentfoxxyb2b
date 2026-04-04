const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? ` ${ONES[o]}` : ""}`.trim();
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

/** Simplified Indian numbering (up to crores). */
function rupeesToWordsInt(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return `Minus ${rupeesToWordsInt(-n)}`;

  let num = Math.floor(n);
  const parts: string[] = [];

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);

  if (num) parts.push(threeDigits(num));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function inrAmountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let s = `${rupeesToWordsInt(rupees)} Rupee${rupees === 1 ? "" : "s"}`;
  if (paise > 0) {
    s += ` and ${twoDigits(paise)} Paise`;
  }
  return `${s} Only`;
}
