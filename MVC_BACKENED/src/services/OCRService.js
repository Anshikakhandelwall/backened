import Tesseract  from 'tesseract.js';
import sharp      from 'sharp';
import path       from 'path';
import fs         from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Preprocess image for better OCR accuracy ───────────────────────────
export const preprocessImage = async (inputPath) => {
  const outputPath = inputPath.replace(/\.[^.]+$/, '_processed.png');

  await sharp(inputPath)
    .greyscale()                    // convert to grayscale
    .normalize()                    // stretch contrast
    .sharpen()                      // sharpen edges
    .resize({ width: 2000, withoutEnlargement: false }) // upscale if small
    .toFile(outputPath);

  return outputPath;
};

// ── Run Tesseract OCR on image ─────────────────────────────────────────
export const extractTextFromImage = async (imagePath) => {
  console.log('Running OCR on:', imagePath);

  const { data: { text } } = await Tesseract.recognize(
    imagePath,
    'eng',
    {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\rOCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    }
  );

  console.log('\nOCR complete. Raw text length:', text.length);
  return text;
};

// ── Clean up temp preprocessed file ───────────────────────────────────
export const cleanupProcessed = (processedPath) => {
  try {
    if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
  } catch {}
};