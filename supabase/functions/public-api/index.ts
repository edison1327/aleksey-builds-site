// Public REST API gated by API keys stored in public.api_keys
// Endpoints:
//   GET  /public-api/invoices
//   GET  /public-api/work-orders
//   GET  /public-api/bookings
//   POST /public-api/bookings   { machinery_id, start_date, end_date, notes? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Naive in-memory rate limiter per api_key_id
const rlBuckets = new Map<string, { count: number; resetAt: number }>();
function checkRate(keyId: string, limitPerMin: number): boolean {
  const now = Date.now();
  const b = rlBuckets.get(keyId);
  if (!b || now > b.resetAt) {
    rlBuckets.set(keyId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (b.count >= limitPerMin) return false;
  b.count++;
  return true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logUsage(
  apiKeyId: string | null,
  endpoint: string,
  method: string,
  status: number,
  ms: number,
  req: Request,
) {
  try {
    await admin.from("api_usage_log").insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      status_code: status,
      response_ms: ms,
      ip: req.headers.get("x-forwarded-for") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    });
    if (apiKeyId) {
      await admin.rpc("exec_sql" as never).catch(() => {});
      await admin
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKeyId);
    }
  } catch {
    /* swallow */
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const url = new URL(req.url);
  // path is /public-api/<resource>[/...]
  const parts = url.pathname.replace(/^\/+/, "").split("/");
  // ["public-api","invoices"] etc
  const resource = parts[1] ?? "";

  const rawKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!rawKey) {
    await logUsage(null, resource, req.method, 401, Date.now() - started, req);
    return json({ error: "missing_api_key" }, 401);
  }

  const { data: verified, error: vErr } = await admin.rpc("verify_api_key", {
    _raw_key: rawKey,
  });
  if (vErr || !verified || verified.length === 0) {
    await logUsage(null, resource, req.method, 401, Date.now() - started, req);
    return json({ error: "invalid_api_key" }, 401);
  }
  const key = verified[0] as {
    id: string;
    owner_user_id: string;
    scopes: string[];
    rate_limit_per_min: number;
  };

  if (!checkRate(key.id, key.rate_limit_per_min)) {
    await logUsage(key.id, resource, req.method, 429, Date.now() - started, req);
    return json({ error: "rate_limited" }, 429);
  }

  const requireScope = (s: string) => key.scopes.includes(s);

  try {
    // GET /invoices
    if (resource === "invoices" && req.method === "GET") {
      if (!requireScope("read:invoices")) return json({ error: "forbidden" }, 403);
      const { data, error } = await admin
        .from("invoices")
        .select("id,invoice_number,status,total,currency,issue_date,due_date")
        .eq("customer_user_id", key.owner_user_id)
        .order("issue_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      await logUsage(key.id, resource, req.method, 200, Date.now() - started, req);
      return json({ data });
    }

    // GET /work-orders
    if (resource === "work-orders" && req.method === "GET") {
      if (!requireScope("read:work_orders")) return json({ error: "forbidden" }, 403);
      const { data, error } = await admin
        .from("work_orders")
        .select("id,order_number,status,scheduled_start,scheduled_end,description")
        .eq("customer_user_id", key.owner_user_id)
        .order("scheduled_start", { ascending: false })
        .limit(100);
      if (error) throw error;
      await logUsage(key.id, resource, req.method, 200, Date.now() - started, req);
      return json({ data });
    }

    // GET /bookings
    if (resource === "bookings" && req.method === "GET") {
      if (!requireScope("read:bookings")) return json({ error: "forbidden" }, 403);
      const { data, error } = await admin
        .from("equipment_bookings")
        .select("id,machinery_id,start_date,end_date,status,notes")
        .eq("customer_user_id", key.owner_user_id)
        .order("start_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      await logUsage(key.id, resource, req.method, 200, Date.now() - started, req);
      return json({ data });
    }

    // POST /bookings
    if (resource === "bookings" && req.method === "POST") {
      if (!requireScope("write:bookings")) return json({ error: "forbidden_scope" }, 403);
      const body = await req.json().catch(() => ({}));
      const { machinery_id, start_date, end_date, notes } = body ?? {};
      if (!machinery_id || !start_date || !end_date) {
        return json({ error: "missing_fields" }, 400);
      }
      const { data, error } = await admin
        .from("equipment_bookings")
        .insert({
          machinery_id,
          start_date,
          end_date,
          notes: notes ?? null,
          status: "pending",
          customer_user_id: key.owner_user_id,
        })
        .select()
        .single();
      if (error) throw error;
      await logUsage(key.id, resource, req.method, 201, Date.now() - started, req);
      return json({ data }, 201);
    }

    await logUsage(key.id, resource, req.method, 404, Date.now() - started, req);
    return json({ error: "not_found" }, 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    await logUsage(key.id, resource, req.method, 500, Date.now() - started, req);
    return json({ error: msg }, 500);
  }
});
