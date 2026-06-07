import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHOTOS_BUCKET, buildPhotoPath, publicPhotoUrl } from "@/lib/storage";

// POST /api/upload/sign — return a signed Supabase Storage upload URL.
// Requires an authenticated user. The service role signs the URL so the
// browser can upload directly without needing storage RLS policies.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { ext?: string; index?: number } = {};
  try {
    body = await request.json();
  } catch {
    // optional body
  }

  const path = buildPhotoPath(user.id, body.ext ?? "jpg", body.index ?? 0);

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: "sign failed" }, { status: 500 });
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    publicUrl: publicPhotoUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, data.path),
  });
}
