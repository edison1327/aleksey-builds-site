import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Plus, Hash, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_private: boolean;
  created_by: string | null;
};

type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
};

export default function AdminChat() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_channels")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) toast.error("Error cargando canales");
    else {
      setChannels(data || []);
      if (data && data.length && !activeId) setActiveId(data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel_id", activeId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled) setMessages(data || []);
    })();

    const channel = supabase
      .channel(`chat-msgs-${activeId}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${activeId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const active = useMemo(() => channels.find((c) => c.id === activeId), [channels, activeId]);

  const send = async () => {
    if (!input.trim() || !activeId || !userId) return;
    setSending(true);
    // Ensure membership
    await supabase
      .from("chat_channel_members")
      .upsert({ channel_id: activeId, user_id: userId }, { onConflict: "channel_id,user_id" });
    const { error } = await supabase
      .from("chat_messages")
      .insert({ channel_id: activeId, user_id: userId, content: input.trim() });
    if (error) toast.error(error.message);
    else setInput("");
    setSending(false);
  };

  const createChannel = async () => {
    if (!newName.trim() || !userId) return;
    const { data, error } = await supabase
      .from("chat_channels")
      .insert({ name: newName.trim(), description: newDesc.trim() || null, created_by: userId, type: "general" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await supabase
      .from("chat_channel_members")
      .insert({ channel_id: data.id, user_id: userId, role: "admin" });
    toast.success("Canal creado");
    setNewName("");
    setNewDesc("");
    setNewOpen(false);
    setActiveId(data.id);
    loadChannels();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      <Card className="p-3 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Canales</h3>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost"><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo canal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nombre del canal" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Textarea placeholder="Descripción (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <DialogFooter>
                <Button onClick={createChannel}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin canales aún</p>
          ) : (
            <div className="space-y-1">
              {channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-2 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-accent transition ${
                    activeId === c.id ? "bg-accent font-medium" : ""
                  }`}
                >
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        {active ? (
          <>
            <div className="border-b p-3">
              <div className="font-semibold flex items-center gap-2"><Hash className="h-4 w-4" /> {active.name}</div>
              {active.description && <p className="text-xs text-muted-foreground">{active.description}</p>}
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aún no hay mensajes. Escribe el primero.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.user_id === userId ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${m.user_id === userId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <p className="text-[10px] opacity-70 mt-1">
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <div className="border-t p-3 flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Escribe un mensaje..."
                rows={2}
                className="flex-1 resize-none"
              />
              <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="h-auto">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Selecciona o crea un canal</p>
          </div>
        )}
      </Card>
    </div>
  );
}
