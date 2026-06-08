// Feature flags (public — safe for the client bundle).

/**
 * Whether phone/SMS OTP login is available. Set NEXT_PUBLIC_SMS_ENABLED=true
 * once an SMS provider is configured in Supabase Auth. Defaults to off, so the
 * UI offers email login only and never dead-ends on a missing SMS provider.
 */
export const SMS_ENABLED = process.env.NEXT_PUBLIC_SMS_ENABLED === "true";
