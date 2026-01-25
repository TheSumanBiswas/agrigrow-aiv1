export type ResizeOptions = {
  /** Longest side in pixels */
  maxSize: number;
  /** 0..1, only used for JPEG/WEBP */
  quality?: number;
  /** Output mime type */
  mimeType?: "image/jpeg" | "image/webp";
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Downscales and compresses an image file to reduce payload size for network calls.
 */
export async function fileToCompressedDataUrl(
  file: File,
  { maxSize, quality = 0.82, mimeType = "image/jpeg" }: ResizeOptions
): Promise<string> {
  const inputUrl = await readAsDataURL(file);
  const img = await loadImage(inputUrl);

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const scale = Math.min(1, maxSize / Math.max(w, h));
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Slightly better downscale quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Convert to JPEG/WEBP to greatly reduce size vs PNG
  return canvas.toDataURL(mimeType, quality);
}
