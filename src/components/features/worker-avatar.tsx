import { cldUrl } from "@/lib/cloudinary";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Optimized avatar/cover image with initials fallback. Plain <img> for tiny payload. */
export function WorkerImage({
  publicId,
  name,
  width = 480,
  height = 320,
  className,
  rounded = false,
}: {
  publicId?: string | null;
  name: string;
  width?: number;
  height?: number;
  className?: string;
  rounded?: boolean;
}) {
  if (!publicId) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-brand-gradient text-white",
          rounded ? "rounded-full" : "",
          className,
        )}
        aria-label={name}
      >
        <span className="text-2xl font-bold">{initials(name)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cldUrl(publicId, { width, height, crop: "fill" })}
      alt={name}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={cn("object-cover", rounded ? "rounded-full" : "", className)}
    />
  );
}
