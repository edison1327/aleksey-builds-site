import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, Shield, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface Reply {
  id: string;
  author_id: string | null;
  author_role: "admin" | "customer";
  author_name: string | null;
  body: string;
  is_internal?: boolean;
  created_at: string;
}

interface Props {
  messageId: string;
  currentUserId: string | null;
  currentUserName?: string | null;
  asRole: "admin" | "customer";
}

const replySchema = z.string().trim().min(1, "Escribe un mensaje").max(4000, "Máx 4000 caracteres");

const MessageThread = ({ messageId, currentUserId, currentUserName, asRole }: Props) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [internal, setInternal] = useState(false);
  const { toast } = useToast();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("message_replies")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true });
      if (active && !error) setReplies((data || []) as Reply[]);
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel(`thread-${messageId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_replies", filter: `message_id=eq.${messageId}` },
        (payload) => setReplies((prev) => [...prev, payload.new as Reply])
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [messageId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const send = async () => {
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      toast({ title: "Error", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await (supabase as any).from("message_replies").insert({
      message_id: messageId,
      author_id: currentUserId,
      author_role: asRole,
      author_name: currentUserName || null,
      body: parsed.data,
      is_internal: asRole === "admin" ? internal : false,
    });
    setSending(false);
    if (error) {
      toast({ title: "No se pudo enviar", description: error.message, variant: "destructive" });
      return;
    }
    setBody("");
    setInternal(false);
  };

  return (
    <div className="space-y-3">
      <div className="border rounded-lg bg-muted/30 p-3 max-h-[360px] overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : replies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin mensajes aún. Inicia la conversación.</p>
        ) : (
          replies.map((r) => {
            const mine = r.author_role === asRole;
            const isNote = !!r.is_internal;
            const bubbleClasses = isNote
              ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100"
              : mine
                ? "bg-primary text-primary-foreground"
                : "bg-card border";
            return (
              <div key={r.id} className={`flex ${isNote ? "justify-center" : mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${bubbleClasses}`}>
                  <div className="flex items-center gap-1 text-[10px] opacity-80 mb-1">
                    {isNote ? <StickyNote className="h-3 w-3" /> : r.author_role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span>
                      {isNote ? "Nota interna" : r.author_role === "admin" ? "Equipo Aleksey" : (r.author_name || "Cliente")}
                      {isNote && r.author_name ? ` · ${r.author_name}` : ""}
                    </span>
                    <span>· {format(new Date(r.created_at), "Pp", { locale: es })}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{r.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      {asRole === "admin" && (
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setInternal((v) => !v)}
            className={`px-2 py-1 rounded-full border transition-colors flex items-center gap-1 ${
              internal
                ? "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <StickyNote className="h-3 w-3" />
            {internal ? "Nota interna (solo equipo)" : "Mensaje al cliente"}
          </button>
          {internal && <span className="text-muted-foreground">El cliente no verá esto.</span>}
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={internal ? "Nota privada para el equipo..." : "Escribe tu mensaje..."}
          rows={2}
          maxLength={4000}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
        />
        <Button onClick={send} disabled={sending || !body.trim()} variant={internal ? "secondary" : "default"}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Ctrl/Cmd + Enter para enviar</p>
    </div>
  );
};

export default MessageThread;
