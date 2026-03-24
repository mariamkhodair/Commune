"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function ProfilePage() {
  const { userId, profile } = useUser();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Populate fields once profile loads
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setArea(profile.area ?? "");
    setCity(profile.city ?? "");
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    setAvatarUrl(urlWithBust);
    setUploading(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ name, area, city, phone }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const initials = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto max-w-2xl">
        <h1 className="text-3xl font-light text-[#4A3728] mb-1 font-[family-name:var(--font-jost)]">My Profile</h1>
        <p className="text-[#8B7355] mb-8">Update your personal information.</p>

        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-[#D9CFC4]" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#EDE8DF] flex items-center justify-center text-3xl font-medium text-[#4A3728] font-[family-name:var(--font-permanent-marker)]">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center hover:bg-[#6B5040] transition-colors shadow-sm disabled:opacity-60"
            >
              {uploading ? (
                <div className="w-3 h-3 border border-[#F5F0E8] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              )}
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-[#4A3728]">{name || "Your Name"}</p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-[#8B7355] hover:text-[#4A3728] transition-colors mt-0.5"
            >
              {uploading ? "Uploading…" : "Change profile photo"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#6B5040] mb-1.5 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#D9CFC4] bg-white px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B5040] mb-1.5 uppercase tracking-wide">Neighbourhood / Area</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-xl border border-[#D9CFC4] bg-white px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              placeholder="e.g. Maadi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B5040] mb-1.5 uppercase tracking-wide">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[#D9CFC4] bg-white px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              placeholder="e.g. Cairo"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B5040] mb-1.5 uppercase tracking-wide">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[#D9CFC4] bg-white px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              placeholder="+20 100 000 0000"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 px-8 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-60 w-fit flex items-center gap-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-[#F5F0E8] border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : saved ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg>
                Saved
              </>
            ) : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
