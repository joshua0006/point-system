import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useUploadServiceImage } from "@/hooks/useServiceOperations";
import { ImageIcon, Upload, X, Loader2 } from '@/lib/icons';
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadServiceImage();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({ file });
      onChange(result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  if (value) {
    return (
      <div className="relative">
        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
          <img
            src={value}
            alt="Service image"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragging && "border-primary bg-primary/5",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <div className="space-y-4">
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading image...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload service image</p>
              <p className="text-xs text-muted-foreground">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to 10MB
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" disabled={disabled}>
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
          </>
        )}
      </div>
    </div>
  );
}