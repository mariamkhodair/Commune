/**
 * Converts any image file (including HEIC/HEIF) to a JPEG Blob,
 * scaled down to a max width of 1200px.
 *
 * Strategy:
 *  1. Known HEIC/HEIF → heic2any → canvas resize → JPEG
 *  2. All other formats → canvas → JPEG
 *  3. If canvas fails (unknown format, no MIME type) → heic2any → canvas → JPEG
 */

async function canvasToJpeg(source: Blob, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1200 / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      canvas.toBlob(resolve, "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function heicToJpeg(file: Blob, quality: number): Promise<Blob | null> {
  try {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality });
    return Array.isArray(out) ? out[0] : out;
  } catch {
    return null;
  }
}

export async function toJpegBlob(file: File, quality = 0.85): Promise<Blob | null> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name);

  if (isHeic) {
    const converted = await heicToJpeg(file, quality);
    if (!converted) return null;
    return canvasToJpeg(converted, quality);
  }

  // Try canvas directly for JPEG/PNG/WebP etc.
  const result = await canvasToJpeg(file, quality);
  if (result) return result;

  // Canvas failed (possibly HEIC with wrong/missing MIME type) — try heic2any
  const converted = await heicToJpeg(file, quality);
  if (!converted) return null;
  return canvasToJpeg(converted, quality);
}
