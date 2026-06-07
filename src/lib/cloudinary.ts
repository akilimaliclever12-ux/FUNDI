// Cloudinary helpers. Server signing + URL transforms for low-bandwidth delivery.

import crypto from "crypto";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Build an optimized delivery URL from a Cloudinary public_id.
 * Applies f_auto (format), q_auto (quality), and an optional width.
 */
export function cldUrl(
  publicId: string,
  opts: { width?: number; height?: number; crop?: string } = {},
): string {
  const tx = ["f_auto", "q_auto"];
  if (opts.width) tx.push(`w_${opts.width}`);
  if (opts.height) tx.push(`h_${opts.height}`);
  if (opts.crop) tx.push(`c_${opts.crop}`);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${tx.join(",")}/${publicId}`;
}

/**
 * Server-side signature for a direct (signed) upload from the browser.
 * Never expose CLOUDINARY_API_SECRET to the client.
 */
export function signUpload(params: Record<string, string | number>): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
} {
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const timestamp = Math.floor(Date.now() / 1000);

  const toSign = { ...params, timestamp };
  const sorted = Object.keys(toSign)
    .sort()
    .map((k) => `${k}=${toSign[k as keyof typeof toSign]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(sorted + apiSecret)
    .digest("hex");

  return { signature, timestamp, apiKey, cloudName: CLOUD_NAME! };
}
