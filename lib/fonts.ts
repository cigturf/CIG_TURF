import { Geist, Geist_Mono } from "next/font/google";
import { Oswald } from "next/font/google";

/** Body / UI — clean, readable across admin and public */
export const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Display / headlines — athletic, stadium-campaign feel for public pages */
export const fontDisplay = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`;
