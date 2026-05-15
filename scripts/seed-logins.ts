/**
 * Seed login accounts for the demo data.
 *
 *   • 1 super-admin account  → can access /admin
 *   • 10 member accounts     → each linked to a seeded profile (profiles.user_id)
 *
 * Run AFTER `npm run db:seed`:  npm run db:seed:logins
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Idempotent: re-uses existing auth users / re-links profiles on re-run.
 *
 * NOTE: these are throwaway demo credentials. Do NOT ship to production.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Database } from "../src/lib/database.types";

// ── env loader (same minimal approach as seed.ts) ──────────────────────
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(resolve(process.cwd(), file), "utf8").split("\n")) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* optional */
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient<Database>(url, key, { auth: { persistSession: false } });

// ── credentials (demo only) ────────────────────────────────────────────
const PASSWORD = "HassanKhel@2026"; // shared across all demo accounts
const ADMIN_EMAIL = "admin@hassankhel.test";
const memberEmail = (n: number) => `member${String(n).padStart(2, "0")}@hassankhel.test`;

/** Create the auth user, or reuse it if the email already exists. */
async function ensureUser(
  email: string,
  fullName: string,
): Promise<string> {
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true, // no SMTP needed — usable immediately
    user_metadata: { full_name: fullName },
  });
  if (created?.user) return created.user.id;

  // Already registered → look it up and reset the password so it's known.
  if (error && /registered|already/i.test(error.message)) {
    const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users.find((u) => u.email === email);
    if (existing) {
      await db.auth.admin.updateUserById(existing.id, {
        password: PASSWORD,
        email_confirm: true,
      });
      return existing.id;
    }
  }
  throw error ?? new Error(`could not create ${email}`);
}

async function main() {
  // The 10 profiles created by `npm run db:seed`, oldest first.
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, full_name_en")
    .like("bio_en", "%[seed]%")
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!profiles?.length) {
    console.error("✗ No seeded profiles found. Run `npm run db:seed` first.");
    process.exit(1);
  }

  const rows: { role: string; email: string; member: string }[] = [];

  // ── Member logins, one per seeded profile ────────────────────────────
  console.log(`→ Creating ${profiles.length} member logins…`);
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    const email = memberEmail(i + 1);
    const uid = await ensureUser(email, p.full_name_en);
    const { error: linkErr } = await db
      .from("profiles")
      .update({ user_id: uid, email })
      .eq("id", p.id);
    if (linkErr) throw linkErr;
    rows.push({ role: "member", email, member: p.full_name_en });
    console.log(`  ✓ ${email}  →  ${p.full_name_en}`);
  }

  // ── Super-admin login ────────────────────────────────────────────────
  console.log("→ Creating super-admin login…");
  const adminId = await ensureUser(ADMIN_EMAIL, "Site Administrator");
  const { error: adminErr } = await db
    .from("admin_users")
    .upsert({ user_id: adminId, role: "super_admin" });
  if (adminErr) throw adminErr;
  rows.push({ role: "super_admin", email: ADMIN_EMAIL, member: "— (admin only)" });
  console.log(`  ✓ ${ADMIN_EMAIL}  →  super_admin`);

  // ── Summary ──────────────────────────────────────────────────────────
  console.log(`\n✓ Done. Shared password for every account:  ${PASSWORD}\n`);
  console.table(rows);
  console.log("\nSign in at /en/login or /ur/login. Admin can open /en/admin.");
}

main().catch((e) => {
  console.error("✗ seed-logins failed:", e);
  process.exit(1);
});
