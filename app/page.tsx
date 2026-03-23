export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col relative overflow-hidden">

      {/* ── Corner leaves ── */}
      <svg className="pointer-events-none absolute top-0 left-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,100 Q30,60 70,40 Q100,0 140,10 Q100,50 90,80 Q70,110 20,120 Z" fill="#7A9E6E" opacity="0.18" />
        <path d="M0,160 Q40,110 90,100 Q60,140 30,170 Q10,180 0,170 Z" fill="#5C7A4E" opacity="0.13" />
        <path d="M30,0 Q80,20 60,70 Q35,55 10,25 Z" fill="#9AB88A" opacity="0.15" />
      </svg>
      <svg className="pointer-events-none absolute top-0 right-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M200,100 Q170,60 130,40 Q100,0 60,10 Q100,50 110,80 Q130,110 180,120 Z" fill="#7A9E6E" opacity="0.18" />
        <path d="M200,160 Q160,110 110,100 Q140,140 170,170 Q190,180 200,170 Z" fill="#5C7A4E" opacity="0.13" />
        <path d="M170,0 Q120,20 140,70 Q165,55 190,25 Z" fill="#9AB88A" opacity="0.15" />
      </svg>
      <svg className="pointer-events-none absolute bottom-0 left-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,100 Q30,140 70,160 Q100,200 140,190 Q100,150 90,120 Q70,90 20,80 Z" fill="#7A9E6E" opacity="0.18" />
        <path d="M30,200 Q80,180 60,130 Q35,145 10,175 Z" fill="#9AB88A" opacity="0.15" />
      </svg>
      <svg className="pointer-events-none absolute bottom-0 right-0 w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M200,100 Q170,140 130,160 Q100,200 60,190 Q100,150 110,120 Q130,90 180,80 Z" fill="#7A9E6E" opacity="0.18" />
        <path d="M170,200 Q120,180 140,130 Q165,145 190,175 Z" fill="#9AB88A" opacity="0.15" />
        <path d="M200,60 Q160,110 110,100 Q140,70 180,50 Z" fill="#5C7A4E" opacity="0.13" />
      </svg>

      {/* ── T-shirt — left side, middle ── */}
      <svg className="pointer-events-none absolute left-0 top-1/3 w-40 h-40" style={{transform: "rotate(-15deg) translateX(-10px)"}} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20,20 Q10,15 0,22 Q5,35 18,38 L18,85 Q18,92 25,92 L75,92 Q82,92 82,85 L82,38 Q95,35 100,22 Q90,15 80,20 Q75,8 50,8 Q25,8 20,20 Z" fill="#6B8C9E" opacity="0.13" />
      </svg>

      {/* ── Book — right side, upper-middle ── */}
      <svg className="pointer-events-none absolute right-4 top-1/4 w-36 h-40" style={{transform: "rotate(12deg)"}} viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,0 Q5,0 5,5 L5,95 Q5,100 10,100 L75,100 Q80,100 80,95 L80,5 Q80,0 75,0 Z" fill="#A0624A" opacity="0.12" />
        <path d="M5,0 Q0,0 0,5 L0,95 Q0,100 5,100 L15,100 L15,0 Z" fill="#8B4A3A" opacity="0.14" />
        <path d="M20,30 Q50,28 70,30" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M20,45 Q50,43 70,45" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M20,60 Q50,58 65,60" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.4" />
      </svg>

      {/* ── Vase — left side, lower-middle ── */}
      <svg className="pointer-events-none absolute left-6 bottom-1/4 w-32 h-40" style={{transform: "rotate(8deg)"}} viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M25,0 L55,0 Q60,0 62,5 Q75,30 72,60 Q70,85 55,100 Q48,108 40,108 Q32,108 25,100 Q10,85 8,60 Q5,30 18,5 Q20,0 25,0 Z" fill="#7A9E6E" opacity="0.15" />
        <path d="M28,0 L50,0" stroke="#5C7A4E" strokeWidth="3" fill="none" opacity="0.2" />
      </svg>

      {/* ── Lipstick / makeup — right side, lower-middle ── */}
      <svg className="pointer-events-none absolute right-8 bottom-1/4 w-24 h-40" style={{transform: "rotate(-20deg)"}} viewBox="0 0 50 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,45 L10,100 Q10,108 25,108 Q40,108 40,100 L40,45 Z" fill="#A0624A" opacity="0.13" />
        <path d="M10,45 L15,15 Q20,5 25,3 Q30,5 35,15 L40,45 Z" fill="#8B4A3A" opacity="0.15" />
        <path d="M8,55 L42,55" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.3" />
      </svg>

      {/* ── Computer mouse — bottom center-left ── */}
      <svg className="pointer-events-none absolute bottom-8 left-1/4 w-32 h-40" style={{transform: "rotate(18deg)"}} viewBox="0 0 70 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M35,0 Q60,0 65,25 Q70,55 55,78 Q45,95 35,95 Q25,95 15,78 Q0,55 5,25 Q10,0 35,0 Z" fill="#6B8C9E" opacity="0.12" />
        <path d="M35,0 L35,42" stroke="#F5F0E8" strokeWidth="2.5" fill="none" opacity="0.35" />
        <path d="M28,20 Q35,18 42,20 Q35,30 28,20 Z" fill="#4A7080" opacity="0.2" />
      </svg>


      {/* ── Navigation ── */}
      <nav className="flex flex-col items-center pt-8 pb-2 relative z-10">
        <div className="flex items-center mt-12">
          <h1 className="text-6xl text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">Commune</h1>
        </div>
        <div className="flex gap-4 absolute right-8 top-8">
          <a href="/login" className="px-5 py-2 rounded-full border-2 border-[#4A3728] text-[#4A3728] font-medium hover:bg-[#4A3728] hover:text-[#F5F0E8] transition-colors">
            Log In
          </a>
          <a href="/signup" className="px-5 py-2 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors">
            Sign Up
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex flex-col items-center justify-center flex-1 text-center px-6 pt-6 pb-24 relative z-10">
        <p className="text-[#8B7355] uppercase tracking-widest text-sm font-medium mb-6">
          Trade freely. Live lightly. Together.
        </p>
        <h2 className="text-5xl font-bold text-[#4A3728] leading-tight max-w-2xl mb-8">
          Everything you need is already out there.
        </h2>
        <p className="text-lg text-[#6B5040] max-w-xl leading-relaxed mb-12">
          We all have more than we need — and someone else needs exactly what we have.
          Commune is a platform built on that simple truth. By swapping what we own
          instead of buying new, we reduce waste, ease financial pressure, and strengthen
          the bonds between us. No money changes hands. Just people, trading stuff.
        </p>
        <a href="/signup" className="px-8 py-4 rounded-full bg-[#4A3728] text-[#F5F0E8] text-lg font-semibold hover:bg-[#6B5040] transition-colors">
          Join Commune
        </a>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-[#8B7355] text-sm relative z-10">
        © 2026 Commune. All rights reserved.
      </footer>

    </div>
  );
}
