export interface PasswordCheck {
  key: string;
  label: string;
  passed: boolean;
}

export interface PasswordEvaluation {
  checks: PasswordCheck[];
  score: number; // 0-4
  label: string;
  color: string;
  valid: boolean;
}

const COMMON = new Set([
  "password", "12345678", "123456789", "qwerty123", "admin123",
  "password1", "password123", "abc12345", "111111111", "iloveyou",
  "welcome1", "aleksey123",
]);

export function evaluatePassword(pw: string): PasswordEvaluation {
  const checks: PasswordCheck[] = [
    { key: "len", label: "Mínimo 12 caracteres", passed: pw.length >= 12 },
    { key: "upper", label: "Una mayúscula (A-Z)", passed: /[A-Z]/.test(pw) },
    { key: "lower", label: "Una minúscula (a-z)", passed: /[a-z]/.test(pw) },
    { key: "num", label: "Un número (0-9)", passed: /\d/.test(pw) },
    { key: "sym", label: "Un símbolo (!@#$…)", passed: /[^A-Za-z0-9]/.test(pw) },
    { key: "common", label: "No es una contraseña común", passed: pw.length > 0 && !COMMON.has(pw.toLowerCase()) },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const valid = checks.every((c) => c.passed);

  // Score 0-4
  let score = 0;
  if (pw.length >= 8) score = 1;
  if (passed >= 4) score = 2;
  if (passed >= 5 && pw.length >= 12) score = 3;
  if (valid && pw.length >= 16) score = 4;

  const labels = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"];
  const colors = [
    "bg-destructive",
    "bg-destructive/80",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ];

  return { checks, score, label: labels[score], color: colors[score], valid };
}
