/**
 * Converts any image file to a JPEG Blob scaled to max 1200px wide.
 *
 * Strategy:
 *  1. Try canvas (fast, works for JPEG/PNG/WebP natively in all browsers)
 *  2. If the browser can't decode the format (e.g. HEIC on Chrome),
 *     send the file to /api/convert-image which uses sharp on the server
 *     to handle HEIC, TIFF, and any other format.
 */

async function canvasToJpeg(source: Blob, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
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
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function toJpegBlob(file: File, quality = 0.85): Promise<Blob | null> {
  // Try browser canvas first (fast path for JPEG/PNG/WebP)
  const fromCanvas = await canvasToJpeg(file, quality);
  if (fromCanvas) return fromCanvas;

  // Canvas couldn't decode the format — use server-side sharp conversion
  // (handles HEIC, HEIF, TIFF, and any other format)
  return serverConvertToJpeg(file);
}
