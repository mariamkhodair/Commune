"use client";

import { useState } from "react";
import Link from "next/link";

const categories = [
  {
    name: "Apparel",
    color: "#E8DDD0",
    icon: (
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Long-sleeved dress — upper left */}
        <g transform="rotate(-10, 33, 55)">
          <path d="M33,8 Q40,8 42,16 Q47,13 62,19 Q61,26 55,25 Q48,23 44,22 Q46,38 48,62 Q48,68 33,68 Q18,68 18,62 Q20,38 22,22 Q18,23 11,25 Q5,26 4,19 Q19,13 24,16 Q26,8 33,8 Z" fill="#6B8C9E" opacity="0.45"/>
        </g>
        {/* T-shirt — lower right */}
        <g transform="rotate(12, 82, 78)">
          <path d="M68,54 Q62,51 56,56 Q58,63 65,64 L65,96 Q65,100 70,100 L94,100 Q99,100 99,96 L99,64 Q106,63 108,56 Q102,51 96,54 Q93,47 82,47 Q71,47 68,54 Z" fill="#7A9E6E" opacity="0.48"/>
        </g>
      </svg>
    ),
  },
  {
    name: "Electronics",
    color: "#D4E0E8",
    icon: (
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Phone */}
        <g transform="rotate(-16, 38, 58)">
          <rect x="18" y="12" width="40" height="72" rx="7" fill="#4A7080" opacity="0.4"/>
          <rect x="24" y="20" width="28" height="44" rx="2" fill="#6B8C9E" opacity="0.3"/>
          <circle cx="38" cy="74" r="5" fill="#6B8C9E" opacity="0.3"/>
        </g>
        {/* Mouse */}
        <g transform="rotate(18, 82, 72)">
          <path d="M82,32 Q102,32 104,54 Q107,76 93,90 Q87,97 82,97 Q77,97 71,90 Q57,76 60,54 Q62,32 82,32 Z" fill="#6B8C9E" opacity="0.45"/>
          <path d="M82,32 L82,62" stroke="#F5F0E8" strokeWidth="2.5" fill="none" opacity="0.5"/>
          <path d="M73,50 Q82,47 91,50 Q82,60 73,50 Z" fill="#4A7080" opacity="0.35"/>
        </g>
      </svg>
    ),
  },
  {
    name: "Books",
    color: "#E8D4C8",
    icon: (
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Bottom book */}
        <g transform="rotate(-9, 58, 82)">
          <path d="M12,65 Q10,65 10,68 L10,95 Q10,98 12,98 L105,98 Q108,98 108,95 L108,68 Q108,65 105,65 Z" fill="#A0624A" opacity="0.38"/>
          <path d="M10,65 L10,98 L22,98 L22,65 Z" fill="#8B4A3A" opacity="0.44"/>
        </g>
        {/* Middle book */}
        <g transform="rotate(6, 58, 58)">
          <path d="M15,42 Q13,42 13,45 L13,70 Q13,73 15,70 L106,70 Q109,70 109,67 L109,45 Q109,42 106,42 Z" fill="#7A9E6E" opacity="0.4"/>
          <path d="M13,42 L13,70 L25,70 L25,42 Z" fill="#5C7A4E" opacity="0.45"/>
          <path d="M30,54 Q65,52 100,54" stroke="#F5F0E8" strokeWidth="1.5" fill="none" opacity="0.5"/>
        </g>
        {/* Top book */}
        <g transform="rotate(-4, 58, 30)">
          <path d="M18,14 Q16,14 16,17 L16,40 Q16,43 18,40 L104,40 Q107,40 107,37 L107,17 Q107,14 104,14 Z" fill="#6B8C9E" opacity="0.42"/>
          <path d="M16,14 L16,40 L28,40 L28,14 Z" fill="#4A7080" opacity="0.48"/>
          <path d="M33,24 Q65,22 98,24" stroke="#F5F0E8" strokeWidth="1.5" fill="none" opacity="0.5"/>
          <path d="M33,32 Q65,30 98,32" stroke="#F5F0E8" strokeWidth="1.5" fill="none" opacity="0.5"/>
        </g>
      </svg>
    ),
  },
  {
    name: "Cosmetics",
    color: "#ECD8D4",
    icon: (
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Mirror */}
        <g transform="rotate(-12, 25, 52)">
          <ellipse cx="25" cy="46" rx="16" ry="22" fill="none" stroke="#8B7355" strokeWidth="4" opacity="0.42"/>
          <rect x="21" y="66" width="8" height="16" rx="2" fill="#8B7355" opacity="0.38"/>
        </g>
        {/* Face wash bottle */}
        <g transform="rotate(7, 58, 60)">
          <path d="M48,26 Q48,18 54,16 L64,16 Q70,18 70,26 L72,82 Q72,90 58,90 Q44,90 44,82 Z" fill="#A0624A" opacity="0.4"/>
          <path d="M54,16 L64,16 L64,8 Q64,4 58,4 Q52,4 52,8 Z" fill="#8B4A3A" opacity="0.5"/>
          <path d="M44,34 L72,34" stroke="#F5F0E8" strokeWidth="1.5" fill="none" opacity="0.4"/>
        </g>
        {/* Cream jar */}
        <g transform="rotate(-6, 92, 88)">
          <ellipse cx="92" cy="82" rx="20" ry="10" fill="#9AB88A" opacity="0.42"/>
          <path d="M72,76 Q72,70 92,70 Q112,70 112,76 L112,82 Q112,90 92,90 Q72,90 72,82 Z" fill="#7A9E6E" opacity="0.4"/>
        </g>
        {/* Mascara */}
        <g transform="rotate(22, 100, 42)">
          <path d="M95,12 L106,12 Q109,12 109,17 L109,66 Q109,71 106,71 L95,71 Q92,71 92,66 L92,17 Q92,12 95,12 Z" fill="#4A3728" opacity="0.38"/>
          <path d="M92,20 L109,20" stroke="#F5F0E8" strokeWidth="1.5" fill="none" opacity="0.4"/>
          <path d="M100,12 L100,4 Q102,1 104,4 Q102,10 100,12" stroke="#4A3728" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round"/>
        </g>
      </svg>
    ),
  },
  {
    name: "Furniture & Home Decor",
    color: "#D8E4D0",
    icon: (
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Table */}
        <g transform="rotate(-5, 60, 52)">
          <path d="M8,44 L112,44 Q115,44 115,48 Q115,52 112,52 L8,52 Q5,52 5,48 Q5,44 8,44 Z" fill="#A0624A" opacity="0.35"/>
          <rect x="18" y="52" width="9" height="32" rx="2" fill="#A0624A" opacity="0.3"/>
          <rect x="93" y="52" width="9" height="32" rx="2" fill="#A0624A" opacity="0.3"/>
        </g>
        {/* Chair */}
        <g transform="rotate(12, 28, 80)">
          <path d="M8,58 L50,58 Q52,58 52,62 Q52,66 50,66 L8,66 Q6,66 6,62 Q6,58 8,58 Z" fill="#8B7355" opacity="0.42"/>
          <path d="M8,40 L8,66" stroke="#8B7355" strokeWidth="5" strokeLinecap="round" opacity="0.42"/>
          <path d="M50,66 L50,95" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" opacity="0.38"/>
          <path d="M8,66 L8,95" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" opacity="0.38"/>
        </g>
        {/* Plant in vase */}
        <g transform="rotate(-9, 92, 78)">
          <path d="M80,70 L104,70 Q108,70 108,75 L106,96 Q106,102 92,102 Q78,102 78,96 L76,75 Q76,70 80,70 Z" fill="#7A9E6E" opacity="0.45"/>
          <path d="M92,70 Q86,54 74,43 Q88,50 92,70 Z" fill="#5C7A4E" opacity="0.45"/>
          <path d="M92,70 Q98,50 110,40 Q108,56 92,70 Z" fill="#9AB88A" opacity="0.42"/>
          <path d="M92,70 L92,50" stroke="#5C7A4E" strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round"/>
        </g>
      </svg>
    ),
  },
  {
    name: "Stationery & Art Supplies",
    color: "#E4E0D0",
    icon: (
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Sketchbook open */}
        <g transform="rotate(-11, 52, 62)">
          <path d="M8,18 Q6,18 6,21 L6,100 Q6,103 8,103 L52,103 L52,18 Z" fill="#D4C8A8" opacity="0.5"/>
          <path d="M52,18 L52,103 L96,103 Q98,103 98,100 L98,21 Q98,18 96,18 Z" fill="#C8BC98" opacity="0.45"/>
          <path d="M52,18 L52,103" stroke="#8B7355" strokeWidth="3" fill="none" opacity="0.42"/>
          <path d="M12,38 L48,38" stroke="#8B7355" strokeWidth="1.5" fill="none" opacity="0.32"/>
          <path d="M12,50 L48,50" stroke="#8B7355" strokeWidth="1.5" fill="none" opacity="0.32"/>
          <path d="M56,38 L94,38" stroke="#8B7355" strokeWidth="1.5" fill="none" opacity="0.32"/>
          <path d="M56,50 L94,50" stroke="#8B7355" strokeWidth="1.5" fill="none" opacity="0.32"/>
        </g>
        {/* Paint palette */}
        <g transform="rotate(16, 85, 38)">
          <path d="M68,14 Q88,6 106,18 Q120,32 114,52 Q108,65 96,62 Q88,60 85,50 Q80,40 68,44 Q55,47 52,36 Q49,22 68,14 Z" fill="#9AB88A" opacity="0.42"/>
          <circle cx="73" cy="24" r="6" fill="#A0624A" opacity="0.52"/>
          <circle cx="90" cy="16" r="6" fill="#6B8C9E" opacity="0.52"/>
          <circle cx="107" cy="27" r="6" fill="#8B7355" opacity="0.52"/>
          <circle cx="110" cy="46" r="6" fill="#7A9E6E" opacity="0.52"/>
          <circle cx="85" cy="45" r="5" fill="#F5F0E8" opacity="0.6"/>
        </g>
      </svg>
    ),
  },
  {
    name: "Miscellaneous",
    color: "#DDD8C8",
    icon: (
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Vase */}
        <g transform="rotate(-10, 30, 72)">
          <path d="M18,20 L42,20 Q46,20 48,26 Q58,48 55,72 Q52,88 30,92 Q8,88 5,72 Q2,48 12,26 Q14,20 18,20 Z" fill="#7A9E6E" opacity="0.4"/>
          <path d="M20,20 L40,20" stroke="#5C7A4E" strokeWidth="3" fill="none" opacity="0.3"/>
        </g>
        {/* Small book */}
        <g transform="rotate(14, 75, 45)">
          <path d="M55,20 Q53,20 53,23 L53,62 Q53,65 55,65 L92,65 Q95,65 95,62 L95,23 Q95,20 92,20 Z" fill="#A0624A" opacity="0.4"/>
          <path d="M53,20 L53,65 L63,65 L63,20 Z" fill="#8B4A3A" opacity="0.45"/>
        </g>
        {/* Small t-shirt */}
        <g transform="rotate(-8, 82, 90)">
          <path d="M66,74 Q60,71 55,76 Q58,84 65,86 L65,108 Q65,112 70,112 L94,112 Q99,112 99,108 L99,86 Q106,84 109,76 Q104,71 98,74 Q95,66 82,66 Q69,66 66,74 Z" fill="#6B8C9E" opacity="0.38"/>
        </g>
      </svg>
    ),
  },
];

const sidebarItems = [
  {
    label: "Search",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    href: "/search",
  },
  {
    label: "My Stuff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    href: "/my-stuff",
  },
  {
    label: "My Swaps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M7 16V4m0 0L3 8m4-4 4 4" /><path d="M17 8v12m0 0 4-4m-4 4-4-4" />
      </svg>
    ),
    href: "/my-swaps",
  },
  {
    label: "Liked Stuff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    href: "/liked",
  },
  {
    label: "Get Help",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
      </svg>
    ),
    href: "/help",
  },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex">

      {/* ── Sidebar ── */}
      <aside className={`relative flex flex-col bg-white/70 backdrop-blur-sm border-r border-[#D9CFC4] transition-all duration-300 ease-in-out ${sidebarOpen ? "w-52" : "w-16"} shrink-0`}>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center shadow-sm hover:bg-[#6B5040] transition-colors z-10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
            {sidebarOpen ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
          </svg>
        </button>

        <Link href="/" className="px-4 py-6 text-[#4A3728] font-[family-name:var(--font-permanent-marker)] whitespace-nowrap overflow-hidden" style={{fontSize: sidebarOpen ? "1.5rem" : "0"}}>
          Commune
        </Link>

        <nav className="flex flex-col gap-1 px-2 mt-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#6B5040] hover:bg-[#F5F0E8] hover:text-[#4A3728] transition-colors"
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <h1 className="text-3xl font-light text-[#4A3728] mb-2 font-[family-name:var(--font-jost)]">Categories</h1>
        <p className="text-[#8B7355] mb-8">What are you looking to swap today?</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl p-3 hover:scale-105 transition-transform shadow-sm cursor-pointer"
              style={{ backgroundColor: cat.color }}
            >
              <div className="w-3/4 h-3/4 flex items-center justify-center">
                {cat.icon}
              </div>
              <span className="text-lg text-[#4A3728] text-center leading-tight font-[family-name:var(--font-permanent-marker)]">{cat.name}</span>
            </button>
          ))}
        </div>
      </main>

    </div>
  );
}
