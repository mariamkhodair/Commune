"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { toJpegBlob } from "@/lib/imageUtils";

type OwnItem = { id: string; name: string; category: string; condition: string; points: number; photos: string[]; status: string };

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <p className="text-xs text-[#C4B9AA]">No ratings yet</p>;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={s <= Math.round(rating) ? "#C4842A" : "none"} stroke="#C4842A" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-[#8B7355] ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { userId, profile } = useUser();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<OwnItem[]>([]);

  // Edit form state
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setArea(profile.area ?? "");
    setCity(profile.city ?? "");
    setPhone(profile.phone ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("items").select("id, name, category, condition, points, photos, status")
      .eq("owner_id", userId).order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, [userId]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw || !userId) return;
    setUploading(true);
    const jpeg = await toJpegBlob(raw, 0.9);
    if (!jpeg) { alert("Unsupported format. Use JPEG or PNG."); setUploading(false); return; }
    const path = `${userId}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, jpeg, { upsert: true, contentType: "image/jpeg" });
    if (error) { setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    setAvatarUrl(url);
    setUploading(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ name, area, city, phone }).eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 1500);
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  const rating = profile.rating_count > 0 ? profile.rating_sum / profile.rating_count : null;
  const joined = new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const initials = (profile.name ?? "?").charAt(0).toUpperCase();

  // ── EDIT MODE ──────────────────────────────────────────────
  if (editing) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 px-8 py-8 overflow-y-auto max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-sm text-[#8B7355] hover:text-[#4A3728] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">Edit Profile</h1>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-[#D9CFC4]" />
                : <div className="w-20 h-20 rounded-full bg-[#EDE8DF] flex items-center justify-center text-3xl font-medium text-[#4A3728]">{initials}</div>
              }
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4A3728] text-[#F5F0E8] flex items-center justify-center hover:bg-[#6B5040] transition-colors shadow-sm disabled:opacity-60"
              >
                {uploading
                  ? <div className="w-3 h-3 border border-[#F5F0E8] border-t-transparent rounded-full animate-spin" />
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                }
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-[#4A3728]">{name || "Your Name"}</p>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs text-[#8B7355] hover:text-[#4A3728] transition-colors mt-0.5">
                {uploading ? "Uploading…" : "Change photo"}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-5">
            {[
              { label: "Name", value: name, set: setName, placeholder: "Your name" },
              { label: "Neighbourhood / Area", value: area, set: setArea, placeholder: "e.g. Maadi" },
              { label: "City", value: city, set: setCity, placeholder: "e.g. Cairo" },
              { label: "Phone Number", value: phone, set: setPhone, placeholder: "+20 100 000 0000" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-[#6B5040] mb-1.5 uppercase tracking-wide">{label}</label>
                <input
                  type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full rounded-xl border border-[#D9CFC4] bg-white px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
                />
              </div>
            ))}
            <button
              onClick={handleSave} disabled={saving}
              className="mt-2 rounded-full bg-[#4A3728] text-[#F5F0E8] py-3 px-8 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-60 w-fit flex items-center gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-[#F5F0E8] border-t-transparent rounded-full animate-spin" /> Saving…</>
                : saved ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg> Saved</>
                : "Save Changes"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 px-8 py-8 overflow-y-auto">

        {/* Profile header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#EDE8DF] flex items-center justify-center text-2xl font-medium text-[#4A3728] overflow-hidden shrink-0">
              {profile.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">{profile.name}</h1>
              <Stars rating={rating} />
              <p className="text-xs text-[#A09080]">
                Member since {joined}
                {profile.area ? ` · ${profile.area}, ${profile.city}` : ""}
                {profile.rating_count > 0 ? ` · ${profile.rating_count} rating${profile.rating_count !== 1 ? "s" : ""}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D9CFC4] text-[#6B5040] text-sm font-medium hover:border-[#4A3728] hover:text-[#4A3728] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit Profile
          </button>
        </div>

        {/* My Stuff */}
        <h2 className="text-lg font-medium text-[#4A3728] mb-4">My Stuff</h2>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-2xl text-[#8B7355] font-[family-name:var(--font-permanent-marker)] mb-3">Nothing listed yet</p>
            <Link href="/my-stuff" className="text-sm text-[#8B7355] hover:underline">Go to My Stuff to list an item →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 portrait-grid-2">
            {items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-[#EDE8DF] hover:shadow-md transition-shadow">
                <div className="aspect-square bg-[#EDE8DF] flex items-center justify-center overflow-hidden">
                  {item.photos[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.photos[0]} alt={item.name} className="w-full h-full object-cover" />
                    : <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" className="w-8 h-8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                  }
                </div>
                <div className="p-3">
                  <p className="font-medium text-[#4A3728] truncate text-sm">{item.name}</p>
                  <p className="text-xs text-[#8B7355] mb-1.5">{item.category} · {item.condition}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#4A3728]">{item.points} pts</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === "Available" ? "bg-[#D8E4D0] text-[#4A6640]" : item.status === "Swapped" ? "bg-[#DDD8C8] text-[#6B5040]" : "bg-[#D4E0E8] text-[#2A5060]"}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
