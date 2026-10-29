import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Literata } from "next/font/google";
import "./globals.css";
import { Atmosphere } from "@/components/atmosphere";
import { MotionPreference } from "@/components/motion-preference";

// Hanken Grotesk: a warm humanist UI sans with tabular figures.
const ui = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

// Literata was drawn for long reading on dark screens, which is the exact
// scene here: a few sentences, read in bed, at low brightness.
const voice = Literata({
  subsets: ["latin"],
  variable: "--font-voice",
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "OFFMODE", template: "%s · OFFMODE" },
  description: "A quiet place to put the day down. Nothing else needs you right now.",
  applicationName: "OFFMODE",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "OFFMODE" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#121523",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${voice.variable}`} suppressHydrationWarning>
      <body>
        <Atmosphere />
        <MotionPreference>
          <div className="app-shell">{children}</div>
        </MotionPreference>
      </body>
    </html>
  );
}
