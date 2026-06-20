import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCheck } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "user";
}

// Module-level cache so we don't re-hit the function for every row
let cache: AdminUser[] | null = null;
let inflight: Promise<AdminUser[]> | null = null;

const loadAdmins = async (): Promise<AdminUser[]> => {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      inflight = null;
      return [];
    }
    cache = ((data?.users || []) as AdminUser[]).filter((u) => u.role === "admin");
    inflight = null;
    return cache;
  })();
  return inflight;
};

interface Props {
  table: "contact_messages" | "job_applications";
  rowId: string;
  value: string | null;
  onChange?: (v: string | null) => void;
  className?: string;
}

const AssigneeSelect = ({ table, rowId, value, onChange, className }: Props) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadAdmins().then((list) => { if (active) setAdmins(list); });
    return () => { active = false; };
  }, []);

  const update = async (next: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from(table)
      .update({ assigned_to: next })
      .eq("id", rowId);
    setSaving(false);
    if (!error) onChange?.(next);
  };

  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => update(v === "none" ? null : v)}
      disabled={saving}
    >
      <SelectTrigger className={className ?? "h-8 text-xs gap-1"}>
        <UserCheck className="h-3.5 w-3.5 opacity-70" />
        <SelectValue placeholder="Sin asignar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sin asignar</SelectItem>
        {admins.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AssigneeSelect;
