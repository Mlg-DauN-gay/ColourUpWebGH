import { Unbounded, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Unbounded is Cyrillic-native (built with Cyrillic as a first-class script,
// not bolted on) — the display face has to hold its identity in Russian too,
// not silently fall back to a system font for half the audience.
const unbounded = Unbounded({
  variable: "--font-disp",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
});

const interTight = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Colour Up",
  description: "Run and settle home poker cash games — receipt only, never moves money.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${interTight.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
