// One-off setup: verify schema + create the first admin.
// Run: node --env-file=.env.local scripts/setup-admin.mjs <email> [password]
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
let password = process.argv[3];

if (!url || !serviceKey) {
  console.error("Missing Supabase env vars. Use: node --env-file=.env.local ...");
  process.exit(1);
}
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/setup-admin.mjs <email> [password]");
  process.exit(1);
}
if (!password) {
  // generate a strong temporary password
  password = "Fundi-" + crypto.randomBytes(9).toString("base64url");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EXPECTED = [
  "users",
  "professions",
  "locations",
  "workers",
  "worker_photos",
  "reviews",
  "leads",
  "job_requests",
  "admin_users",
  "audit_logs",
];

async function verifyTables() {
  console.log("\n== Verifying tables ==");
  let allOk = true;
  for (const t of EXPECTED) {
    const { count, error } = await admin
      .from(t)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ✗ ${t.padEnd(16)} ERROR: ${error.message}`);
      allOk = false;
    } else {
      console.log(`  ✓ ${t.padEnd(16)} rows=${count ?? 0}`);
    }
  }
  return allOk;
}

async function verifySeed() {
  console.log("\n== Seed data ==");
  const { data: profs } = await admin.from("professions").select("slug").order("sort_order");
  console.log(`  professions (${profs?.length ?? 0}): ${(profs ?? []).map((p) => p.slug).join(", ")}`);
  const { data: locs } = await admin.from("locations").select("slug,type");
  const byType = {};
  (locs ?? []).forEach((l) => (byType[l.type] = (byType[l.type] ?? 0) + 1));
  console.log(`  locations: ${JSON.stringify(byType)}`);
}

async function createAdmin() {
  console.log("\n== Creating admin ==");

  // 1) find or create the auth user
  let userId = null;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    // likely already exists — look it up
    console.log(`  auth.createUser: ${createErr.message} — looking up existing user…`);
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) {
      console.error("  ✗ Could not create or find the auth user.");
      process.exit(1);
    }
    userId = found.id;
    console.log(`  ✓ Found existing auth user: ${userId}`);
    // ensure a known password so login works
    await admin.auth.admin.updateUserById(userId, { password });
    console.log("  ✓ Password reset to the value below.");
  } else {
    userId = created.user.id;
    console.log(`  ✓ Created auth user: ${userId}`);
  }

  // 2) upsert into admin_users
  const { error: insErr } = await admin.from("admin_users").upsert(
    {
      id: userId,
      full_name: "Akilimali Clever",
      email,
      admin_role: "super_admin",
      is_active: true,
    },
    { onConflict: "id" },
  );
  if (insErr) {
    console.error(`  ✗ admin_users upsert failed: ${insErr.message}`);
    process.exit(1);
  }
  console.log("  ✓ admin_users row ready (super_admin).");

  console.log("\n========================================");
  console.log("  ADMIN LOGIN CREDENTIALS");
  console.log("  URL:      /admin-login");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("========================================");
  console.log("  ⚠ Change this password after first login.\n");
}

const tablesOk = await verifyTables();
await verifySeed();
if (!tablesOk) {
  console.error("\nSome tables are missing. Did all migrations run? Aborting admin creation.");
  process.exit(1);
}
await createAdmin();
