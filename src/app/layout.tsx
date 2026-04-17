import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rentfoxxy — B2B laptops & accessories",
    template: "%s · Rentfoxxy",
  },
  description:
    "Multi-vendor B2B marketplace for laptops and IT accessories with bidding and bulk pricing.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await auth();
  } catch {
    /* misconfigured AUTH_SECRET or auth init — still render the app shell */
  }

  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-surface font-sans text-ink-primary antialiased">
        <AppSessionProvider session={session}>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
