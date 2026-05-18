"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toJpegBlob } from "@/lib/imageUtils";
import { useLang } from "@/lib/languageContext";
import LangToggle from "@/components/LangToggle";
import HandsStringCurve from "@/components/HandsStringCurve";
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";

const DRAFT_KEY = "signup_draft";
const MAPS_LIBS: ("places")[] = ["places"];

const inputClass = "rounded-xl border border-[#E4E4E4] bg-white px-4 py-3 text-[#111111] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#B8935A] focus:ring-2 focus:ring-[#B8935A]/10 transition-all w-full";

export default function SignUp() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    area: "",
    city: "",
    referralCode: "",
  });

  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 30.0444, lng: 31.2357 });

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: MAPS_LIBS,
  });

  function onPlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components) return;
    let area = "";
    let city = "";
    for (const c of place.address_components as { types: string[]; long_name: string }[]) {
      if (c.types.includes("sublocality_level_1") || c.types.includes("neighborhood")) area = c.long_name;
      if (c.types.includes("locality") || c.types.includes("administrative_area_level_1")) city = c.long_name;
    }
    setForm((f) => ({ ...f, area: area || f.area, city: city || f.city }));
    const loc = place.geometry?.location as { lat(): number; lng(): number } | undefined;
    if (loc) setMapCenter({ lat: loc.lat(), lng: loc.lng() });
  }

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
      setError(t("signup.invalidPhone"));
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
      // Apply referral code if provided — fire-and-forget, get session token first
      if (form.referralCode.trim()) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          fetch("/api/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ code: form.referralCode.trim() }),
          }).catch(() => {});
        }
      }
      fetch("/api/welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email }),
      }).catch(() => {});
      router.push("/tutorial");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden px-4 pt-20 sm:pt-10 pb-16" dir={isRTL ? "rtl" : "ltr"} style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 24px, rgba(176,208,232,0.5) 24px, rgba(176,208,232,0.5) 25px)" }}>

      {/* Soft red vertical line */}
      <div className="absolute top-0 bottom-0 w-[8px] pointer-events-none" style={{ right: "46px", background: "linear-gradient(to right, transparent, rgba(255,0,0,0.5), transparent)", filter: "blur(2px)", zIndex: 0 }} />

      <LangToggle className="absolute left-8 top-8 z-10" />

      {/* Hands illustration — vertically centered, left side */}
      <img
        src="/hands-transparent.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-0 w-96 object-contain"
      />
      <HandsStringCurve />

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3 z-[1]">
        <Link href="/" className="text-5xl text-[#355E3B] font-[family-name:var(--font-permanent-marker)] hover:opacity-70 transition-opacity" style={{ WebkitTextStroke: "1px #2C2C2C" }}>
          Commune
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl px-8 py-10 border border-[#E4E4E4] shadow-sm z-[1]">
        <h2 className="text-2xl font-normal text-[#111111] mb-1">{t("signup.createAccount")}</h2>
        <p className="text-sm text-[#6B6B6B] mb-8">{t("signup.subtitle")}</p>

        {success && (
          <div className="mb-6 rounded-xl bg-[#7A9E6E]/15 border border-[#7A9E6E]/40 px-4 py-3 text-sm text-[#111111]">
            Account created! Check your email to confirm your address.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Profile photo */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-md bg-[#F0F0EE] flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity border border-[#E4E4E4]"
            >
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" strokeWidth="1.5" className="w-7 h-7">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-[#111111]/50 py-1 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            </button>
            <p className="text-xs text-[#A8A8A8]">Profile photo <span className="text-[#C7C7CC]">(optional)</span></p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handlePhoto(e.target.files[0]); }} />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">{t("signup.fullName")}</label>
            <input name="name" type="text" required placeholder="Mark Ruffalo" value={form.name} onChange={handleChange} className={inputClass} />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">{t("signup.email")}</label>
            <input name="email" type="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} className={inputClass} />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">{t("signup.password")}</label>
            <input name="password" type="password" required placeholder="At least 8 characters" minLength={8} value={form.password} onChange={handleChange} className={inputClass} />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">{t("signup.phone")}</label>
            <div className="flex rounded-xl border border-[#E4E4E4] bg-white overflow-hidden focus-within:border-[#B8935A] focus-within:ring-2 focus-within:ring-[#B8935A]/10 transition-all">
              <span className="px-4 py-3 text-[#6B6B6B] border-r border-[#E4E4E4] text-sm flex items-center shrink-0">+20</span>
              <input
                name="phone"
                type="tel"
                required
                placeholder="1012345678"
                maxLength={10}
                value={form.phone}
                onChange={handleChange}
                className="flex-1 bg-transparent px-4 py-3 text-[#111111] placeholder:text-[#C7C7CC] focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-[#A0624A] mt-1">{error}</p>}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-3">
            <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">Address</label>
            {mapsLoaded ? (
              <div className="rounded-xl overflow-hidden border border-[#E4E4E4]">
                <Autocomplete
                  onLoad={(ref) => { autocompleteRef.current = ref; }}
                  onPlaceChanged={onPlaceChanged}
                  options={{ componentRestrictions: { country: "eg" }, fields: ["address_components", "geometry"] }}
                >
                  <input
                    type="text"
                    placeholder="Search your address on the map..."
                    className="w-full px-4 py-3 text-[#111111] placeholder:text-[#C7C7CC] focus:outline-none border-b border-[#E4E4E4] text-sm bg-white"
                  />
                </Autocomplete>
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "180px" }}
                  center={mapCenter}
                  zoom={13}
                  options={{ disableDefaultUI: true, zoomControl: true, styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }] }}
                >
                  <Marker position={mapCenter} />
                </GoogleMap>
              </div>
            ) : (
              <div className="w-full h-[224px] rounded-xl bg-[#F0F0EE] flex items-center justify-center border border-[#E4E4E4]">
                <div className="w-5 h-5 border border-[#C7C7CC] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input name="area" type="text" placeholder="Area / Neighbourhood" value={form.area} onChange={handleChange} className={inputClass} />
              <input name="city" type="text" placeholder="City" value={form.city} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Referral code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">Referral code <span className="normal-case text-[#C7C7CC]">(optional)</span></label>
            <input name="referralCode" type="text" placeholder="e.g. A1B2C3D4" value={form.referralCode} onChange={handleChange} className={inputClass} autoCapitalize="characters" />
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#111111] shrink-0"
            />
            <span className="text-sm text-[#6B6B6B] leading-relaxed">
              {t("signup.agreePrefix")}{" "}
              <Link href="/community-guidelines" target="_blank" className="text-[#111111] underline hover:text-[#3C3C3C] transition-colors">
                {t("signup.guidelines")}
              </Link>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success || !agreedToTerms}
            className="mt-2 w-full rounded-xl bg-[#111111] text-white py-3 font-normal hover:bg-[#0047AB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? t("signup.creating") : t("signup.createBtn")}
          </button>

        </form>

        <p className="text-center text-sm text-[#A8A8A8] mt-6">
          {t("signup.haveAccount")}{" "}
          <Link href="/login" className="text-[#111111] font-normal hover:underline">
            {t("signup.signIn")}
          </Link>
        </p>
      </div>

    </div>
  );
}
