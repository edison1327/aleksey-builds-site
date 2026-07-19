// Client-side image compression using canvas.
// Reduces upload size drastically for field photos (from ~4-8MB to ~200-500KB).

export type CompressOptions = {
  maxDim?: number;      // Max width/height in px
  quality?: number;     // JPEG quality 0-1
  mimeType?: string;    // Output MIME
};

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<{ blob: Blob; width: number; height: number; originalSize: number; compressedSize: number }> {
  const { maxDim = 1600, quality = 0.82, mimeType = "image/jpeg" } = opts;

  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }

  const bitmap = await createBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear canvas");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falló compresión"))),
      mimeType,
      quality,
    );
  });

  return {
    blob,
    width: w,
    height: h,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

async function createBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch { /* fallback below */ }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
