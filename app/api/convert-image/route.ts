import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const jpeg = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    return new NextResponse(jpeg.buffer as ArrayBuffer, {
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (err) {
    console.error("convert-image error:", err);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
