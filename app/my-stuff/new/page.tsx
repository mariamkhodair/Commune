"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const categories = [
  "Apparel",
  "Electronics",
  "Books",
  "Cosmetics",
  "Furniture & Home Decor",
  "Stationery & Art Supplies",
  "Miscellaneous",
];

const conditions = ["New", "Like New", "Good", "Fair"];

type Step = "form" | "preview";

export default function NewItem() {
  const [step, setStep] = useState<Step>("form");
  const [photo, setPhoto] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    condition: "",
    description: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleAnalyse() {
    setLoading(true);
    // TODO: call AI API to analyse item and assign points
    await new Promise((r) => setTimeout(r, 1800)); // placeholder delay
    setPoints(340); // placeholder points value
    setLoading(false);
    setStep("preview");
  }

  const formComplete = photo && form.name && form.category && form.condition && form.description;

  return (
    <div className="min-h-screen">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-8 py-5 border-b border-[#D9CFC4] bg-white/60 backdrop-blur-sm">
        <Link href="/my-stuff" className="text-[#8B7355] hover:text-[#4A3728] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">
          {step === "form" ? "List an Item" : "Preview"}
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── FORM STEP ── */}
        {step === "form" && (
          <div className="flex flex-col gap-6">

            {/* Photo upload */}
            <div>
              <label className="text-sm text-[#6B5040] block mb-2">Photo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                className={`relative w-full aspect-square max-h-72 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${dragging ? "border-[#4A3728] bg-[#EDE8DF]" : "border-[#D9CFC4] bg-white/50 hover:border-[#4A3728] hover:bg-[#FAF7F2]"}`}
              >
                {photo ? (
                  <img src={photo} alt="Item preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-10 h-10 mb-3">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="text-sm text-[#8B7355]">Drop a photo or click to upload</p>
                  </>
                )}
                {photo && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#4A3728]/70 text-white flex items-center justify-center hover:bg-[#4A3728] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            {/* Item name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#6B5040]">Item Name</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Canon EOS 200D Camera"
                value={form.name}
                onChange={handleChange}
                className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#6B5040]">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
              >
                <option value="" disabled>Select a category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#6B5040]">Condition</label>
              <div className="flex gap-2 flex-wrap">
                {conditions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, condition: c })}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${form.condition === c ? "bg-[#4A3728] text-[#F5F0E8] border-[#4A3728]" : "border-[#D9CFC4] text-[#6B5040] hover:border-[#4A3728]"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#6B5040]">Description</label>
              <textarea
                name="description"
                placeholder="Include as much detail as possible — model, size, age, any wear or damage, original packaging, etc."
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors resize-none"
              />
            </div>

            {/* Analyse button */}
            <button
              onClick={handleAnalyse}
              disabled={!formComplete || loading}
              className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3.5 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Analysing your item…" : "Analyse & Get Points Value"}
            </button>

          </div>
        )}

        {/* ── PREVIEW STEP ── */}
        {step === "preview" && (
          <div className="flex flex-col gap-6">

            {/* Photo */}
            {photo && (
              <div className="w-full aspect-square max-h-72 rounded-2xl overflow-hidden">
                <img src={photo} alt="Item" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Points */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B7355] mb-1">Estimated Points Value</p>
                <p className="text-4xl font-bold text-[#4A3728]">{points} <span className="text-xl font-normal text-[#8B7355]">pts</span></p>
                <p className="text-xs text-[#A09080] mt-1">Based on current Egyptian market value</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7A9E6E" strokeWidth="1.5" className="w-12 h-12 opacity-60">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>

            {/* Item details */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8B7355]">Name</span>
                <span className="text-[#4A3728] font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8B7355]">Category</span>
                <span className="text-[#4A3728] font-medium">{form.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8B7355]">Condition</span>
                <span className="text-[#4A3728] font-medium">{form.condition}</span>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-[#8B7355]">Description</span>
                <span className="text-[#4A3728]">{form.description}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3.5 font-semibold hover:bg-[#6B5040] transition-colors"
                onClick={() => alert("Item listed! (Supabase save coming next)")}
              >
                List This Item
              </button>
              <button
                className="w-full rounded-full border border-[#D9CFC4] text-[#6B5040] py-3.5 font-medium hover:border-[#4A3728] transition-colors"
                onClick={() => setStep("form")}
              >
                Edit Details
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
