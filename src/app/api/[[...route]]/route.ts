import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

app.post("/email", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const raw = (body as { email?: unknown } | null)?.email;
  if (typeof raw !== "string") {
    return c.json({ error: "Email is required" }, 400);
  }
  const email = raw.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return c.json({ error: "Invalid email format" }, 400);
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const ip = clientIp(c.req.raw);

  // 已存在则 DO NOTHING（保留原 signup_ip / created_at）；不存在则插入
  const { error: insertError } = await supabase
    .from("users")
    .upsert(
      { email, last_active_at: now, signup_ip: ip },
      { onConflict: "email", ignoreDuplicates: true }
    );

  if (insertError) {
    console.error("[/api/email] insert failed", insertError);
    return c.json({ error: "Database error" }, 500);
  }

  // 已存在的用户单独更新 last_active_at
  const { data, error: updateError } = await supabase
    .from("users")
    .update({ last_active_at: now })
    .eq("email", email)
    .select("id")
    .single();

  if (updateError) {
    console.error("[/api/email] update failed", updateError);
    return c.json({ error: "Database error" }, 500);
  }

  return c.json({ ok: true, id: data.id });
});

export const GET = handle(app);
export const POST = handle(app);
