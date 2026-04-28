"use client";

import { INDIAN_STATES } from "@/constants/indianStates";
import Logo from "@/components/ui/Logo";
import { validateGSTINFormat } from "@/lib/gstin";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";

const STORAGE_EMAIL = "rentfoxxy_reg_v18_email";
const STORAGE_ROLE = "rentfoxxy_reg_v18_role";

type TabRole = Extract<Role, "CUSTOMER" | "VENDOR">;

type GstinData = {
  businessName: string;
  tradeName?: string | null;
  address?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
};

const STEP_LABELS: Record<number, string> = {
  2: "Password",
  3: "Email verification",
  4: "Mobile number",
  5: "Mobile verification",
  6: "Business details",
  7: "Confirm",
};

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Weak", "Fair", "Strong", "Very Strong"];
  return { score, label: labels[Math.min(score, 3)] };
}

export function RegisterStepsWizard() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(2);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TabRole>("CUSTOMER");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [otpEmail, setOtpEmail] = useState(["", "", "", "", "", ""]);
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [phone, setPhone] = useState("");
  const [phoneSkipped, setPhoneSkipped] = useState(false);
  const [otpPhone, setOtpPhone] = useState(["", "", "", "", "", ""]);
  const phoneOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [resendEmailIn, setResendEmailIn] = useState(0);
  const [resendSmsIn, setResendSmsIn] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [sendSmsUpdates, setSendSmsUpdates] = useState(false);
  const [licenseType, setLicenseType] = useState<"GSTIN" | "PAN">("GSTIN");
  const [gstin, setGstin] = useState("");
  const [gstinData, setGstinData] = useState<GstinData | null>(null);
  const [gstinVerifiedFlag, setGstinVerifiedFlag] = useState(false);
  const [validatingGstin, setValidatingGstin] = useState(false);
  const [gstinWarning, setGstinWarning] = useState<string | null>(null);
  const [pan, setPan] = useState("");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPin, setAddrPin] = useState("");

  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    const em = sessionStorage.getItem(STORAGE_EMAIL);
    const r = sessionStorage.getItem(STORAGE_ROLE) as TabRole | null;
    if (!em || (r !== "CUSTOMER" && r !== "VENDOR")) {
      router.replace("/auth/register");
      return;
    }
    setEmail(em);
    setRole(r);
    setHydrated(true);
  }, [router]);

  useEffect(() => {
    if (role === "VENDOR") setLicenseType("GSTIN");
  }, [role]);

  useEffect(() => {
    if (resendEmailIn <= 0) return;
    const t = setInterval(() => setResendEmailIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendEmailIn]);

  useEffect(() => {
    if (resendSmsIn <= 0) return;
    const t = setInterval(() => setResendSmsIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSmsIn]);

  const strength = passwordStrength(password);
  const gstinFormatOk = gstin.length === 15 && validateGSTINFormat(gstin);
  const businessPhone10 = businessPhone.replace(/\D/g, "").slice(-10);
  const canContinueBusiness = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (!/^[6-9]\d{9}$/.test(businessPhone10)) return false;
    if (licenseType === "GSTIN") {
      if (!gstinFormatOk) return false;
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) {
      return false;
    }
    if (!businessName.trim() || !addrLine1.trim() || !addrCity.trim() || !addrState.trim()) return false;
    if (addrPin.replace(/\D/g, "").length !== 6) return false;
    if (role === "VENDOR") {
      if (!bankAccount.trim() || !ifscCode.trim() || !accountName.trim()) return false;
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) return false;
    }
    return true;
  }, [
    firstName,
    lastName,
    businessPhone10,
    licenseType,
    gstinFormatOk,
    pan,
    businessName,
    addrLine1,
    addrCity,
    addrState,
    addrPin,
    role,
    bankAccount,
    ifscCode,
    accountName,
  ]);

  async function submitInit() {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (passwordStrength(password).score < 4) {
      setError("Use a stronger password (8+ chars, uppercase, number, special character).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.devOtp) {
        setDevHint(
          `Code: ${data.devOtp} — use this if the email does not arrive (local dev / Resend sandbox / spam).`,
        );
      }
      setResendEmailIn(60);
      setOtpEmail(["", "", "", "", "", ""]);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  async function resendEmailOtp() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not resend");
        return;
      }
      if (data.devOtp) {
        setDevHint(
          `Code: ${data.devOtp} — use this if the email does not arrive (local dev / Resend sandbox / spam).`,
        );
      }
      setResendEmailIn(60);
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmailOtp() {
    const otp = otpEmail.join("");
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        return;
      }
      setDevHint(null);
      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  async function sendSmsOtp() {
    const p = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(p)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-sms-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send SMS");
        return;
      }
      if (data.devOtp) {
        setDevHint(
          data.smsMocked
            ? `Local dev: SMS is not sent to your phone. Use this code: ${data.devOtp}`
            : `Dev SMS OTP: ${data.devOtp}`,
        );
      }
      setResendSmsIn(60);
      setOtpPhone(["", "", "", "", "", ""]);
      setStep(5);
    } finally {
      setLoading(false);
    }
  }

  async function resendSms() {
    await sendSmsOtp();
  }

  async function verifyMobileOtp() {
    const otp = otpPhone.join("");
    const p = phone.replace(/\D/g, "").slice(-10);
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-mobile-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: p, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        return;
      }
      setDevHint(null);
      setBusinessPhone(p);
      setStep(6);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateGstin() {
    if (!gstinFormatOk) {
      setError("Enter a valid 15-character GSTIN (check format and check digit).");
      return;
    }
    setValidatingGstin(true);
    setError(null);
    setGstinWarning(null);
    try {
      const res = await fetch("/api/auth/validate-gstin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstin }),
      });
      let data: Record<string, unknown>;
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        setError("Invalid response from server. Try again.");
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Validation failed");
        return;
      }
      if (data.valid === false) {
        setError(typeof data.error === "string" ? data.error : "Invalid GSTIN");
        setGstinData(null);
        setGstinVerifiedFlag(false);
        return;
      }
      if (typeof data.warning === "string" && data.warning) {
        setGstinWarning(data.warning);
        setGstinVerifiedFlag(false);
        setGstinData(null);
        return;
      }
      if (data.data) {
        const d = data.data as GstinData & { gstin?: string };
        setGstinData({
          businessName: d.businessName,
          tradeName: d.tradeName,
          address: d.address ?? null,
          city: d.city,
          state: d.state,
          pincode: d.pincode,
        });
        setBusinessName(d.businessName || "");
        if (d.address) setAddrLine1(d.address);
        if (d.city) setAddrCity(d.city);
        if (d.pincode) setAddrPin(d.pincode);
        if (d.state) {
          const match = INDIAN_STATES.find(
            (s) => s.toLowerCase() === String(d.state).toLowerCase() || s.includes(String(d.state)),
          );
          setAddrState(match ?? d.state);
        }
        setGstinVerifiedFlag(!!data.verified);
      }
    } catch {
      setError("Could not validate GSTIN. Check your connection and try again.");
    } finally {
      setValidatingGstin(false);
    }
  }

  function continueBusinessStep() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first and last name");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(businessPhone10)) {
      setError("Enter a valid business phone (10 digits)");
      return;
    }
    if (licenseType === "GSTIN") {
      if (!gstinFormatOk) {
        setError("Enter a valid GSTIN");
        return;
      }
    } else {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) {
        setError("Enter a valid PAN");
        return;
      }
    }
    if (!businessName.trim() || !addrLine1.trim() || !addrCity.trim() || !addrState.trim() || !addrPin.trim()) {
      setError("Complete business and address fields");
      return;
    }
    if (addrPin.replace(/\D/g, "").length !== 6) {
      setError("Enter a valid 6-digit postal code");
      return;
    }
    if (role === "VENDOR") {
      if (!bankAccount.trim() || !ifscCode.trim() || !accountName.trim()) {
        setError("Enter bank account, IFSC, and account name");
        return;
      }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) {
        setError("Enter a valid PAN for vendor registration");
        return;
      }
    }
    setStep(7);
  }

  async function submitComplete() {
    setError(null);
    if (!termsAccepted) {
      setError("Accept the terms to create your account");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          firstName,
          lastName,
          businessPhone: businessPhone.replace(/\D/g, "").slice(-10),
          sendSmsUpdates,
          licenseType,
          gstin: licenseType === "GSTIN" ? gstin : undefined,
          pan: licenseType === "PAN" ? pan : role === "VENDOR" ? pan : pan || undefined,
          incorporationDate: licenseType === "PAN" ? incorporationDate : undefined,
          businessName,
          gstVerified: licenseType === "GSTIN" ? gstinVerifiedFlag : false,
          address: {
            line1: addrLine1,
            line2: addrLine2,
            city: addrCity,
            state: addrState,
            pincode: addrPin,
          },
          bankAccount: role === "VENDOR" ? bankAccount : undefined,
          ifscCode: role === "VENDOR" ? ifscCode : undefined,
          accountName: role === "VENDOR" ? accountName : undefined,
          termsAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not complete registration");
        return;
      }
      sessionStorage.removeItem(STORAGE_EMAIL);
      sessionStorage.removeItem(STORAGE_ROLE);
      const sign = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (sign?.error) {
        router.push(`/auth/login?registered=1`);
        return;
      }
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return <div className="mx-auto h-96 max-w-sm animate-pulse rounded-xl bg-surface" />;
  }

  const progressPct = ((step - 1) / 6) * 100;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 lg:hidden">
        <Logo size="md" variant="nav-on-light" />
      </div>
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-[11px] text-ink-muted">
          <span>
            Step {step} of 7 — {STEP_LABELS[step] ?? ""}
          </span>
          <button type="button" className="text-lot hover:underline" onClick={() => router.push("/auth/register")}>
            Start over
          </button>
        </div>
        <div className="h-1 w-full rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-amber transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {devHint ? (
        <p className="mb-3 rounded-lg border border-amber/40 bg-amber-bg px-3 py-2 text-[11px] text-amber-dark">
          {devHint}
        </p>
      ) : null}
      {error ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle size={14} className="text-red-500" />
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-[20px] font-medium text-ink-primary">Create your password</h2>
          <div>
            <p className="mb-1 text-[12px] font-medium text-ink-primary">Email</p>
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] text-ink-muted">
              {email}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-primary">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last name"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-primary">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border py-2.5 pl-3 pr-10 text-[13px] outline-none focus:border-navy"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-lot"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            <div className="mt-2 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full bg-border",
                    i < strength.score && strength.score <= 1 && "bg-red-400",
                    i < strength.score && strength.score === 2 && "bg-amber",
                    i < strength.score && strength.score >= 3 && "bg-verified",
                  )}
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">{strength.label}</p>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-ink-primary">Confirm password</label>
            <input
              type={showPwd ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:border-navy"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="rounded-lg border border-border px-4 py-2.5 text-[13px] text-ink-secondary"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={submitInit}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-[20px] font-medium text-ink-primary">Verify your email</h2>
          <p className="text-[13px] text-ink-secondary">
            We sent a 6-digit code to <strong>{email}</strong>{" "}
            <button type="button" className="text-lot hover:underline" onClick={() => router.push("/auth/register")}>
              Change
            </button>
          </p>
          <div className="my-6 flex justify-center gap-2">
            {otpEmail.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  emailOtpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                className="h-12 w-11 rounded-lg border-2 border-border text-center text-[18px] font-semibold text-ink-primary outline-none transition-colors focus:border-navy"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const next = [...otpEmail];
                  next[i] = val;
                  setOtpEmail(next);
                  if (val && i < 5) emailOtpRefs.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otpEmail[i] && i > 0) emailOtpRefs.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={verifyEmailOtp}
            className="w-full rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
          >
            Verify email
          </button>
          {resendEmailIn > 0 ? (
            <p className="text-center text-[12px] text-ink-muted">Resend code in {resendEmailIn}s</p>
          ) : (
            <button type="button" onClick={resendEmailOtp} className="mx-auto block text-[12px] text-lot hover:underline">
              Resend OTP
            </button>
          )}
          <button type="button" onClick={() => setStep(2)} className="text-[12px] text-ink-muted hover:underline">
            ← Back
          </button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <h2 className="text-[20px] font-medium text-ink-primary">Add your mobile number</h2>
          <p className="text-[13px] text-ink-muted">We&apos;ll send you a verification code.</p>
          <div className="flex">
            <div className="flex items-center rounded-l-lg border border-r-0 border-border bg-surface px-3 py-2.5 text-[13px] text-ink-secondary">
              🇮🇳 +91
            </div>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className="flex-1 rounded-r-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={sendSmsOtp}
            className="w-full rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
          >
            Send OTP
          </button>
          {role === "CUSTOMER" ? (
            <button
              type="button"
              className="text-center text-[12px] text-lot hover:underline"
              onClick={() => {
                setPhoneSkipped(true);
                setPhone("");
                setStep(6);
              }}
            >
              Skip for now
            </button>
          ) : null}
          <button type="button" onClick={() => setStep(3)} className="text-[12px] text-ink-muted hover:underline">
            ← Back
          </button>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <h2 className="text-[20px] font-medium text-ink-primary">Verify your mobile</h2>
          <p className="text-[13px] text-ink-secondary">
            We sent a code to +91 {phone.replace(/\D/g, "").slice(-10)}
          </p>
          <div className="my-6 flex justify-center gap-2">
            {otpPhone.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  phoneOtpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                className="h-12 w-11 rounded-lg border-2 border-border text-center text-[18px] font-semibold outline-none focus:border-navy"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const next = [...otpPhone];
                  next[i] = val;
                  setOtpPhone(next);
                  if (val && i < 5) phoneOtpRefs.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otpPhone[i] && i > 0) phoneOtpRefs.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={verifyMobileOtp}
            className="w-full rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
          >
            Verify mobile
          </button>
          {resendSmsIn > 0 ? (
            <p className="text-center text-[12px] text-ink-muted">Resend in {resendSmsIn}s</p>
          ) : (
            <button type="button" onClick={resendSms} className="mx-auto block text-[12px] text-lot hover:underline">
              Resend OTP
            </button>
          )}
          <button type="button" onClick={() => setStep(4)} className="text-[12px] text-ink-muted hover:underline">
            ← Back
          </button>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <h2 className="text-[20px] font-medium text-ink-primary">Contact &amp; business</h2>
          <p className="text-[12px] font-medium text-ink-primary">Contact information</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] text-ink-primary">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-ink-primary">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:border-navy"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-ink-primary">Business phone</label>
            <div className="flex">
              <div className="flex items-center rounded-l-lg border border-r-0 border-border bg-surface px-3 py-2.5 text-[13px]">
                +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 rounded-r-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:border-navy"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={sendSmsUpdates}
              onChange={(e) => setSendSmsUpdates(e.target.checked)}
              className="mt-0.5 accent-navy"
            />
            <span className="text-[12px] leading-relaxed text-ink-secondary">
              Receive texts to get updates on your account verification status. Message and data rates may apply.
            </span>
          </label>
          <div className="my-5 border-t border-border" />
          <p className="text-[12px] font-medium text-ink-primary">Business information</p>
          <p className="text-[11px] text-ink-muted">Business license type</p>
          <div className="space-y-2">
            {(["GSTIN", "PAN"] as const).map((type) => (
              <label
                key={type}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                  licenseType === type ? "border-navy bg-navy/[0.03]" : "border-border hover:border-navy/30",
                  role === "VENDOR" && type === "PAN" && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="radio"
                  name="lic"
                  className="accent-navy"
                  checked={licenseType === type}
                  disabled={role === "VENDOR" && type === "PAN"}
                  onChange={() => setLicenseType(type)}
                />
                <span className="text-[13px] font-medium text-ink-primary">
                  {type === "GSTIN" ? "Goods and Services Tax Number (GSTIN)" : "Business PAN"}
                </span>
              </label>
            ))}
          </div>
          {role === "VENDOR" ? (
            <p className="text-[11px] text-ink-muted">Vendors must register with an active GSTIN.</p>
          ) : null}

          {licenseType === "GSTIN" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] text-ink-primary">GSTIN</label>
                <div className="flex gap-2">
                  <input
                    value={gstin}
                    onChange={(e) => {
                      setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15));
                      setGstinData(null);
                      setGstinWarning(null);
                      setGstinVerifiedFlag(false);
                    }}
                    maxLength={15}
                    placeholder="09AAACT2727Q1ZU"
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2.5 font-mono text-[13px] outline-none focus:border-navy",
                      gstinData ? "border-verified" : "border-border",
                    )}
                  />
                  <button
                    type="button"
                    disabled={!gstinFormatOk || validatingGstin}
                    onClick={handleValidateGstin}
                    className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2.5 text-[12px] font-medium text-white disabled:opacity-40"
                  >
                    {validatingGstin ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Validate
                  </button>
                </div>
                {gstinData ? (
                  <div className="mt-2 flex gap-2 rounded-lg border border-verified-border bg-verified-bg p-3">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-verified" />
                    <div>
                      <p className="text-[12px] font-medium text-verified-text">✓ GSTIN verified</p>
                      <p className="text-[11px] text-verified-text/80">{gstinData.businessName}</p>
                    </div>
                  </div>
                ) : null}
                {gstinWarning ? (
                  <p className="mt-2 text-[11px] text-amber-dark">{gstinWarning}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-ink-primary">Business name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:border-navy",
                    gstinData ? "bg-surface text-ink-muted" : "",
                  )}
                  placeholder="Registered business name"
                />
              </div>
              {role === "VENDOR" ? (
                <div>
                  <label className="mb-1 block text-[12px] text-ink-primary">PAN</label>
                  <input
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                    maxLength={10}
                    placeholder="AAAAA0000A"
                    className="w-full rounded-lg border border-border px-3 py-2.5 font-mono text-[13px]"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] text-ink-primary">Business PAN</label>
                <input
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                  maxLength={10}
                  className="w-full rounded-lg border border-border px-3 py-2.5 font-mono text-[13px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-ink-primary">Date of incorporation</label>
                <input
                  type="date"
                  value={incorporationDate}
                  onChange={(e) => setIncorporationDate(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[12px] text-ink-primary">Business name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
                />
              </div>
            </div>
          )}

          {role === "VENDOR" ? (
            <div className="space-y-3 rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-[12px] font-medium text-ink-primary">Bank details</p>
              <input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Bank account number"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
              />
              <input
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="IFSC"
                className="w-full rounded-lg border border-border px-3 py-2.5 font-mono text-[13px]"
              />
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account holder name"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
              />
            </div>
          ) : null}

          <div className="border-t border-border pt-4">
            <p className="mb-1 text-[12px] font-medium text-ink-primary">Business address</p>
            <p className="mb-3 text-[11px] text-ink-muted">
              Have multiple locations? Use the address shown on official documents.
            </p>
            <input
              value={addrLine1}
              onChange={(e) => setAddrLine1(e.target.value)}
              placeholder="Street address"
              className="mb-2 w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
            />
            <input
              value={addrLine2}
              onChange={(e) => setAddrLine2(e.target.value)}
              placeholder="Suite, unit, floor (optional)"
              className="mb-2 w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
            />
            <div className="mb-2 grid gap-2 sm:grid-cols-2">
              <input
                value={addrPin}
                onChange={(e) => setAddrPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Postal code"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
              />
              <input
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                placeholder="City"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px]"
              />
            </div>
            <select
              value={addrState}
              onChange={(e) => setAddrState(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value="">State / UT</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 pb-4">
            {!canContinueBusiness ? (
              <p className="text-[11px] text-ink-muted">
                Complete every required field (including 6-digit PIN and, for vendors, bank details and PAN) to continue.
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(phoneSkipped ? 4 : 5)}
                className="rounded-lg border border-border px-4 py-2.5 text-[13px]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canContinueBusiness}
                onClick={continueBusinessStep}
                className="flex-1 rounded-lg bg-navy py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 7 ? (
        <div className="space-y-4">
          <h2 className="text-[20px] font-medium text-ink-primary">Almost done!</h2>
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4 text-[13px]">
            <Row label="Name" value={`${firstName} ${lastName}`} onEdit={() => setStep(6)} />
            <Row label="Email" value={email} onEdit={() => router.push("/auth/register")} />
            <Row
              label="Mobile"
              value={phoneSkipped ? "Skipped" : `+91 ${phone.replace(/\D/g, "").slice(-10)}`}
              onEdit={() => setStep(4)}
            />
            <Row label="Business" value={businessName} onEdit={() => setStep(6)} />
            <Row
              label="Tax ID"
              value={licenseType === "GSTIN" ? gstin : pan}
              onEdit={() => setStep(6)}
            />
            <Row label="Location" value={`${addrCity}, ${addrState}`} onEdit={() => setStep(6)} />
          </div>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 accent-navy"
            />
            <span className="text-[12px] leading-relaxed text-ink-secondary">
              By creating an account, I agree to Rentfoxxy&apos;s{" "}
              <Link href="/terms" className="text-lot underline">
                Conditions of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-lot underline">
                Privacy Notice
              </Link>
              .
            </span>
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={submitComplete}
            className="w-full rounded-xl bg-amber py-3 text-[14px] font-semibold text-navy transition-colors hover:bg-amber-dark disabled:opacity-50"
          >
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Create your Rentfoxxy account"}
          </button>
          <button type="button" onClick={() => setStep(6)} className="text-[12px] text-ink-muted hover:underline">
            ← Back
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-2 last:border-0">
      <div>
        <p className="text-[11px] text-ink-muted">{label}</p>
        <p className="text-[13px] text-ink-primary">{value}</p>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-[11px] text-lot hover:underline">
        Edit
      </button>
    </div>
  );
}
