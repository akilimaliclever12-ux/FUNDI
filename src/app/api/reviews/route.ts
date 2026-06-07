import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validations/review";

// POST /api/reviews — submit a review. Lands as `pending` for moderation.
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("reviews").insert({
    worker_id: parsed.data.worker_id,
    author_name: parsed.data.author_name,
    author_phone: parsed.data.author_phone || null,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
    author_user_id: user?.id ?? null,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: "insert failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
