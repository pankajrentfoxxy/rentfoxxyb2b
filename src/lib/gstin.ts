/** Addendum v1.8 — GSTIN format + checksum per GSTN pattern (local, zero API cost). */

const CODEPOINTS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** GSTN structural pattern: state 01–38, PAN fourth letter from allowed set, 14th char Z, etc. */
const GSTIN_PATTERN =
  /^([0-2][0-9]|[3][0-8])[A-Z]{3}[ABCFGHLJPTK][A-Z]\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

function calcCheckDigit(gstinUpper: string): string {
  let factor = 2;
  let sum = 0;
  const mod = CODEPOINTS.length;
  for (let i = gstinUpper.length - 2; i >= 0; i--) {
    const codePoint = CODEPOINTS.indexOf(gstinUpper[i]);
    let digit = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    digit = Math.floor(digit / mod) + (digit % mod);
    sum += digit;
  }
  const checkCodePoint = (mod - (sum % mod)) % mod;
  return CODEPOINTS[checkCodePoint];
}

export function validateGSTINFormat(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  if (g.length !== 15) return false;
  if (!GSTIN_PATTERN.test(g)) return false;
  return calcCheckDigit(g) === g[14];
}
