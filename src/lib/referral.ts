import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "aleksey_ref_code";

/** Capture ?ref=CODE from URL and persist for 30 days */
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && /^[A-Z0-9]{4,16}$/i.test(ref)) {
    const code = ref.toUpperCase();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ code, ts: Date.now() })
      );
    } catch {
      /* ignore */
    }
  }
}

/** Read stored referral code (null if none or expired) */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, ts } = JSON.parse(raw);
    if (!code || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Record a referral event tied to a contact message / email.
 * Safe to call as anon.
 */
export async function trackReferralUse(params: {
  email?: string | null;
  source?: string;
  contactMessageId?: string | null;
}) {
  const code = getStoredReferralCode();
  if (!code) return;

  // Find owner of the code
  const { data: owner } = await supabase
    .from("referral_codes")
    .select("user_id")
    .eq("code", code)
    .maybeSingle();

  if (!owner) return;

  await supabase.from("referrals").insert({
    referrer_user_id: owner.user_id,
    code_used: code,
    referred_email: params.email ?? null,
    source: params.source ?? "quote",
    contact_message_id: params.contactMessageId ?? null,
    status: "registered",
  });
}

/** Generate a random client-side code (fallback) */
function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Ensure the authenticated user has a referral code */
export async function ensureReferralCode(userId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.code;

  // Try a few times in the (rare) event of a collision on the UNIQUE index
  for (let i = 0; i < 5; i++) {
    const code = randomCode(8);
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({ user_id: userId, code })
      .select("code")
      .maybeSingle();
    if (data) return data.code;
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      console.error(error);
      return null;
    }
  }
  return null;
}

export function referralLink(code: string) {
  if (typeof window === "undefined") return `?ref=${code}`;
  return `${window.location.origin}/?ref=${code}`;
}
