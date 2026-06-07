import { WorkerCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-6">
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <WorkerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
