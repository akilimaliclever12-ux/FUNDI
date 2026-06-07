import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leadSchema } from "@/lib/validations/lead";
import { getClientIp, hashIp } from "@/lib/server-utils";

// POST /api/leads — log a contact intent (WhatsApp/call/form). Fire-and-forget.
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ip = getClientIp(request.headers);

  const { error } = await supabase.from("leads").insert({
    worker_id: parsed.data.worker_id,
    channel: parsed.data.channel,
    source_page: parsed.data.source_page ?? null,
    customer_phone: parsed.data.customer_phone ?? null,
    message: parsed.data.message ?? null,
    customer_user_id: user?.id ?? null,
    ip_hash: ip ? hashIp(ip) : null,
    user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "insert failed" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
