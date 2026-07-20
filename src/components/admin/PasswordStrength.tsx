import { Check, X } from "lucide-react";
import { evaluatePassword } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";

interface Props {
  password: string;
  className?: string;
}

const PasswordStrength = ({ password, className }: Props) => {
  const { checks, score, label, color } = evaluatePassword(password);
  const segments = 5;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= score && password.length > 0 ? color : "bg-muted",
            )}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Fortaleza: <span className="font-medium text-foreground">{label}</span>
        </p>
      )}
      <ul className="space-y-1 text-xs">
        {checks.map((c) => (
          <li
            key={c.key}
            className={cn(
              "flex items-center gap-2",
              c.passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {c.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
