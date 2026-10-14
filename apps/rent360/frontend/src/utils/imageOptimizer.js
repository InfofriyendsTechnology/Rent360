/**
 * Client-Side Image Optimizer & WebP Converter
 * Automatically compresses raw camera/gallery images and converts them to high-efficiency WebP format.
 */

export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Converts a File or Base64 Data URL to optimized WebP.
 * Resizes large dimensions to fit within maxWidth/maxHeight preserving aspect ratio.
 *
 * @param {File|string} source - File object or existing data URL
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Max width in pixels (default: 1600)
 * @param {number} options.maxHeight - Max height in pixels (default: 1600)
 * @param {number} options.quality - WebP quality 0.0 - 1.0 (default: 0.82)
 * @returns {Promise<Object>} { dataUrl, format, originalSizeBytes, compressedSizeBytes, savingsPercent, width, height }
 */
export const convertToWebP = (source, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82
  } = options;

  return new Promise((resolve, reject) => {
    let originalSizeBytes = 0;

    const processDataUrl = (srcDataUrl) => {
      // Approximate original base64 byte size
      if (!originalSizeBytes) {
        const base64Str = srcDataUrl.split(',')[1] || '';
        originalSizeBytes = Math.round((base64Str.length * 3) / 4);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context is not available'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format
        let webpDataUrl = canvas.toDataURL('image/webp', quality);

        // Fallback to JPEG if browser doesn't support WebP export (extremely rare)
        let actualFormat = 'webp';
        if (!webpDataUrl.startsWith('data:image/webp')) {
          webpDataUrl = canvas.toDataURL('image/jpeg', quality);
          actualFormat = 'jpeg';
        }

        const webpBase64 = webpDataUrl.split(',')[1] || '';
        const compressedSizeBytes = Math.round((webpBase64.length * 3) / 4);

        const savingsPercent = originalSizeBytes > compressedSizeBytes
          ? Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
          : 0;

        resolve({
          dataUrl: webpDataUrl,
          format: actualFormat,
          originalSizeBytes,
          compressedSizeBytes,
          originalSizeFormatted: formatBytes(originalSizeBytes),
          compressedSizeFormatted: formatBytes(compressedSizeBytes),
          savingsPercent,
          width,
          height
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for WebP compression'));
      };

      img.src = srcDataUrl;
    };

    if (source instanceof File || source instanceof Blob) {
      originalSizeBytes = source.size;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          processDataUrl(e.target.result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(source);
    } else if (typeof source === 'string') {
      processDataUrl(source);
    } else {
      reject(new Error('Invalid source type. Must be File, Blob or Data URL string'));
    }
  });
};

/**
 * Batch converts multiple files to WebP.
 *
 * @param {FileList|File[]} files - List of File objects
 * @param {Object} options - Compression options
 * @returns {Promise<Array>} List of converted results
 */
export const batchConvertToWebP = async (files, options = {}) => {
  const fileArray = Array.from(files || []);
  const results = [];

  for (const file of fileArray) {
    try {
      const converted = await convertToWebP(file, options);
      results.push({
        name: file.name,
        ...converted,
        success: true
      });
    } catch (err) {
      console.error(`Error converting ${file.name} to WebP:`, err);
      results.push({
        name: file.name,
        success: false,
        error: err.message
      });
    }
  }

  return results;
};
