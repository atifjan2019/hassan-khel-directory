/**
 * Seed script — populates the Hassan Khel directory with realistic demo data:
 *   • 10 approved profiles forming a 4-generation patrilineal family tree
 *   • 3 news posts (one pinned)
 *   • 2 photo albums with photos
 *
 * Run:  npm run db:seed
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Idempotent: clears prior seeded rows (by a stable marker) before inserting.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Database } from "../src/lib/database.types";

// ── Minimal .env.local loader (no extra dependency) ────────────────────
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of txt.split("\n")) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* file optional */
    }
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Copy .env.example to .env.local and fill them in.",
  );
  process.exit(1);
}

const db = createClient<Database>(url, key, {
  auth: { persistSession: false },
});

const SEED_TAG = "[seed]"; // marker stored in bio_en to allow re-runs

const img = (s: string) => `https://picsum.photos/seed/${s}/1200/800`;

async function main() {
  console.log("→ Clearing previous seed data…");
  await db.from("album_photos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("albums").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("news_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db.from("profiles").delete().like("bio_en", `%${SEED_TAG}%`);

  console.log("→ Inserting profiles (generation by generation)…");

  // Helper: insert one profile, return its new id.
  async function add(p: {
    honorific?: string;
    full_name_en: string;
    full_name_ur: string;
    father_name_en: string;
    father_name_ur: string;
    grandfather_name_en?: string;
    profession: string;
    qualification?: string;
    qualification_level?: string;
    institute?: string;
    current_city?: string;
    house_area?: string;
    bio_en: string;
    bio_ur: string;
    father_profile_id?: string | null;
    is_deceased?: boolean;
    latitude?: number;
    longitude?: number;
  }): Promise<string> {
    const { data, error } = await db
      .from("profiles")
      .insert({
        ...p,
        bio_en: `${p.bio_en} ${SEED_TAG}`,
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("insert failed");
    return data.id;
  }

  // Generation 1 — eldest known ancestors
  const sherBahadur = await add({
    honorific: "Haji",
    full_name_en: "Sher Bahadur",
    full_name_ur: "شیر بہادر",
    father_name_en: "Gul Bacha",
    father_name_ur: "گل بچہ",
    profession: "farmer",
    qualification_level: "none",
    current_city: "Hassan Khel",
    house_area: "Bala Kalay",
    bio_en: "A respected elder of the village who tended the family lands and served on the jirga for decades.",
    bio_ur: "گاؤں کے ایک معزز بزرگ جنہوں نے خاندانی زمینوں کی دیکھ بھال کی اور دہائیوں تک جرگے میں خدمات انجام دیں۔",
    is_deceased: true,
    latitude: 34.1459,
    longitude: 71.7301,
  });

  const fazleKarim = await add({
    honorific: "Master",
    full_name_en: "Fazle Karim",
    full_name_ur: "فضلِ کریم",
    father_name_en: "Painda Khan",
    father_name_ur: "پائندہ خان",
    profession: "teacher",
    qualification: "BA, B.Ed",
    qualification_level: "bachelor",
    institute: "University of Peshawar",
    current_city: "Hassan Khel",
    house_area: "Kandao",
    bio_en: "Retired schoolteacher who taught two generations of village children to read.",
    bio_ur: "ریٹائرڈ اسکول استاد جنہوں نے گاؤں کے بچوں کی دو نسلوں کو پڑھنا سکھایا۔",
    latitude: 34.1447,
    longitude: 71.7325,
  });

  // Generation 2 — sons of Sher Bahadur
  const abdulRahim = await add({
    honorific: "Maulana",
    full_name_en: "Abdul Rahim",
    full_name_ur: "عبد الرحیم",
    father_name_en: "Sher Bahadur",
    father_name_ur: "شیر بہادر",
    grandfather_name_en: "Gul Bacha",
    profession: "religious_scholar",
    qualification: "Dars-e-Nizami",
    qualification_level: "religious",
    institute: "Jamia Darul Uloom",
    current_city: "Hassan Khel",
    house_area: "Bala Kalay",
    bio_en: "Imam of the central mosque and a teacher of the Quran to village youth.",
    bio_ur: "مرکزی مسجد کے امام اور گاؤں کے نوجوانوں کو قرآن پڑھانے والے۔",
    father_profile_id: sherBahadur,
  });

  const gulNawaz = await add({
    full_name_en: "Gul Nawaz Khan",
    full_name_ur: "گل نواز خان",
    father_name_en: "Sher Bahadur",
    father_name_ur: "شیر بہادر",
    grandfather_name_en: "Gul Bacha",
    profession: "businessman",
    qualification: "FA",
    qualification_level: "intermediate",
    current_city: "Karachi",
    house_area: "Bala Kalay",
    bio_en: "Runs a textile trading business in Karachi but returns to the village every Eid.",
    bio_ur: "کراچی میں ٹیکسٹائل کا کاروبار کرتے ہیں مگر ہر عید پر گاؤں واپس آتے ہیں۔",
    father_profile_id: sherBahadur,
  });

  // Generation 3 — grandsons
  const drImran = await add({
    honorific: "Dr",
    full_name_en: "Imran Rahim",
    full_name_ur: "عمران رحیم",
    father_name_en: "Abdul Rahim",
    father_name_ur: "عبد الرحیم",
    grandfather_name_en: "Sher Bahadur",
    profession: "doctor",
    qualification: "MBBS",
    qualification_level: "bachelor",
    institute: "Khyber Medical College",
    current_city: "Peshawar",
    house_area: "Bala Kalay",
    bio_en: "Medical officer at a public hospital in Peshawar; volunteers at village health camps.",
    bio_ur: "پشاور کے ایک سرکاری اسپتال میں میڈیکل آفیسر؛ گاؤں کے صحت کیمپوں میں رضاکارانہ خدمات۔",
    father_profile_id: abdulRahim,
  });

  const engrAsif = await add({
    honorific: "Engr",
    full_name_en: "Asif Rahim",
    full_name_ur: "آصف رحیم",
    father_name_en: "Abdul Rahim",
    father_name_ur: "عبد الرحیم",
    grandfather_name_en: "Sher Bahadur",
    profession: "engineer",
    qualification: "BSc Civil Engineering",
    qualification_level: "bachelor",
    institute: "UET Peshawar",
    current_city: "Dubai",
    house_area: "Bala Kalay",
    bio_en: "Civil engineer working on infrastructure projects in the UAE.",
    bio_ur: "متحدہ عرب امارات میں انفراسٹرکچر منصوبوں پر کام کرنے والے سول انجینئر۔",
    father_profile_id: abdulRahim,
  });

  const naveedGul = await add({
    full_name_en: "Naveed Gul",
    full_name_ur: "نوید گل",
    father_name_en: "Gul Nawaz Khan",
    father_name_ur: "گل نواز خان",
    grandfather_name_en: "Sher Bahadur",
    profession: "government_officer",
    qualification: "MA Political Science",
    qualification_level: "master",
    institute: "Quaid-i-Azam University",
    current_city: "Islamabad",
    house_area: "Bala Kalay",
    bio_en: "Section officer in a federal department, posted in Islamabad.",
    bio_ur: "وفاقی محکمے میں سیکشن آفیسر، اسلام آباد میں تعینات۔",
    father_profile_id: gulNawaz,
  });

  const saleemGul = await add({
    full_name_en: "Saleem Gul",
    full_name_ur: "سلیم گل",
    father_name_en: "Gul Nawaz Khan",
    father_name_ur: "گل نواز خان",
    grandfather_name_en: "Sher Bahadur",
    profession: "teacher",
    qualification: "MSc Mathematics",
    qualification_level: "master",
    institute: "Islamia College Peshawar",
    current_city: "Charsadda",
    house_area: "Kandao",
    bio_en: "Mathematics teacher at the government high school in Charsadda.",
    bio_ur: "چارسدہ کے گورنمنٹ ہائی اسکول میں ریاضی کے استاد۔",
    father_profile_id: gulNawaz,
  });

  // Generation 4 — great-grandsons (students)
  await add({
    full_name_en: "Bilal Imran",
    full_name_ur: "بلال عمران",
    father_name_en: "Imran Rahim",
    father_name_ur: "عمران رحیم",
    grandfather_name_en: "Abdul Rahim",
    profession: "student",
    qualification: "FSc Pre-Medical",
    qualification_level: "intermediate",
    institute: "Edwardes College",
    current_city: "Peshawar",
    house_area: "Bala Kalay",
    bio_en: "Pre-medical student hoping to follow his father into medicine.",
    bio_ur: "پری میڈیکل کا طالبِ علم جو اپنے والد کی طرح طب کے شعبے میں جانا چاہتا ہے۔",
    father_profile_id: drImran,
  });

  await add({
    full_name_en: "Hamza Asif",
    full_name_ur: "حمزہ آصف",
    father_name_en: "Asif Rahim",
    father_name_ur: "آصف رحیم",
    grandfather_name_en: "Abdul Rahim",
    profession: "student",
    qualification: "Matric",
    qualification_level: "matric",
    institute: "Pakistan International School Dubai",
    current_city: "Dubai",
    house_area: "Bala Kalay",
    bio_en: "Schoolboy in Dubai who spends his summers with family in the village.",
    bio_ur: "دبئی میں زیرِ تعلیم، گرمیوں کی چھٹیاں گاؤں میں خاندان کے ساتھ گزارتا ہے۔",
    father_profile_id: engrAsif,
  });

  console.log(`  ✓ 10 profiles inserted (roots: ${sherBahadur}, ${fazleKarim})`);

  // ── News ──────────────────────────────────────────────────────────
  console.log("→ Inserting news posts…");
  await db.from("news_posts").insert([
    {
      title_en: "Annual Jirga to be held after Eid-ul-Fitr",
      title_ur: "سالانہ جرگہ عید الفطر کے بعد منعقد ہوگا",
      body_en:
        "The village elders have announced that the annual jirga will convene at the central hujra on the third day of Eid. Matters concerning the water channel, the school boundary wall, and the graveyard maintenance will be discussed. All household heads are requested to attend.",
      body_ur:
        "گاؤں کے بزرگوں نے اعلان کیا ہے کہ سالانہ جرگہ عید کے تیسرے دن مرکزی حجرے میں منعقد ہوگا۔ نہر، اسکول کی چاردیواری اور قبرستان کی دیکھ بھال سے متعلق امور زیرِ بحث آئیں گے۔ تمام سربراہانِ خانہ سے شرکت کی درخواست ہے۔",
      category: "jirga",
      is_pinned: true,
      cover_image_url: img("jirga"),
    },
    {
      title_en: "Inna lillahi — Haji Sher Bahadur has passed away",
      title_ur: "اِنّا للہ — حاجی شیر بہادر انتقال کر گئے",
      body_en:
        "With grief we inform the community that Haji Sher Bahadur, a beloved elder of Bala Kalay, passed away peacefully. The funeral prayer was offered at the central mosque. May Allah grant him Jannah and give patience to the bereaved family.",
      body_ur:
        "نہایت رنج کے ساتھ مطلع کیا جاتا ہے کہ بالا کلے کے محبوب بزرگ حاجی شیر بہادر انتقال کر گئے۔ نمازِ جنازہ مرکزی مسجد میں ادا کی گئی۔ اللہ تعالیٰ انہیں جنت نصیب فرمائے اور لواحقین کو صبر عطا فرمائے۔",
      category: "death",
      is_pinned: false,
      cover_image_url: null,
    },
    {
      title_en: "Government primary school receives new classrooms",
      title_ur: "سرکاری پرائمری اسکول کو نئے کلاس روم مل گئے",
      body_en:
        "Two new classrooms funded under a provincial education scheme have been completed at the village primary school, easing overcrowding. Parents are encouraged to enrol their children for the new session.",
      body_ur:
        "صوبائی تعلیمی اسکیم کے تحت گاؤں کے پرائمری اسکول میں دو نئے کلاس روم مکمل ہو گئے ہیں جس سے رش کم ہوگا۔ والدین سے درخواست ہے کہ نئے تعلیمی سال کے لیے اپنے بچوں کا داخلہ کرائیں۔",
      category: "school",
      is_pinned: false,
      cover_image_url: img("school"),
    },
  ]);
  console.log("  ✓ 3 news posts inserted");

  // ── Albums + photos ───────────────────────────────────────────────
  console.log("→ Inserting albums…");
  const { data: eid } = await db
    .from("albums")
    .insert({
      title_en: "Eid-ul-Fitr Gathering",
      title_ur: "عید الفطر کا اجتماع",
      event_date: new Date(new Date().getFullYear(), 3, 10)
        .toISOString()
        .slice(0, 10),
      description_en:
        "The community gathered at the hujra for Eid greetings, food and the children's games.",
      description_ur:
        "برادری عید کی مبارکباد، کھانے اور بچوں کے کھیلوں کے لیے حجرے میں جمع ہوئی۔",
      cover_image_url: img("eid-cover"),
    })
    .select("id")
    .single();

  const { data: jirga } = await db
    .from("albums")
    .insert({
      title_en: "Village Jirga at the Hujra",
      title_ur: "حجرے میں گاؤں کا جرگہ",
      event_date: new Date(new Date().getFullYear(), 1, 22)
        .toISOString()
        .slice(0, 10),
      description_en:
        "Elders meeting to resolve the water-channel rotation and community matters.",
      description_ur:
        "بزرگوں کا اجلاس جس میں نہر کی باری اور برادری کے امور طے کیے گئے۔",
      cover_image_url: img("jirga-cover"),
    })
    .select("id")
    .single();

  if (eid?.id) {
    await db.from("album_photos").insert(
      [1, 2, 3, 4].map((n) => ({
        album_id: eid.id,
        image_url: img(`eid-${n}`),
        caption_en: `Eid gathering — moment ${n}`,
        caption_ur: `عید کا اجتماع — منظر ${n}`,
        display_order: n,
      })),
    );
  }
  if (jirga?.id) {
    await db.from("album_photos").insert(
      [1, 2, 3].map((n) => ({
        album_id: jirga.id,
        image_url: img(`jirga-${n}`),
        caption_en: `Jirga session — ${n}`,
        caption_ur: `جرگہ نشست — ${n}`,
        display_order: n,
      })),
    );
  }
  console.log("  ✓ 2 albums with photos inserted");

  // ── Optional: promote an admin by email ───────────────────────────
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminEmail) {
    const { data: list } = await db.auth.admin.listUsers();
    const u = list?.users.find((x) => x.email === adminEmail);
    if (u) {
      await db
        .from("admin_users")
        .upsert({ user_id: u.id, role: "super_admin" });
      console.log(`  ✓ ${adminEmail} promoted to super_admin`);
    } else {
      console.log(
        `  ⓘ ${adminEmail} has no auth account yet — sign up first, then re-run, ` +
          "or add the row in Supabase Studio (admin_users).",
      );
    }
  }

  console.log("\n✓ Seed complete. Visit /ur or /en to explore.");
}

main().catch((e) => {
  console.error("✗ Seed failed:", e);
  process.exit(1);
});
