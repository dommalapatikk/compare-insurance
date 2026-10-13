import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Compare Swiss health insurance premiums | Compare Insurance",
  description:
    "Compare Swiss basic health insurance premiums by location, franchise and insurance model. No sign-up required.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
