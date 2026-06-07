import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// POST /api/revalidate?secret=... — refresh public pages after admin moderation.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  revalidatePath("/workers");
  revalidatePath("/");
  const workerId = searchParams.get("worker");
  if (workerId) revalidatePath(`/workers/${workerId}`);

  return NextResponse.json({ revalidated: true });
}
