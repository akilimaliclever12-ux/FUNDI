"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { moderateReview } from "@/app/admin/actions";

export function AdminReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function act(status: "published" | "rejected") {
    startTransition(async () => {
      await moderateReview(reviewId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => act("published")} disabled={isPending} className="btn bg-whatsapp px-3 py-1.5 text-xs text-white">
        Publier
      </button>
      <button onClick={() => act("rejected")} disabled={isPending} className="btn bg-danger px-3 py-1.5 text-xs text-white">
        Rejeter
      </button>
    </div>
  );
}
