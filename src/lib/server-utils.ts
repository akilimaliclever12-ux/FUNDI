import "server-only";
import crypto from "crypto";

/** Hash an IP (with salt) for abuse throttling — never store raw IPs. */
export function hashIp(ip: string): string {
  const salt = process.env.REVALIDATE_SECRET || "fundi-salt";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

/** Best-effort client IP from request headers. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
