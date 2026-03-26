/**
 * Converts any image file to a JPEG Blob scaled to max 1200px wide.
 *
 * Strategy:
 *  1. For HEIC/HEIF: use heic2any (pure-JS decoder, works in any browser, no size limit)
 *  2. Try createImageBitmap (uses platform native decoders — JPEG/PNG/WebP everywhere)
 *  3. Fall back to img element + canvas (older browsers)
 *  4. Last resort: server-side sharp conversion via /api/convert-image
 */

function isHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
}

async function heicToJpeg(file: File, quality: number): Promise<Blob | null> {
  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality });
    return Array.isArray(result) ? result[0] : result;
  } catch {
    return null;
  }
}

async function bitmapToJpeg(source: Blob, quality: number): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(source);
    if (!bitmap.width || !bitmap.height) { bitmap.close(); return null; }
    const scale = Math.min(1, 1200 / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return null; }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  } catch {
    return null;
  }
}

async function canvasToJpeg(source: Blob, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!img.naturalWidth || !img.naturalHeight) { resolve(null); return; }
      const scale = Math.min(1, 1200 / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(resolve, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function serverConvertToJpeg(file: File): Promise<Blob | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/convert-image", { method: "POST", body: form });
    if (!res.ok) {
      const text = await res.text().catch(() => res.status.toString());
      console.error("convert-image API error:", res.status, text);
      return null;
    }
    return await res.blob();
  } catch (err) {
    console.error("convert-image fetch error:", err);
    return null;
  }
}

export async function toJpegBlob(file: File, quality = 0.85): Promise<Blob | null> {
  // 1. HEIC/HEIF: use pure-JS heic2any (no browser support needed, no size limit)
  if (isHeic(file)) return heicToJpeg(file, quality);

  // 2. Try createImageBitmap — uses native platform decoders
  const fromBitmap = await bitmapToJpeg(file, quality);
  if (fromBitmap) return fromBitmap;

  // 3. Try img element + canvas fallback
  const fromCanvas = await canvasToJpeg(file, quality);
  if (fromCanvas) return fromCanvas;

  // 4. Server-side sharp conversion (last resort)
  return serverConvertToJpeg(file);
}
