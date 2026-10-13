import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const libreFranklin = Libre_Franklin({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Compare Swiss health insurance premiums | Compare Insurance",
  description:
    "Compare Swiss basic health insurance premiums by location, franchise and insurance model. No sign-up required.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={libreFranklin.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
