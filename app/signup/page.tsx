"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toJpegBlob } from "@/lib/imageUtils";

const DRAFT_KEY = "signup_draft";

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    street: "",
    area: "",
    city: "",
  });

  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const { form: savedForm, agreedToTerms: savedAgreed } = JSON.parse(saved);
        if (savedForm) setForm(savedForm);
        if (savedAgreed) setAgreedToTerms(savedAgreed);
      }
    } catch {}
  }, []);

  // Save draft on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, agreedToTerms }));
    } catch {}
  }, [form, agreedToTerms]);

  async function handlePhoto(file: File) {
    const jpeg = await toJpegBlob(file);
    if (!jpeg) return;
    setPhoto(URL.createObjectURL(jpeg));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const phoneRegex = /^(10|11|12|15)\d{8}$/;
    if (!phoneRegex.test(form.phone)) {
      setError("Please enter a valid Egyptian mobile number (e.g. 1012345678)");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          phone: `+20${form.phone}`,
          area: form.area,
          city: form.city,
        },
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      sessionStorage.removeItem(DRAFT_KEY);
      // Send welcome email — fire and forget, don't block navigation
      fetch("/api/welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email }),
      }).catch(() => {});
      router.push("/tutorial");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden px-4 pt-10">


      {/* ── T-shirt — top left ── */}
      <svg className="pointer-events-none absolute left-0 top-1/4 w-40 h-40" style={{transform: "rotate(12deg) translateX(-10px)"}} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20,20 Q10,15 0,22 Q5,35 18,38 L18,85 Q18,92 25,92 L75,92 Q82,92 82,85 L82,38 Q95,35 100,22 Q90,15 80,20 Q75,8 50,8 Q25,8 20,20 Z" fill="#6B8C9E" opacity="0.13" />
      </svg>

      {/* ── Book — right side upper ── */}
      <svg className="pointer-events-none absolute right-2 top-1/3 w-36 h-40" style={{transform: "rotate(-14deg)"}} viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,0 Q5,0 5,5 L5,95 Q5,100 10,100 L75,100 Q80,100 80,95 L80,5 Q80,0 75,0 Z" fill="#A0624A" opacity="0.12" />
        <path d="M5,0 Q0,0 0,5 L0,95 Q0,100 5,100 L15,100 L15,0 Z" fill="#8B4A3A" opacity="0.14" />
        <path d="M20,30 Q50,28 70,30" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M20,45 Q50,43 70,45" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M20,60 Q50,58 65,60" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.4" />
      </svg>

      {/* ── Vase — left lower ── */}
      <svg className="pointer-events-none absolute left-4 bottom-1/4 w-32 h-40" style={{transform: "rotate(-10deg)"}} viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M25,0 L55,0 Q60,0 62,5 Q75,30 72,60 Q70,85 55,100 Q48,108 40,108 Q32,108 25,100 Q10,85 8,60 Q5,30 18,5 Q20,0 25,0 Z" fill="#7A9E6E" opacity="0.15" />
        <path d="M28,0 L50,0" stroke="#5C7A4E" strokeWidth="3" fill="none" opacity="0.2" />
      </svg>

      {/* ── Lipstick — right lower ── */}
      <svg className="pointer-events-none absolute right-6 bottom-1/3 w-24 h-40" style={{transform: "rotate(16deg)"}} viewBox="0 0 50 110" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,45 L10,100 Q10,108 25,108 Q40,108 40,100 L40,45 Z" fill="#A0624A" opacity="0.13" />
        <path d="M10,45 L15,15 Q20,5 25,3 Q30,5 35,15 L40,45 Z" fill="#8B4A3A" opacity="0.15" />
        <path d="M8,55 L42,55" stroke="#F5F0E8" strokeWidth="2" fill="none" opacity="0.3" />
      </svg>

      {/* ── Mouse — bottom right ── */}
      <svg className="pointer-events-none absolute bottom-10 right-1/4 w-32 h-40" style={{transform: "rotate(-18deg)"}} viewBox="0 0 70 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M35,0 Q60,0 65,25 Q70,55 55,78 Q45,95 35,95 Q25,95 15,78 Q0,55 5,25 Q10,0 35,0 Z" fill="#6B8C9E" opacity="0.12" />
        <path d="M35,0 L35,42" stroke="#F5F0E8" strokeWidth="2.5" fill="none" opacity="0.35" />
        <path d="M28,20 Q35,18 42,20 Q35,30 28,20 Z" fill="#4A7080" opacity="0.2" />
      </svg>

      {/* Logo */}
      <Link href="/" className="mb-8 text-5xl text-[#4A3728] font-[family-name:var(--font-permanent-marker)] hover:opacity-80 transition-opacity">
        Commune
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white/60 backdrop-blur-sm rounded-3xl px-8 py-10 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#4A3728] mb-2">Create your account</h2>
        <p className="text-sm text-[#8B7355] mb-8">Join the community and start swapping.</p>

        {success && (
          <div className="mb-6 rounded-xl bg-[#7A9E6E]/20 border border-[#7A9E6E] px-4 py-3 text-sm text-[#4A3728]">
            Account created! Check your email to confirm your address.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Profile photo */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-[#EDE8DF] flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity border-2 border-dashed border-[#D9CFC4] hover:border-[#4A3728]"
            >
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-7 h-7">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-[#4A3728]/60 py-1 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            </button>
            <p className="text-xs text-[#A09080]">Profile photo <span className="text-[#C4B9AA]">(optional)</span></p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]); }} />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B5040]">Full Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Mark Ruffalo"
              value={form.name}
              onChange={handleChange}
              className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B5040]">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B5040]">Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="At least 8 characters"
              minLength={8}
              value={form.password}
              onChange={handleChange}
              className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B5040]">Mobile Number</label>
            <div className="flex rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] overflow-hidden focus-within:border-[#4A3728] transition-colors">
              <span className="px-4 py-3 text-[#8B7355] border-r border-[#D9CFC4] text-sm flex items-center">+20</span>
              <input
                name="phone"
                type="tel"
                required
                placeholder="1012345678"
                maxLength={10}
                value={form.phone}
                onChange={handleChange}
                className="flex-1 bg-transparent px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-[#A0624A] mt-1">{error}</p>}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-3">
            <label className="text-sm text-[#6B5040]">Address</label>

            <input
              name="street"
              type="text"
              placeholder="Street address"
              value={form.street}
              onChange={handleChange}
              className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                name="area"
                type="text"
                placeholder="Area / Neighbourhood"
                value={form.area}
                onChange={handleChange}
                className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              />
              <input
                name="city"
                type="text"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              />
            </div>

            {/* Map picker placeholder — will be replaced with Google Maps once API key is set up */}
            <div className="rounded-xl border border-dashed border-[#D9CFC4] bg-[#FAF7F2] px-4 py-5 flex flex-col items-center gap-2 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" strokeLinecap="round" className="w-6 h-6">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <p className="text-xs text-[#A09080]">Interactive map coming soon — your address above will be used to find nearby members.</p>
            </div>
          </div>


          {/* Terms agreement */}
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#4A3728] shrink-0"
              />
              <span className="text-sm text-[#6B5040] leading-relaxed">
                I have read and agree to Commune's{" "}
                <Link
                  href="/community-guidelines"
                  target="_blank"
                  className="text-[#4A3728] font-medium underline hover:text-[#6B5040] transition-colors"
                >
                  Community Guidelines
                </Link>
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success || !agreedToTerms}
            className="mt-2 w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Join Commune"}
          </button>

        </form>

        <p className="text-center text-sm text-[#8B7355] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#4A3728] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>


    </div>
  );
}
