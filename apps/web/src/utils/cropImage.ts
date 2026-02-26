// apps/web/src/utils/cropImage.ts

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  outputSize = 400,
  bgColor = '#e5e7eb',
): Promise<{ dataUrl: string; mimeType: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  // Fill background (visible when image is zoomed out / doesn't fill crop)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, outputSize, outputSize);

  // Calculate source and destination coordinates
  // When restrictPosition is false, pixelCrop can have negative x/y
  // meaning the crop area extends beyond the image bounds
  const scale = outputSize / pixelCrop.width;

  const sx = Math.max(0, pixelCrop.x);
  const sy = Math.max(0, pixelCrop.y);
  const dx = Math.max(0, -pixelCrop.x) * scale;
  const dy = Math.max(0, -pixelCrop.y) * scale;

  const sw = Math.min(pixelCrop.width - Math.max(0, -pixelCrop.x), image.width - sx);
  const sh = Math.min(pixelCrop.height - Math.max(0, -pixelCrop.y), image.height - sy);
  const dw = sw * scale;
  const dh = sh * scale;

  if (sw > 0 && sh > 0) {
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return { dataUrl, mimeType: 'image/jpeg' };
}

/** Render an emoji on a colored background to a base64 image */
export async function renderEmojiToImage(
  emoji: string,
  bgColor: string,
  outputSize = 400,
): Promise<{ dataUrl: string; mimeType: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  // Draw circular background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw emoji centered
  ctx.font = `${outputSize * 0.55}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, outputSize / 2, outputSize / 2 + outputSize * 0.03);

  const dataUrl = canvas.toDataURL('image/png');
  return { dataUrl, mimeType: 'image/png' };
}

/** Render an SVG icon on a colored background to a base64 image */
export async function renderIconToImage(
  svgHtml: string,
  bgColor: string,
  outputSize = 400,
): Promise<{ dataUrl: string; mimeType: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  // Draw circular background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // Render SVG to image
  const iconSize = outputSize * 0.5;
  const svgWithSize = svgHtml
    .replace(/width="[^"]*"/, `width="${iconSize}"`)
    .replace(/height="[^"]*"/, `height="${iconSize}"`)
    .replace(/stroke="[^"]*"/g, 'stroke="white"');

  const svgBlob = new Blob([svgWithSize], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await createImage(url);
    const x = (outputSize - iconSize) / 2;
    const y = (outputSize - iconSize) / 2;
    ctx.drawImage(img, x, y, iconSize, iconSize);
  } finally {
    URL.revokeObjectURL(url);
  }

  const dataUrl = canvas.toDataURL('image/png');
  return { dataUrl, mimeType: 'image/png' };
}

/** Render an SVG illustration URL to a base64 image */
export async function renderSvgToImage(
  svgUrl: string,
  outputSize = 400,
): Promise<{ dataUrl: string; mimeType: string }> {
  const img = await createImage(svgUrl);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0, outputSize, outputSize);

  const dataUrl = canvas.toDataURL('image/png');
  return { dataUrl, mimeType: 'image/png' };
}

const SHOPPING_MAX_WIDTH = 1000;
const SHOPPING_MAX_HEIGHT = 1333;

/** Resize a shopping catalog image to fit within 1000×1333, no upscale */
export async function resizeShoppingImage(
  file: File,
): Promise<{ dataUrl: string; mimeType: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await createImage(url);
    const { naturalWidth: w, naturalHeight: h } = img;

    // If already within bounds, just return the original as a data URL
    if (w <= SHOPPING_MAX_WIDTH && h <= SHOPPING_MAX_HEIGHT) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, mimeType: file.type });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Scale to fit inside max bounds while maintaining aspect ratio
    const scale = Math.min(SHOPPING_MAX_WIDTH / w, SHOPPING_MAX_HEIGHT / h);
    const newW = Math.round(w * scale);
    const newH = Math.round(h * scale);

    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, newW, newH);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return { dataUrl, mimeType: 'image/jpeg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}
