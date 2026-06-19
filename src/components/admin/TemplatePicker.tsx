import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareQuote, FileText } from "lucide-react";

type Template = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  category: string;
};

interface Props {
  /** Recipient email — opens mailto when a template is picked. */
  email?: string;
  /** Optional vars to interpolate in subject/body. Replace {{key}}. */
  vars?: Record<string, string>;
  triggerLabel?: string;
}

const interpolate = (text: string, vars?: Record<string, string>) => {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
};

const TemplatePicker = ({ email, vars, triggerLabel = "Plantilla" }: Props) => {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || templates.length > 0) return;
    setLoading(true);
    supabase
      .from("response_templates")
      .select("*")
      .order("category")
      .order("name")
      .then(({ data }) => {
        setTemplates((data as Template[]) || []);
        setLoading(false);
      });
  }, [open, templates.length]);

  const handlePick = (t: Template) => {
    const subject = encodeURIComponent(interpolate(t.subject || "", vars));
    const body = encodeURIComponent(interpolate(t.body, vars));
    if (email) {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    } else {
      navigator.clipboard?.writeText(interpolate(t.body, vars));
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquareQuote className="h-4 w-4 mr-1" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Respuesta rápida</p>
          <p className="text-xs text-muted-foreground">
            {email ? "Abre tu cliente de correo con la plantilla." : "Copia el texto al portapapeles."}
          </p>
        </div>
        <ScrollArea className="max-h-72">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Cargando…</div>
          ) : templates.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No hay plantillas. Créalas en Admin → Plantillas.
            </div>
          ) : (
            <ul className="py-1">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => handlePick(t)}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {t.subject || t.body.slice(0, 60)}
                    </p>
                    <span className="inline-block mt-1 text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {t.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default TemplatePicker;
