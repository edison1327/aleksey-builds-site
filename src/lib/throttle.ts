/**
 * Lightweight client-side throttle for public form submissions.
 * Persists last-submit timestamps in localStorage to mitigate accidental
 * double-submits and reduce abuse. Not a security boundary — server-side
 * validation in edge functions and RLS remain the source of truth.
 */
const STORAGE_KEY = "form_submit_throttle";

type ThrottleMap = Record<string, number>;

const read = (): ThrottleMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ThrottleMap) : {};
  } catch {
    return {};
  }
};

const write = (map: ThrottleMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage full or unavailable — ignore
  }
};

export const getThrottleWait = (key: string, cooldownMs: number): number => {
  const map = read();
  const last = map[key] ?? 0;
  const elapsed = Date.now() - last;
  return elapsed >= cooldownMs ? 0 : Math.ceil((cooldownMs - elapsed) / 1000);
};

export const markSubmitted = (key: string) => {
  const map = read();
  map[key] = Date.now();
  write(map);
};
