import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface I18nFieldProps {
  label: string;
  valueEs: string;
  valueEn: string;
  onChangeEs: (v: string) => void;
  onChangeEn: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholderEs?: string;
  placeholderEn?: string;
}

/**
 * Renders ES/EN inputs side-by-side for a translatable field.
 * EN is optional and falls back to ES at render time.
 */
export const I18nField = ({
  label,
  valueEs,
  valueEn,
  onChangeEs,
  onChangeEn,
  textarea = false,
  rows = 3,
  placeholderEs,
  placeholderEn = "Optional — falls back to ES",
}: I18nFieldProps) => {
  const Field = textarea ? Textarea : Input;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium">{label} (ES)</label>
        <Field
          value={valueEs || ""}
          onChange={(e: any) => onChangeEs(e.target.value)}
          rows={textarea ? rows : undefined}
          placeholder={placeholderEs}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{label} (EN)</label>
        <Field
          value={valueEn || ""}
          onChange={(e: any) => onChangeEn(e.target.value)}
          rows={textarea ? rows : undefined}
          placeholder={placeholderEn}
        />
      </div>
    </div>
  );
};

export default I18nField;
