// End-to-end chat test against the live DB. Creates temp users, exercises RLS,
// triggers, and the customer<->worker round-trip, then cleans up.
// Run: node --env-file=.env.local scripts/test-chat.mjs
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = createClient(URL, SVC, { auth: { persistSession: false } });

const WORKER_ID = "54058615-d961-436a-aaee-832eb8743c39";
const WORKER_USER_ID = "c62c0484-e605-4ad8-9c40-acb4142fd32c";
const WORKER_EMAIL = "demo-worker@fundi.local";
const WPASS = "Worker-Test-123";
const CUST_EMAIL = "test-customer@fundi.local";
const CPASS = "Customer-Test-123";
const STRANGER_EMAIL = "test-stranger@fundi.local";
const SPASS = "Stranger-Test-123";

const ok = (b) => (b ? "✓" : "✗ FAIL");
let failures = 0;
const expect = (cond, label) => { console.log(`  ${ok(cond)} ${label}`); if (!cond) failures++; };

async function findUserId(email) {
  for (let page = 1; page <= 20; page++) {
    const { data } = await svc.auth.admin.listUsers({ page, perPage: 1000 });
    const u = data.users.find((x) => x.email === email);
    if (u) return u.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function ensureAuthUser(email, password) {
  const existing = await findUserId(email);
  if (existing) {
    await svc.auth.admin.updateUserById(existing, { password, email_confirm: true });
    return existing;
  }
  const { data: created, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return created.user.id;
}

async function signedClient(email, password) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return c;
}

console.log("== Schema ==");
for (const t of ["conversations", "messages"]) {
  const { error } = await svc.from(t).select("*", { count: "exact", head: true });
  expect(!error, `table ${t} exists`);
}

console.log("\n== Setup users ==");
await svc.auth.admin.updateUserById(WORKER_USER_ID, { password: WPASS, email_confirm: true });
const custId = await ensureAuthUser(CUST_EMAIL, CPASS);
const strangerId = await ensureAuthUser(STRANGER_EMAIL, SPASS);
await svc.from("users").upsert({ id: custId, role: "customer", full_name: "Test Client", phone: "+243990000777", email: CUST_EMAIL, is_phone_verified: true }, { onConflict: "id" });
await svc.from("users").upsert({ id: strangerId, role: "customer", full_name: "Intrus", phone: "+243990000888", email: STRANGER_EMAIL, is_phone_verified: true }, { onConflict: "id" });
console.log("  customer + worker + stranger ready");

const cust = await signedClient(CUST_EMAIL, CPASS);
const wrk = await signedClient(WORKER_EMAIL, WPASS);
const stranger = await signedClient(STRANGER_EMAIL, SPASS);

console.log("\n== Start conversation (customer, RLS insert) ==");
let convId;
{
  const { data: existing } = await cust.from("conversations").select("id").eq("worker_id", WORKER_ID).eq("customer_user_id", custId).maybeSingle();
  if (existing) { convId = existing.id; console.log("  reused existing conversation"); }
  else {
    // insert-then-select (see startConversation note)
    const { error } = await cust.from("conversations").insert({ worker_id: WORKER_ID, customer_user_id: custId });
    if (error) console.log("    insert error:", JSON.stringify(error));
    expect(!error, "customer created conversation");
    const { data: c } = await cust.from("conversations").select("id").eq("worker_id", WORKER_ID).eq("customer_user_id", custId).maybeSingle();
    convId = c?.id;
  }
  if (!convId) { console.log("\nAborting: no conversation id."); process.exit(1); }
}

console.log("\n== Customer sends message (RLS + trigger) ==");
{
  const { error } = await cust.from("messages").insert({ conversation_id: convId, sender_user_id: custId, body: "Bonjour, êtes-vous disponible demain matin ?" });
  expect(!error, "customer message inserted");
  const { data: c } = await svc.from("conversations").select("worker_unread, customer_unread, last_message_preview").eq("id", convId).single();
  expect(c.worker_unread >= 1, `worker_unread incremented (=${c.worker_unread})`);
  expect(!!c.last_message_preview, "last_message_preview set by trigger");
}

console.log("\n== Worker reads + replies ==");
{
  const { data: msgs } = await wrk.from("messages").select("body").eq("conversation_id", convId);
  expect((msgs?.length ?? 0) >= 1, `worker can read messages (RLS participant) (${msgs?.length})`);
  const { error } = await wrk.from("messages").insert({ conversation_id: convId, sender_user_id: WORKER_USER_ID, body: "Oui, demain matin ça me convient." });
  expect(!error, "worker reply inserted");
  const { data: c } = await svc.from("conversations").select("customer_unread").eq("id", convId).single();
  expect(c.customer_unread >= 1, `customer_unread incremented (=${c.customer_unread})`);
}

console.log("\n== RLS isolation (stranger must NOT access) ==");
{
  const { data: sConv } = await stranger.from("conversations").select("id").eq("id", convId);
  expect((sConv?.length ?? 0) === 0, "stranger cannot read the conversation");
  const { data: sMsgs } = await stranger.from("messages").select("id").eq("conversation_id", convId);
  expect((sMsgs?.length ?? 0) === 0, "stranger cannot read messages");
  const { error: sErr } = await stranger.from("messages").insert({ conversation_id: convId, sender_user_id: strangerId, body: "intrusion" });
  expect(!!sErr, "stranger blocked from posting a message");
}

console.log("\n== Lead logged with channel=chat ==");
{
  const { data: lead } = await svc.from("leads").insert({ worker_id: WORKER_ID, customer_user_id: custId, channel: "chat", source_page: "test" }).select("id").single();
  expect(!!lead, "lead with channel='chat' accepted (enum value present)");
  if (lead) await svc.from("leads").delete().eq("id", lead.id);
}

console.log("\n== Cleanup ==");
await svc.from("conversations").delete().eq("id", convId); // cascades messages
await svc.auth.admin.deleteUser(custId);
await svc.auth.admin.deleteUser(strangerId);
await svc.from("users").delete().in("id", [custId, strangerId]);
console.log("  removed test conversation + temp users");

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED ✓" : failures + " CHECK(S) FAILED ✗"}`);
process.exit(failures === 0 ? 0 : 1);
