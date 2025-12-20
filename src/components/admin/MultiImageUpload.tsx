import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Image as ImageIcon, GripVertical } from "lucide-react";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
}

const MultiImageUpload = ({ value = [], onChange, folder = "gallery", maxImages = 10 }: MultiImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxImages) {
      toast({
        title: "Límite alcanzado",
        description: `Máximo ${maxImages} imágenes permitidas.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("site-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("site-images")
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      onChange([...value, ...newUrls]);
      toast({ title: "Éxito", description: `${newUrls.length} imagen(es) subida(s).` });
    } catch (error) {
      console.error("Error uploading:", error);
      toast({ title: "Error", description: "No se pudieron subir las imágenes.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [value, onChange, folder, maxImages, toast]);

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    const newUrls = [...value];
    const [removed] = newUrls.splice(fromIndex, 1);
    newUrls.splice(toIndex, 0, removed);
    onChange(newUrls);
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
            >
              <img
                src={url}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {value.length < maxImages && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arrastra imágenes o <span className="text-primary">haz clic para subir</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {value.length}/{maxImages} imágenes
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
};

export default MultiImageUpload;
