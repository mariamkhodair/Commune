import type { Metadata } from "next";
import { Mitr, Permanent_Marker, Jost, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  weight: "400",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Commune",
  description: "Trade freely. Live lightly. Together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mitr.variable} ${permanentMarker.variable} ${jost.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-mitr)] bg-[#F5F0E8]" style={{ fontFamily: "var(--font-mitr), var(--font-noto-arabic), sans-serif" }}>
        {/* ── Global leaf motif ── */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <svg className="absolute top-0 left-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 Q30,60 70,40 Q100,0 140,10 Q100,50 90,80 Q70,110 20,120 Z" fill="#7A9E6E" opacity="0.18" />
            <path d="M0,160 Q40,110 90,100 Q60,140 30,170 Q10,180 0,170 Z" fill="#5C7A4E" opacity="0.13" />
            <path d="M30,0 Q80,20 60,70 Q35,55 10,25 Z" fill="#9AB88A" opacity="0.15" />
          </svg>
          <svg className="absolute top-0 right-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M200,100 Q170,60 130,40 Q100,0 60,10 Q100,50 110,80 Q130,110 180,120 Z" fill="#7A9E6E" opacity="0.18" />
            <path d="M200,160 Q160,110 110,100 Q140,140 170,170 Q190,180 200,170 Z" fill="#5C7A4E" opacity="0.13" />
            <path d="M170,0 Q120,20 140,70 Q165,55 190,25 Z" fill="#9AB88A" opacity="0.15" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 Q30,140 70,160 Q100,200 140,190 Q100,150 90,120 Q70,90 20,80 Z" fill="#7A9E6E" opacity="0.18" />
            <path d="M30,200 Q80,180 60,130 Q35,145 10,175 Z" fill="#9AB88A" opacity="0.15" />
          </svg>
          <svg className="absolute bottom-0 right-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M200,100 Q170,140 130,160 Q100,200 60,190 Q100,150 110,120 Q130,90 180,80 Z" fill="#7A9E6E" opacity="0.18" />
            <path d="M170,200 Q120,180 140,130 Q165,145 190,175 Z" fill="#9AB88A" opacity="0.15" />
            <path d="M200,60 Q160,110 110,100 Q140,70 180,50 Z" fill="#5C7A4E" opacity="0.13" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col min-h-full"><Providers>{children}</Providers></div>
      </body>
    </html>
  );
}
