import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  isCompressed: boolean;
}

interface ImageUploadFieldProps {
  maxFiles?: number;
  maxSizeMB?: number;
  onImagesChange: (images: UploadedImage[]) => void;
  value?: UploadedImage[];
}

/**
 * 圖片壓縮函數
 * 將圖片壓縮到指定大小以下
 */
async function compressImage(
  file: File,
  maxSizeMB: number = 2
): Promise<{ file: File; isCompressed: boolean }> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // 如果檔案已經很小，直接返回
  if (file.size <= maxSizeBytes) {
    return { file, isCompressed: false };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // 計算縮放比例
        const maxDimension = 1920;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ file, isCompressed: false });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 逐步降低質量直到達到目標大小
        let quality = 0.9;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ file, isCompressed: false });
                return;
              }

              if (blob.size <= maxSizeBytes || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve({ file: compressedFile, isCompressed: true });
              } else {
                quality -= 0.1;
                compress();
              }
            },
            "image/jpeg",
            quality
          );
        };

        compress();
      };
    };
  });
}

export function ImageUploadField({
  maxFiles = 5,
  maxSizeMB = 5,
  onImagesChange,
  value = [],
}: ImageUploadFieldProps) {
  const [images, setImages] = useState<UploadedImage[]>(value);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newFiles = Array.from(files);
      const remainingSlots = maxFiles - images.length;

      if (newFiles.length > remainingSlots) {
        toast.error(`最多只能上傳 ${maxFiles} 張圖片`);
        return;
      }

      setIsCompressing(true);

      try {
        const processedImages: UploadedImage[] = [];

        for (const file of newFiles) {
          // 驗證檔案類型
          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} 不是有效的圖片檔案`);
            continue;
          }

          // 壓縮圖片
          const { file: compressedFile, isCompressed } = await compressImage(
            file,
            maxSizeMB
          );

          // 建立預覽
          const preview = URL.createObjectURL(compressedFile);

          processedImages.push({
            id: `${Date.now()}-${Math.random()}`,
            file: compressedFile,
            preview,
            isCompressed,
          });

          if (isCompressed) {
            toast.success(
              `${file.name} 已壓縮至 ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
            );
          }
        }

        const updatedImages = [...images, ...processedImages];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      } catch (error) {
        console.error("[ImageUpload] Error processing images:", error);
        toast.error("圖片處理失敗");
      } finally {
        setIsCompressing(false);
      }
    },
    [images, maxFiles, maxSizeMB, onImagesChange]
  );

  const handleRemoveImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    // 清理預覽 URL
    const removed = images.find((img) => img.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.preview);
    }
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* 上傳區域 */}
      {images.length < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30"
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isCompressing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drag and drop images here</p>
              <p className="text-xs text-muted-foreground">
                or click to select files
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} images, {maxSizeMB}MB each
            </p>
          </div>

          {isCompressing && (
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <p className="text-sm text-white font-medium">Compressing...</p>
            </div>
          )}
        </div>
      )}

      {/* 圖片預覽 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group bg-muted rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* 索引標籤 */}
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* 壓縮標籤 */}
              {image.isCompressed && (
                <div className="absolute top-1 right-1 bg-green-600/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Compressed
                </div>
              )}

              {/* 移除按鈕 */}
              <button
                onClick={() => handleRemoveImage(image.id)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上傳進度 */}
      {images.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {images.length} / {maxFiles} images selected
        </div>
      )}
    </div>
  );
}
