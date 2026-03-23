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

const MIN_PHOTOS = 3;

export default function NewItem() {
  const [step, setStep] = useState<Step>("form");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [pointsMode, setPointsMode] = useState<"ai" | "manual">("ai");
  const [manualPoints, setManualPoints] = useState("");
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

  function handleFiles(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotos((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAnalyse() {
    setLoading(true);
    // TODO: call AI API to analyse item and assign points
    await new Promise((r) => setTimeout(r, 1800)); // placeholder delay
    setPoints(340); // placeholder points value
    setLoading(false);
    setStep("preview");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  function handleManualSubmit() {
    setPoints(parseInt(manualPoints));
    setStep("preview");
  }

  const formComplete = photos.length >= MIN_PHOTOS && form.name && form.category && form.condition && form.description;

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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#6B5040]">
                  Photos <span className="text-[#A0624A] font-medium">minimum 3 required</span>
                </label>
                <span className="text-xs text-[#A09080]">{photos.length} / 3{photos.length > 3 ? `+${photos.length - 3}` : ""} added</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {photos.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#EDE8DF]">
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-[#4A3728]/70 text-white px-1.5 py-0.5 rounded-full">Cover</span>
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#4A3728]/70 text-white flex items-center justify-center hover:bg-[#4A3728] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add photo slot */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#D9CFC4] bg-white/50 hover:border-[#4A3728] hover:bg-[#FAF7F2] flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="2" strokeLinecap="round" className="w-6 h-6 mb-1">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <p className="text-xs text-[#A09080]">{photos.length < MIN_PHOTOS ? `${MIN_PHOTOS - photos.length} more needed` : "Add more"}</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
              />
              <p className="text-xs text-[#A09080] mt-2">First photo will be used as the cover. Drag & drop or click the + to add photos.</p>
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

            {/* Points value section */}
            <div className="flex flex-col gap-3">
              <label className="text-sm text-[#6B5040]">Points Value</label>

              {/* Toggle */}
              <div className="flex rounded-xl border border-[#D9CFC4] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPointsMode("ai")}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${pointsMode === "ai" ? "bg-[#4A3728] text-[#F5F0E8]" : "bg-white/50 text-[#6B5040] hover:bg-[#FAF7F2]"}`}
                >
                  AI Analysis
                </button>
                <button
                  type="button"
                  onClick={() => setPointsMode("manual")}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${pointsMode === "manual" ? "bg-[#4A3728] text-[#F5F0E8]" : "bg-white/50 text-[#6B5040] hover:bg-[#FAF7F2]"}`}
                >
                  Set My Own
                </button>
              </div>

              {pointsMode === "ai" ? (
                <button
                  onClick={handleAnalyse}
                  disabled={!formComplete || loading}
                  className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3.5 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Analysing your item…" : "Analyse & Get Points Value"}
                </button>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter points value"
                    value={manualPoints}
                    onChange={(e) => setManualPoints(e.target.value)}
                    className="flex-1 rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!formComplete || !manualPoints || parseInt(manualPoints) < 1}
                    className="rounded-full bg-[#4A3728] text-[#F5F0E8] px-6 py-3 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── PREVIEW STEP ── */}
        {step === "preview" && (
          <div className="flex flex-col gap-6">

            {/* Photos */}
            {photos.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="w-full aspect-video rounded-2xl overflow-hidden">
                  <img src={photos[0]} alt="Cover" className="w-full h-full object-cover" />
                </div>
                {photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.slice(1).map((src, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden">
                        <img src={src} alt={`Photo ${i + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Points */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B7355] mb-1">Estimated Points Value</p>
                <p className="text-4xl font-bold text-[#4A3728]">{points} <span className="text-xl font-normal text-[#8B7355]">pts</span></p>
                <p className="text-xs text-[#A09080] mt-1">{pointsMode === "ai" ? "Based on current Egyptian market value" : "Set by you"}</p>
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
