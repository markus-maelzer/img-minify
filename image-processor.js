const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Process images in a directory
 * @param {string} inputDir - Directory containing images
 * @param {object} options - { width, height }
 * @param {function} onLog - Callback for status updates (msg) => void
 */
async function processImages(inputDir, options, onLog) {
  const width = parseInt(options.width) || 1080;
  const height = parseInt(options.height) || 1080;
  const outputDir = path.join(inputDir, 'processed');

  onLog(`Starting... Source: ${inputDir}`);

  if (!fs.existsSync(inputDir)) {
    onLog(`Error: Input directory does not exist.`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
    onLog(`Created output directory: ${outputDir}`);
  }

  try {
    const items = fs.readdirSync(inputDir);
    const validExtensions = /\.(gif|jpg|jpeg|tif|tiff|png|webp|jfif)$/i;
    const images = items.filter((item) => validExtensions.test(item));

    onLog(`Found ${images.length} images.`);

    for (const img of images) {
      // Logic derived from original app.js
      let nameParts = img.split('.');
      let baseName = nameParts[0];

      // Clean name based on original script regexes
      let cleanName = baseName
        .replace(/ /g, '')
        .replace(/\(/g, '')
        .replace(/Rezepte_/g, '')
        .replace(/\)/g, '');

      let targetFormat = options.format || 'webp';
      if (targetFormat === 'original') {
        const ext = path.extname(img).toLowerCase();
        // Remove dot for sharp format config availability check if needed,
        // but mainly need extension for filename.
        // If ext is .jpg, we want .jpg.
        // We'll trust sharp to handle the buffer/file correctly.
        targetFormat = ext.replace('.', '');
      }

      // Handle jpg/jpeg alias
      let finalExt = targetFormat;
      if (targetFormat === 'jpeg') finalExt = 'jpg';

      const finalName = `${cleanName}.${finalExt}`;

      const sharpOptions = {
        fit: options.fit || 'cover',
        background: options.background || 'transparent',
      };

      const q = parseInt(options.quality) || 80;

      let pipeline = sharp(path.join(inputDir, img));

      if (!options.keepDimensions) {
        pipeline = pipeline.resize(width, height, sharpOptions);
      }

      if (targetFormat === 'webp') {
        pipeline = pipeline.webp({ quality: q });
      } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
        pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
      } else if (targetFormat === 'png') {
        const compressionLevel = Math.round(9 - (q / 100) * 9);
        pipeline = pipeline.png({ compressionLevel });
      } else if (targetFormat === 'avif') {
        pipeline = pipeline.avif({ quality: q });
      }
      // If original/other, we rely on toFile or input format.

      await pipeline.toFile(path.join(outputDir, finalName));

      onLog(`Processed: ${finalName}`);
    }

    onLog('All finished!');
  } catch (err) {
    onLog(`Error: ${err.message}`);
    console.error(err);
  }
}

module.exports = { processImages };
