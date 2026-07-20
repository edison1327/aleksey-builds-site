import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Sparkles, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assistant`;

const SUGGESTIONS = [
  "¿Cuántos mensajes nuevos tengo?",
  "Resumen financiero del mes",
  "¿Qué stock está bajo?",
  "¿Cuántas OTs abiertas hay?",
  "Top proveedores actuales",
  "¿Hay postulaciones pendientes?",
];

const INITIAL: Message = {
  role: "assistant",
  content: "Hola 👋 Soy tu asistente IA interno. Puedo darte resúmenes en tiempo real sobre ventas, OTs, inventario, proveedores, RRHH y más. ¿Qué necesitas saber?",
};

export default function AdminAssistant() {
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const userMsg: Message = { role: "user", content: q };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    let acc = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión no encontrada");

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg].filter(m => m.role !== "assistant" || m.content).map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error del asistente");
      }

      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl).replace(/\r$/, "");
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data: ")) continue;
          const js = line.slice(6).trim();
          if (js === "[DONE]") break;
          try {
            const parsed = JSON.parse(js);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages((p) => {
                const cp = [...p];
                const last = cp[cp.length - 1];
                if (last?.role === "assistant") last.content = acc;
                return cp;
              });
            }
          } catch { /* incomplete chunk */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Error");
      setMessages((p) => p.filter(m => m.content));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Asistente IA interno
          </CardTitle>
          <CardDescription>
            Consulta datos operativos en tiempo real: ventas, OTs, inventario, proveedores, RRHH.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMessages([INITIAL])} disabled={loading}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reiniciar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[500px] border rounded-lg p-4 bg-muted/20">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="bg-primary/10 p-1.5 rounded-full h-fit shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-background border rounded-bl-md"
                )}>
                  {m.content || (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="bg-secondary p-1.5 rounded-full h-fit shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pregunta sobre tu operación..."
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          IA con acceso a datos operativos actualizados. Solo administradores.
        </p>
      </CardContent>
    </Card>
  );
}
