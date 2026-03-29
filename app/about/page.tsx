import Sidebar from "@/components/Sidebar";

export default function AboutUs() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-2xl">

          {/* Header */}
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)] mb-1">About Commune</h1>
          <p className="text-[#8B7355] mb-10">Why we started Commune and what we stand for.</p>

          {/* Story */}
          <section className="mb-10">
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">The Story</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 border border-[#D9CFC4] flex flex-col gap-4 text-sm text-[#6B5040] leading-relaxed">
              <p>
                Commune was conceived in 2022 in a simple ahwa over a couple of dark roast turkish coffees. It all started with a conversation about how everyone has so much stuff! Wardrobes full of things never worn, shelves of books never re-read, gadgets collecting dust in drawers. Meanwhile, others are looking for exactly those things.
              </p>
              <p>
                The question wasn't why people couldn't afford new things. It was why they were buying new things at all when what they needed was probably already sitting in someone else's home.
              </p>
              <p>
                So we built a platform to help people trade instead of buy — reducing waste, cutting costs, and doing something good in the process.
              </p>
            </div>
          </section>

          {/* Mission */}
          <section className="mb-10">
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">Our Mission</h2>
            <div className="rounded-2xl px-6 py-8 text-center">
              <p className="text-xl text-[#4A3728] font-[family-name:var(--font-jost)] font-light leading-relaxed">
                "To help people declutter their Homes, Save money and Help those in need - just by swapping."
              </p>
            </div>
          </section>

          {/* Impact */}
          <section className="mb-10">
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">The Impact</h2>
            <div className="flex flex-col gap-3">

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[#D9CFC4] flex gap-4 items-start">
                <span className="text-2xl mt-0.5">♻️</span>
                <div>
                  <p className="text-sm font-medium text-[#4A3728] mb-1">Less Waste</p>
                  <p className="text-sm text-[#6B5040] leading-relaxed">Every swap is an item saved from a landfill. The more we trade, the less we consume.</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[#D9CFC4] flex gap-4 items-start">
                <span className="text-2xl mt-0.5">💸</span>
                <div>
                  <p className="text-sm font-medium text-[#4A3728] mb-1">Real Savings</p>
                  <p className="text-sm text-[#6B5040] leading-relaxed">Get what you need without spending. A points-based system means value is exchanged fairly, not just financially.</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[#D9CFC4] flex gap-4 items-start">
                <span className="text-2xl mt-0.5">🤝🏽</span>
                <div>
                  <p className="text-sm font-medium text-[#4A3728] mb-1">Giving Back</p>
                  <p className="text-sm text-[#6B5040] leading-relaxed">30% of every annual subscription fee is donated to charity. We partner with local NGOs to fund hospitals and build schools across Egypt.</p>
                </div>
              </div>

            </div>
          </section>

          {/* Founder */}
          <section>
            <h2 className="text-2xl text-[#4A3728] mb-4 text-center font-[family-name:var(--font-permanent-marker)]">The Founder</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 border border-[#D9CFC4] flex flex-col gap-2">
              <p className="text-sm font-medium text-[#4A3728]">Mariam Khodair</p>
              <p className="text-sm text-[#6B5040] leading-relaxed">
                Mariam founded Commune with the belief that a small shift in how we think about ownership can create a meaningful ripple effect — for individuals, communities, and the planet.
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
