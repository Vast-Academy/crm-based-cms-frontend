// Image compression utility
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.8,
      maxSizeKB = 500
    } = options;

    // If file is already small enough and within dimensions, return as is
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const processImage = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }

          // Create new File object
          const compressedFile = new File(
            [blob],
            file.name,
            {
              type: file.type,
              lastModified: Date.now()
            }
          );

          // If still too large, try with lower quality
          if (compressedFile.size > maxSizeKB * 1024 && quality > 0.3) {
            compressImage(file, {
              ...options,
              quality: quality - 0.1
            }).then(resolve).catch(reject);
          } else {
            resolve(compressedFile);
          }
        },
        file.type,
        quality
      );
    };

    img.onload = processImage;
    img.onerror = () => {
      reject(new Error('Image loading failed'));
    };

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Clean up object URL when done
    img.onload = () => {
      processImage();
      URL.revokeObjectURL(objectUrl);
    };
  });
};