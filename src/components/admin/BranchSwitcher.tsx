import { useBranch } from "@/hooks/useBranch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

export default function BranchSwitcher() {
  const { branches, currentBranchId, setCurrentBranchId, loading } = useBranch();
  if (loading || branches.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentBranchId ?? "__all__"}
        onValueChange={(v) => setCurrentBranchId(v === "__all__" ? null : v)}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="Sucursal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas las sucursales</SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}{b.city ? ` · ${b.city}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
