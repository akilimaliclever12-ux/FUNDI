import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signUpload } from "@/lib/cloudinary";

// POST /api/upload/sign — return signed Cloudinary upload params.
// Requires an authenticated user (worker onboarding / dashboard).
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "fundi/workers";
  const { signature, timestamp, apiKey, cloudName } = signUpload({ folder });

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}
