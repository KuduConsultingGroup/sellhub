import { useState, useRef, useCallback } from "react";
import { Upload, X, Link as LinkIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  onRemove?: () => void;
  aspectRatio?: "square" | "wide";
  maxSizeMB?: number;
  multiple?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export const ImageUpload = ({ 
  value, 
  onChange, 
  onRemove,
  aspectRatio = "square",
  maxSizeMB = 5,
  multiple = false
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToStorage = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Simulate progress for better UX (Supabase doesn't provide native progress)
    const progressInterval = setInterval(() => {
      onProgress?.(Math.min(90, Math.random() * 30 + 60));
    }, 200);

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      onProgress?.(100);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate all files first
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        toast.error(`${file.name} exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    setUploadProgress(initialProgress);

    // Upload all files in parallel
    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        const url = await uploadToStorage(file, (progress) => {
          setUploadProgress(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], progress };
            return updated;
          });
        });

        setUploadProgress(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: 'completed', url };
          return updated;
        });

        return url;
      } catch (error: any) {
        setUploadProgress(prev => {
          const updated = [...prev];
          updated[index] = { 
            ...updated[index], 
            status: 'failed', 
            error: error.message 
          };
          return updated;
        });
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUrls = results.filter((url): url is string => url !== null);

    if (successfulUrls.length > 0) {
      if (multiple) {
        const currentUrls = Array.isArray(value) ? value : value ? [value] : [];
        onChange([...currentUrls, ...successfulUrls]);
      } else {
        onChange(successfulUrls[0]);
      }
      toast.success(`${successfulUrls.length} image(s) uploaded successfully`);
    }

    // Clear progress after 2 seconds
    setTimeout(() => setUploadProgress([]), 2000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  }, [multiple, value]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setUrlInputOpen(false);
      toast.success("Image URL added");
    }
  };

  const aspectClass = aspectRatio === "square" ? "aspect-square" : "aspect-video";
  const displayValue = Array.isArray(value) ? value[0] : value;
  const isUploading = uploadProgress.length > 0 && uploadProgress.some(p => p.status === 'uploading');

  if (displayValue && !multiple) {
    return (
      <div className={`relative w-full ${aspectClass} border rounded-xl overflow-hidden group`}>
        <img
          src={displayValue}
          alt="Product"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full"
          >
            <Upload className="h-4 w-4 mr-1" />
            Change
          </Button>
          {onRemove && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onRemove}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-full ${aspectClass} border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading {uploadProgress.length} file(s)...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop {multiple ? 'images' : 'image'} here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP up to {maxSizeMB}MB {multiple && '(multiple files supported)'}
              </p>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
          multiple={multiple}
        />
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2 p-3 border rounded-xl bg-background/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Upload Progress</p>
          {uploadProgress.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate flex-1 mr-2">{item.file.name}</span>
                {item.status === 'uploading' && (
                  <span className="text-muted-foreground">{Math.round(item.progress)}%</span>
                )}
                {item.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {item.status === 'failed' && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              {item.status === 'uploading' && (
                <Progress value={item.progress} className="h-1" />
              )}
              {item.status === 'failed' && item.error && (
                <p className="text-xs text-destructive">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={urlInputOpen} onOpenChange={setUrlInputOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Or add image URL
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image URL</DialogTitle>
            <DialogDescription>
              Enter the URL of an image hosted elsewhere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUrlInputOpen(false);
                  setUrlInput("");
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleUrlSubmit}>
                Add Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
