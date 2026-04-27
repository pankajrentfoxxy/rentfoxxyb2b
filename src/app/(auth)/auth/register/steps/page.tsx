import { RegisterStepsWizard } from "@/components/auth/RegisterStepsWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete registration",
};

export default function RegisterStepsPage() {
  return <RegisterStepsWizard />;
}
