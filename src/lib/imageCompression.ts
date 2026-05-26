/**
 * Compresses an image file before uploading to save storage space.
 * @param file The original image file
 * @param maxWidth The maximum width of the output image (default 1200)
 * @param quality The JPEG quality (0 to 1, default 0.7)
 * @returns A Promise that resolves to the compressed File object
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.7
): Promise<File> {
  // If the file is a GIF or non-image, just return it without compressing
  // (Canvas can't animate GIFs)
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob (always use JPEG for max compression)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create a new File object from the Blob
            // Ensure we change the extension to .jpg since we output jpeg
            const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFileName = `${originalNameWithoutExt}.jpg`;
            
            const compressedFile = new File([blob], newFileName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = (error) => {
        console.error("Error loading image for compression", error);
        resolve(file); // fallback to original file
      };
    };

    reader.onerror = (error) => {
      console.error("Error reading file for compression", error);
      resolve(file); // fallback to original file
    };
  });
}
