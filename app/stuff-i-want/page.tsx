"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

const categories = [
  "Apparel",
  "Electronics",
  "Books",
  "Cosmetics",
  "Furniture & Home Decor",
  "Stationery & Art Supplies",
  "Miscellaneous",
];

const conditions = ["New", "Like New", "Good", "Fair", "Any"];

// Placeholder — will be replaced with Supabase data
const placeholderWanted = [
  { id: 1, name: "Mechanical Keyboard", category: "Electronics", condition: "Like New", notes: "Preferably TKL layout" },
  { id: 2, name: "Linen Blazer", category: "Apparel", condition: "Any", notes: "Size M, neutral colour" },
];

export default function StuffIWant() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", condition: "", notes: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: save to Supabase
    setShowForm(false);
    setForm({ name: "", category: "", condition: "", notes: "" });
  }

  const formComplete = form.name && form.category && form.condition;

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">Stuff I Want</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Item
          </button>
        </div>
        <p className="text-[#8B7355] mb-8">Tell us what you're looking for and we'll match you with someone who has it — and wants what you have.</p>

        {/* Add form */}
        {showForm && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-6 mb-6 border border-[#D9CFC4]">
            <h2 className="text-lg font-medium text-[#4A3728] mb-5">What are you looking for?</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#6B5040]">Item Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Vintage Denim Jacket"
                  value={form.name}
                  onChange={handleChange}
                  className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
                  >
                    <option value="" disabled>Select</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-[#6B5040]">Condition</label>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                    className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
                  >
                    <option value="" disabled>Select</option>
                    {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#6B5040]">Notes <span className="text-[#A09080]">(optional)</span></label>
                <textarea
                  name="notes"
                  placeholder="Any specifics — size, colour, brand, model..."
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!formComplete}
                  className="flex-1 rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-full border border-[#D9CFC4] text-[#6B5040] py-3 font-medium hover:border-[#4A3728] transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Wanted items list */}
        {placeholderWanted.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing on your list yet</p>
            <p className="text-[#A09080] mb-6">Add the things you're looking for and we'll find your match.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-full bg-[#4A3728] text-[#F5F0E8] font-medium hover:bg-[#6B5040] transition-colors"
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {placeholderWanted.map((item) => (
              <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-medium text-[#4A3728]">{item.name}</p>
                  <p className="text-sm text-[#8B7355]">{item.category} · {item.condition}</p>
                  {item.notes && <p className="text-sm text-[#A09080] mt-1">{item.notes}</p>}
                </div>
                <button className="text-[#C4B9AA] hover:text-[#A0624A] transition-colors ml-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
