import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Instrument_Sans } from "next/font/google";
import { site } from "@/content/site";
import "@/styles/base.css";
import "@/styles/header.css";
import "@/styles/hero.css";
import "@/styles/home.css";
import "@/styles/moving.css";
import "@/styles/components.css";
import "@/styles/pages.css";

const display = Hanken_Grotesk({ subsets: ["latin"], variable: "--nf-display", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--nf-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Every vehicle, a moving billboard`, template: `%s | ${site.name}` },
  description: site.description,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: `${site.name} — Every vehicle, a moving billboard`,
    description: site.description,
    images: ["/images/hero-night.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#DE4903",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} data-scroll-behavior="smooth">
      <body>
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
