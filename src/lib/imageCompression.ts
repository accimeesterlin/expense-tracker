/**
 * Client-side image compression utility
 * Compresses images to reduce file size while maintaining quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: "jpeg" | "png" | "webp";
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

/**
 * Compresses an image file to reduce its size
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeKB = 4000, // 4MB in KB
    format = "jpeg",
  } = options;

  const originalSize = file.size;

  try {
    // If file is already small enough, return as-is
    if (originalSize <= maxSizeKB * 1024) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        success: true,
      };
    }

    // Create canvas for image processing
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    // Load image
    const img = new Image();
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });

    img.src = URL.createObjectURL(file);
    await imageLoadPromise;

    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = img;

    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;

      if (width > height) {
        width = Math.min(width, maxWidth);
        height = width / aspectRatio;
      } else {
        height = Math.min(height, maxHeight);
        width = height * aspectRatio;
      }
    }

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw and compress image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob with compression
    const mimeType = `image/${format}`;
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            throw new Error("Failed to compress image");
          }
        },
        mimeType,
        quality
      );
    });

    // Create new file from compressed blob
    const compressedFile = new File([blob], file.name, {
      type: mimeType,
      lastModified: Date.now(),
    });

    const compressedSize = compressedFile.size;
    const compressionRatio = compressedSize / originalSize;

    // Clean up
    URL.revokeObjectURL(img.src);

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      success: true,
    };
  } catch (error) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown compression error",
    };
  }
}

/**
 * Validates if a file is an image that can be compressed
 */
export function canCompressImage(file: File): boolean {
  return (
    file.type.startsWith("image/") &&
    ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
  );
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Gets compression suggestions based on file size
 */
export function getCompressionSuggestions(fileSize: number): string[] {
  const suggestions: string[] = [];
  const sizeMB = fileSize / (1024 * 1024);

  if (sizeMB > 4) {
    suggestions.push("File is too large for upload (over 4MB)");
    suggestions.push("Try reducing image quality or dimensions");
  } else if (sizeMB > 2) {
    suggestions.push("File is quite large - compression recommended");
    suggestions.push("Consider reducing image quality for faster upload");
  } else if (sizeMB > 1) {
    suggestions.push("File size is acceptable but could be optimized");
  }

  return suggestions;
}
