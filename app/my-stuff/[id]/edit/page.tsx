"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { toJpegBlob } from "@/lib/imageUtils";
import { useLang } from "@/lib/languageContext";

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

const brandsByCategory: Record<string, string[]> = {
  "Apparel": ["Adidas", "Bershka", "Calvin Klein", "H&M", "Levi's", "Mango", "Massimo Dutti", "Nike", "Pull&Bear", "Puma", "Ralph Lauren", "Tommy Hilfiger", "Zara"],
  "Electronics": ["Apple", "Asus", "Bose", "Canon", "Dell", "HP", "Huawei", "JBL", "Lenovo", "LG", "Nikon", "Samsung", "Sony", "Xiaomi"],
  "Books": ["AUC Press", "Dar El Shorouk", "HarperCollins", "Penguin", "Random House", "Simon & Schuster", "Oxford University Press"],
  "Cosmetics": ["Benefit", "Charlotte Tilbury", "Chanel", "Clinique", "Dior", "Fenty Beauty", "Huda Beauty", "L'Oréal", "MAC", "Maybelline", "NARS", "NYX", "Urban Decay"],
  "Furniture & Home Decor": ["IKEA", "H&M Home", "Pottery Barn", "West Elm", "Zara Home"],
  "Stationery & Art Supplies": ["Copic", "Faber-Castell", "Moleskine", "Muji", "Pilot", "Prismacolor", "Staedtler", "Winsor & Newton"],
  "Miscellaneous": [],
};

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useUser();
  const { t, isRTL } = useLang();

  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Existing photo URLs to keep
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  // New photos added during edit
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    customBrand: "",
    condition: "",
    description: "",
  });
  const [points, setPoints] = useState<number | null>(null);
  const [manualPoints, setManualPoints] = useState("");
  const [pointsMode, setPointsMode] = useState<"ai" | "manual">("manual");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    async function loadItem() {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) { setNotFound(true); setFetching(false); return; }

      setExistingPhotos(data.photos ?? []);
      const knownBrand = data.brand && brandsByCategory[data.category]?.includes(data.brand);
      setForm({
        name: data.name ?? "",
        category: data.category ?? "",
        brand: knownBrand ? data.brand : (data.brand ? "Other" : ""),
        customBrand: knownBrand ? "" : (data.brand ?? ""),
        condition: data.condition ?? "",
        description: data.description ?? "",
      });
      setPoints(data.points ?? null);
      setManualPoints(String(data.points ?? ""));
      setFetching(false);
    }
    loadItem();
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (name === "category") {
      setForm({ ...form, category: value, brand: "", customBrand: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleFiles(files: FileList | File[]) {
    await Promise.all(Array.from(files).map(async (file) => {
      const jpeg = await toJpegBlob(file);
      if (!jpeg) { alert("Couldn't process this image. Please try a different file."); return; }
      const jpegFile = new File([jpeg], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(jpeg);
      setNewPhotoPreviews((prev) => [...prev, previewUrl]);
      setNewPhotoFiles((prev) => [...prev, jpegFile]);
    }));
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewPhoto(index: number) {
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  async function handleAnalyse() {
    setAnalyzing(true);
    try {
      const brand = form.brand === "Other" ? form.customBrand : form.brand;
      const res = await fetch("/api/analyze-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, brand, category: form.category, condition: form.condition, description: form.description }),
      });
      const data = await res.json();
      if (data.points) { setPoints(data.points); setManualPoints(String(data.points)); }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!userId || !points) return;
    setSaving(true);
    setSaveError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setSaveError("Not logged in."); setSaving(false); return; }

      // Upload new photos
      const newlyUploadedUrls: string[] = [];
      for (let i = 0; i < newPhotoFiles.length; i++) {
        const file = newPhotoFiles[i];
        const path = `${userId}/${Date.now()}_${i}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
        if (uploadError) { setSaveError("Failed to upload photo. Please try again."); setSaving(false); return; }
        const { data: { publicUrl } } = supabase.storage.from("item-photos").getPublicUrl(path);
        newlyUploadedUrls.push(publicUrl);
      }

      const finalPhotos = [...existingPhotos, ...newlyUploadedUrls];
      const brand = form.brand === "Other" ? form.customBrand : form.brand;

      const res = await fetch("/api/edit-item", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          itemId: id,
          name: form.name,
          category: form.category,
          brand,
          condition: form.condition,
          description: form.description,
          points,
          photos: finalPhotos,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body.error ?? "Failed to save changes.");
        setSaving(false);
        return;
      }

      router.push("/my-stuff");
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const totalPhotos = existingPhotos.length + newPhotoPreviews.length;
  const formComplete = totalPhotos > 0 && form.name && form.category && form.condition && form.description;
  const canSave = formComplete && points !== null;

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#4A3728] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir={isRTL ? "rtl" : "ltr"}>
        <p className="text-[#8B7355]">{t("item.notFound")}</p>
        <Link href="/my-stuff" className="text-[#4A3728] underline">{t("common.back")}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-4 px-8 py-5 border-b border-[#D9CFC4] bg-white/60 backdrop-blur-sm">
        <Link href="/my-stuff" className="text-[#8B7355] hover:text-[#4A3728] transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-light text-[#4A3728] font-[family-name:var(--font-jost)]">{t("item.editItem")}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#6B5040]">{t("newItem.photos")}</label>
            <span className="text-xs text-[#A09080]">{t("newItem.photosAdded", { n: totalPhotos })}</span>
          </div>

          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="grid grid-cols-3 gap-2">
            {existingPhotos.map((src, i) => (
              <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-[#EDE8DF]">
                <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && existingPhotos.length + newPhotoPreviews.length > 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-[#4A3728]/70 text-white px-1.5 py-0.5 rounded-full">{t("newItem.photoCover")}</span>
                )}
                <button
                  onClick={() => removeExistingPhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#4A3728]/70 text-white flex items-center justify-center hover:bg-[#4A3728] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {newPhotoPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-[#EDE8DF]">
                <img src={src} alt={`New photo ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[10px] bg-[#7A9E6E]/80 text-white px-1.5 py-0.5 rounded-full">New</span>
                <button
                  onClick={() => removeNewPhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#4A3728]/70 text-white flex items-center justify-center hover:bg-[#4A3728] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[#D9CFC4] bg-white/50 hover:border-[#4A3728] hover:bg-[#FAF7F2] flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="2" strokeLinecap="round" className="w-6 h-6 mb-1">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <p className="text-xs text-[#A09080] text-center px-1">{t("newItem.addMore")}</p>
            </div>

            <div
              onClick={() => cameraInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[#D9CFC4] bg-white/50 hover:border-[#4A3728] hover:bg-[#FAF7F2] flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="2" strokeLinecap="round" className="w-6 h-6 mb-1">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <p className="text-xs text-[#A09080] text-center px-1">{t("newItem.camera")}</p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#6B5040]">{t("newItem.itemName")}</label>
          <input
            name="name" type="text" value={form.name} onChange={handleChange}
            className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#6B5040]">{t("newItem.category")}</label>
          <select name="category" value={form.category} onChange={handleChange}
            className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
          >
            <option value="" disabled>{t("newItem.selectCategory")}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Brand */}
        {form.category && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#6B5040]">{t("newItem.brandOptional")}</label>
            <select name="brand" value={form.brand} onChange={handleChange}
              className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] focus:outline-none focus:border-[#4A3728] transition-colors appearance-none"
            >
              <option value="">{t("newItem.selectBrand")}</option>
              {(brandsByCategory[form.category] ?? []).map((b) => <option key={b} value={b}>{b}</option>)}
              <option value="Other">{t("newItem.brandOther")}</option>
            </select>
            {form.brand === "Other" && (
              <input
                name="customBrand" type="text" placeholder={t("newItem.brandNamePlaceholder")} value={form.customBrand} onChange={handleChange}
                className="mt-2 rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              />
            )}
          </div>
        )}

        {/* Condition */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#6B5040]">{t("newItem.condition")}</label>
          <div className="flex gap-2 flex-wrap">
            {conditions.map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, condition: c })}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${form.condition === c ? "bg-[#4A3728] text-[#F5F0E8] border-[#4A3728]" : "border-[#D9CFC4] text-[#6B5040] hover:border-[#4A3728]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[#6B5040]">{t("newItem.description")}</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={5}
            className="rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors resize-none"
          />
        </div>

        {/* Points */}
        <div className="flex flex-col gap-3">
          <label className="text-sm text-[#6B5040]">{t("newItem.pointsValue")}</label>

          <div className="flex rounded-xl border border-[#D9CFC4] overflow-hidden">
            <button type="button" onClick={() => setPointsMode("ai")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${pointsMode === "ai" ? "bg-[#4A3728] text-[#F5F0E8]" : "bg-white/50 text-[#6B5040] hover:bg-[#FAF7F2]"}`}
            >
              {t("newItem.aiAnalysis")}
            </button>
            <button type="button" onClick={() => setPointsMode("manual")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${pointsMode === "manual" ? "bg-[#4A3728] text-[#F5F0E8]" : "bg-white/50 text-[#6B5040] hover:bg-[#FAF7F2]"}`}
            >
              {t("newItem.setMyOwn")}
            </button>
          </div>

          {pointsMode === "ai" ? (
            <button onClick={handleAnalyse} disabled={!formComplete || analyzing}
              className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3.5 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {analyzing ? t("newItem.analysing") : points !== null ? `${points} ${t("common.pts")} — ${t("newItem.analyseBtn")}` : t("newItem.analyseBtn")}
            </button>
          ) : (
            <div className="flex gap-3 items-center">
              <input type="number" min="1" placeholder={t("newItem.enterPoints")} value={manualPoints}
                onChange={(e) => { setManualPoints(e.target.value); setPoints(e.target.value ? parseInt(e.target.value) : null); }}
                className="flex-1 rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] px-4 py-3 text-[#4A3728] placeholder:text-[#C4B9AA] focus:outline-none focus:border-[#4A3728] transition-colors"
              />
            </div>
          )}
        </div>

        {saveError && <p className="text-sm text-[#A0624A] text-center">{saveError}</p>}

        <div className="flex flex-col gap-3 pt-2">
          <button onClick={handleSave} disabled={!canSave || saving}
            className="w-full rounded-full bg-[#4A3728] text-[#F5F0E8] py-3.5 font-semibold hover:bg-[#6B5040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? t("profile.saving") : t("newItem.saveChanges")}
          </button>
          <Link href="/my-stuff"
            className="w-full rounded-full border border-[#D9CFC4] text-[#6B5040] py-3.5 font-medium hover:border-[#4A3728] transition-colors text-center"
          >
            {t("common.cancel")}
          </Link>
        </div>

      </div>
    </div>
  );
}
