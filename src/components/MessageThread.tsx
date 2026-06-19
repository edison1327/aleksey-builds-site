import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, Shield } from "lucide-react";
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
    });
    setSending(false);
    if (error) {
      toast({ title: "No se pudo enviar", description: error.message, variant: "destructive" });
      return;
    }
    setBody("");
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
            return (
              <div key={r.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                  <div className="flex items-center gap-1 text-[10px] opacity-80 mb-1">
                    {r.author_role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span>{r.author_role === "admin" ? "Equipo Aleksey" : (r.author_name || "Cliente")}</span>
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
      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu mensaje..."
          rows={2}
          maxLength={4000}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
        />
        <Button onClick={send} disabled={sending || !body.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Ctrl/Cmd + Enter para enviar</p>
    </div>
  );
};

export default MessageThread;
