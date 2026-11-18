// projects/shared/src/lib/utils/image-processing.util.ts

import { mmToPixelWidth } from '@angular-shared';

export interface ProcessedReceiptImage {
  imageData: ImageData;
  width: number;
  height: number;
}

/**
 * Processes an image element or URL for ESC/POS thermal printers.
 * Automatically resizes to fit max width, enforces 8-pixel width divisibility,
 * and converts transparency to a solid white background.
 *
 * @param imageSource - HTMLImageElement or image URL
 * @param paperWidthMm - Paper width in millimeters
 * @param constraintWidth - Optional max width in pixels. If not provided, uses paperWidthMm.
 * @param constraintHeight - Optional max height in pixels. If not provided, aspect ratio is preserved.
 * @param horizontalPaddingPx - Safety margin on each side (default: 16px)
 */
export async function processReceiptImage(
  imageSource: HTMLImageElement | string,
  paperWidthMm: number,
  constraintWidth?: number,
  constraintHeight?: number,
  horizontalPaddingPx = 16,
): Promise<ProcessedReceiptImage> {
  const maxPrintWidthPx = constraintWidth ?? mmToPixelWidth(paperWidthMm);
  const effectiveMaxWidth = maxPrintWidthPx - horizontalPaddingPx * 2;

  const img = await loadImageSource(imageSource);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > effectiveMaxWidth) {
    const scale = effectiveMaxWidth / width;
    width = effectiveMaxWidth;
    height = Math.round(height * scale);
  }

  if (constraintHeight && height > constraintHeight) {
    const scale = constraintHeight / height;
    height = constraintHeight;
    width = Math.round(width * scale);
  }

  const widthRemainder = width % 8;
  if (widthRemainder !== 0) {
    width += 8 - widthRemainder;
  }

  const heightRemainder = height % 8;
  if (heightRemainder !== 0) {
    height += 8 - heightRemainder;
  }

  let canvasWidth = width + horizontalPaddingPx * 2;
  const canvasWidthRemainder = canvasWidth % 8;
  if (canvasWidthRemainder !== 0) {
    canvasWidth += 8 - canvasWidthRemainder;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to create canvas context.');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, height);
  ctx.drawImage(img, horizontalPaddingPx, 0, width, height);

  const imageData = ctx.getImageData(0, 0, canvasWidth, height);

  return {
    imageData,
    width: canvasWidth,
    height,
  };
}

function loadImageSource(source: HTMLImageElement | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement) {
      if (source.complete && source.naturalWidth > 0) {
        resolve(source);
      } else {
        source.onload = () => resolve(source);
        source.onerror = (err) => reject(err);
      }
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from source: ${source}`));
    img.src = source;
  });
}
