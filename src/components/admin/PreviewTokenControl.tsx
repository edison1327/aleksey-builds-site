import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Copy, X, Loader2 } from "lucide-react";

interface Props {
  table: "blog_posts" | "projects";
  id: string;
  slug?: string;
  currentToken: string | null;
  onChange: (token: string | null) => void;
}

/**
 * Generate / copy / revoke a public preview token for a draft.
 * The token is appended as ?preview=<uuid> to the public URL so anyone with
 * the link can view the draft (RLS only returns rows that have a token set).
 */
const PreviewTokenControl = ({ table, id, slug, currentToken, onChange }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const previewUrl = currentToken
    ? table === "blog_posts" && slug
      ? `${baseUrl}/blog/${slug}?preview=${currentToken}`
      : `${baseUrl}/proyectos?preview=${currentToken}&id=${id}`
    : null;

  const generate = async () => {
    setBusy(true);
    const token = crypto.randomUUID();
    const { error } = await supabase.from(table).update({ preview_token: token }).eq("id", id);
    setBusy(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    onChange(token);
    toast({ title: "Enlace de vista previa generado" });
  };

  const revoke = async () => {
    setBusy(true);
    const { error } = await supabase.from(table).update({ preview_token: null }).eq("id", id);
    setBusy(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    onChange(null);
    toast({ title: "Enlace revocado" });
  };

  const copy = async () => {
    if (!previewUrl) return;
    await navigator.clipboard.writeText(previewUrl);
    toast({ title: "Enlace copiado al portapapeles" });
  };

  if (!currentToken) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={generate}
        disabled={busy}
        aria-label="Generar enlace de vista previa público"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
        Generar preview
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={copy} aria-label="Copiar enlace de vista previa">
        <Copy className="h-3.5 w-3.5 mr-1" />
        Copiar preview
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={revoke}
        disabled={busy}
        title="Revocar enlace"
        aria-label="Revocar enlace de vista previa"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5 text-destructive" />}
      </Button>
    </div>
  );
};

export default PreviewTokenControl;
