import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUploadAvatar } from "@/hooks/useAvatarUpload";
import { Camera, Upload, X, Loader2 } from '@/lib/icons';
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  userId: string;
  fallbackText?: string;
}

export function AvatarUpload({ value, onChange, disabled, userId, fallbackText }: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAvatar();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({ file, userId });
      onChange(result.url);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
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
    onChange('');
  };

  // Show current avatar if exists
  if (value) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={value} />
            <AvatarFallback className="text-lg">
              {fallbackText}
            </AvatarFallback>
          </Avatar>
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Camera className="w-4 h-4 mr-2" />
            Change Photo
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={cn(
          "relative w-24 h-24 border-2 border-dashed rounded-full flex items-center justify-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
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
        
        {uploadMutation.isPending ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <div className="flex flex-col items-center space-y-1">
            <Camera className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground text-center">
              Add Photo
            </span>
          </div>
        )}
      </div>
      
      {!disabled && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WebP up to 10MB
          </p>
        </div>
      )}
    </div>
  );
}