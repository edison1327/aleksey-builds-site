import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocations";

interface Props {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  allowNone?: boolean;
  placeholder?: string;
  onlyActive?: boolean;
}

const NONE = "__none__";

export default function LocationSelect({
  value,
  onChange,
  allowNone = true,
  placeholder = "Selecciona una sede",
  onlyActive = false,
}: Props) {
  const { locations, loading } = useLocations(onlyActive);

  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? null : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Cargando…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>— Sin sede —</SelectItem>}
        {locations.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {l.name}
            {l.city ? ` · ${l.city}` : ""}
            {l.is_primary ? " ★" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
