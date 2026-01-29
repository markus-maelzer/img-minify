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

      let pipeline = sharp(path.join(inputDir, img)).resize(
        width,
        height,
        sharpOptions
      );

      // Explicitly set format if it's not the original container we are just saving
      // Although toFile infers, explicit toFormat can apply format-specific optimizations
      if (targetFormat === 'webp') {
        pipeline = pipeline.webp();
      } else if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
        pipeline = pipeline.jpeg();
      } else if (targetFormat === 'png') {
        pipeline = pipeline.png();
      } else if (targetFormat === 'avif') {
        pipeline = pipeline.avif();
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
