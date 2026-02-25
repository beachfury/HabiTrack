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
    image.src = url;
  });
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  outputSize = 400,
): Promise<{ dataUrl: string; mimeType: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

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
