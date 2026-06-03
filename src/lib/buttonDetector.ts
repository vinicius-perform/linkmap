/**
 * Utility for automatic button detection in Link Bio background images
 * Uses projection-based edge density analysis in the browser canvas
 */

export interface DetectedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function detectButtons(imageBase64: string): Promise<DetectedBox[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageBase64;
    img.onload = () => {
      try {
        const targetWidth = 400;
        const aspect = img.height / img.width;
        const targetHeight = Math.round(targetWidth * aspect);

        // Create virtual canvas
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Cannot create canvas context"));
          return;
        }

        // Draw image downsampled to target dimensions for faster pixel scanning
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight).data;

        // 1. Convert to Grayscale
        const grayscale = new Uint8Array(targetWidth * targetHeight);
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          // Grayscale standard luminance weights
          grayscale[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        // 2. Compute Edge Gradients (simple Sobel-like magnitude)
        const gradients = new Float32Array(targetWidth * targetHeight);
        for (let y = 1; y < targetHeight - 1; y++) {
          for (let x = 1; x < targetWidth - 1; x++) {
            const idx = y * targetWidth + x;
            const gx = grayscale[idx + 1] - grayscale[idx - 1];
            const gy = grayscale[idx + targetWidth] - grayscale[idx - targetWidth];
            gradients[idx] = Math.sqrt(gx * gx + gy * gy);
          }
        }

        // 3. Compute Row edge densities to find vertical intervals containing buttons
        const rowDensities = new Float32Array(targetHeight);
        for (let y = 0; y < targetHeight; y++) {
          let sum = 0;
          for (let x = 0; x < targetWidth; x++) {
            sum += gradients[y * targetWidth + x];
          }
          rowDensities[y] = sum / targetWidth;
        }

        // 4. Smooth row densities using a moving average window to eliminate line noise
        const smoothRowDensities = new Float32Array(targetHeight);
        const windowSize = Math.max(5, Math.round(targetHeight * 0.015));
        for (let y = 0; y < targetHeight; y++) {
          let sum = 0;
          let count = 0;
          for (let w = -windowSize; w <= windowSize; w++) {
            const currY = y + w;
            if (currY >= 0 && currY < targetHeight) {
              sum += rowDensities[currY];
              count++;
            }
          }
          smoothRowDensities[y] = sum / count;
        }

        // 5. Find maximum row density and set threshold (e.g. 18% of max)
        let maxRowDensity = 0;
        for (let y = 0; y < targetHeight; y++) {
          if (smoothRowDensities[y] > maxRowDensity) {
            maxRowDensity = smoothRowDensities[y];
          }
        }
        const threshold = maxRowDensity * 0.18;

        // 6. Group rows above threshold into vertical intervals (candidates for buttons)
        const intervals: Array<{ yMin: number; yMax: number }> = [];
        let inInterval = false;
        let startY = 0;
        for (let y = 0; y < targetHeight; y++) {
          if (smoothRowDensities[y] > threshold) {
            if (!inInterval) {
              inInterval = true;
              startY = y;
            }
          } else {
            if (inInterval) {
              inInterval = false;
              intervals.push({ yMin: startY, yMax: y });
            }
          }
        }
        if (inInterval) {
          intervals.push({ yMin: startY, yMax: targetHeight - 1 });
        }

        // 7. For each vertical band, detect horizontal bounds (left/right)
        const boxes: DetectedBox[] = [];
        for (const interval of intervals) {
          const { yMin, yMax } = interval;
          const height = yMax - yMin + 1;

          // Filter out bands that are too small (e.g., smaller than 3% of screen height)
          if (height < targetHeight * 0.03) continue;

          // Calculate columns edge density inside this specific vertical band
          const colDensities = new Float32Array(targetWidth);
          for (let x = 0; x < targetWidth; x++) {
            let sum = 0;
            for (let y = yMin; y <= yMax; y++) {
              sum += gradients[y * targetWidth + x];
            }
            colDensities[x] = sum / height;
          }

          // Smooth column densities
          const smoothColDensities = new Float32Array(targetWidth);
          const colWindow = 6;
          for (let x = 0; x < targetWidth; x++) {
            let sum = 0;
            let count = 0;
            for (let w = -colWindow; w <= colWindow; w++) {
              const currX = x + w;
              if (currX >= 0 && currX < targetWidth) {
                sum += colDensities[currX];
                count++;
              }
            }
            smoothColDensities[x] = sum / count;
          }

          // Scan column density peaks to locate boundaries
          let maxColVal = 0;
          for (let x = 0; x < targetWidth; x++) {
            if (smoothColDensities[x] > maxColVal) {
              maxColVal = smoothColDensities[x];
            }
          }
          const colThreshold = maxColVal * 0.12;

          let xMin = 0;
          for (let x = 0; x < targetWidth; x++) {
            if (smoothColDensities[x] > colThreshold) {
              xMin = x;
              break;
            }
          }

          let xMax = targetWidth - 1;
          for (let x = targetWidth - 1; x >= 0; x--) {
            if (smoothColDensities[x] > colThreshold) {
              xMax = x;
              break;
            }
          }

          let finalXMin = xMin;
          let finalXMax = xMax;

          // Standardize width: if the detected horizontal region is too narrow,
          // assume it's just centered text inside a normal button,
          // so expand it to the standard centered button width (from 10% to 90%)
          const widthWidth = xMax - xMin;
          if (widthWidth < targetWidth * 0.4) {
            finalXMin = Math.round(targetWidth * 0.1);
            finalXMax = Math.round(targetWidth * 0.9);
          } else {
            // Add a little padding to the borders
            finalXMin = Math.max(0, finalXMin - 4);
            finalXMax = Math.min(targetWidth - 1, finalXMax + 4);
          }

          // Convert coordinates to percentages of original image size
          const xPercent = (finalXMin / targetWidth) * 100;
          const yPercent = (yMin / targetHeight) * 100;
          const wPercent = ((finalXMax - finalXMin) / targetWidth) * 100;
          const hPercent = (height / targetHeight) * 100;

          boxes.push({
            x: parseFloat(Math.max(0, Math.min(100, xPercent)).toFixed(2)),
            y: parseFloat(Math.max(0, Math.min(100, yPercent)).toFixed(2)),
            width: parseFloat(Math.max(0.5, Math.min(100, wPercent)).toFixed(2)),
            height: parseFloat(Math.max(0.5, Math.min(100, hPercent)).toFixed(2))
          });
        }

        resolve(boxes);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
}
