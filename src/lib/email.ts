import "server-only";

/**
 * Notify the village admin team that a new registration is awaiting approval.
 *
 * Best-effort only: if Resend env vars are missing, or the API call fails,
 * we log and return — registration must always succeed regardless.
 */
export async function notifyAdminNewRegistration(profile: {
  full_name_en: string;
  father_name_en: string;
  profession: string;
  current_city: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;

  if (!apiKey || !to) {
    console.info(
      "[email] Skipping admin notification (RESEND_API_KEY / ADMIN_NOTIFY_EMAIL not set):",
      profile.full_name_en,
    );
    return;
  }

  const from =
    process.env.ADMIN_NOTIFY_FROM ?? "Hassan Khel Directory <onboarding@resend.dev>";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pendingUrl = `${siteUrl}/en/admin/pending`;

  const lines = [
    `Full name: ${profile.full_name_en}`,
    `Father's name: ${profile.father_name_en}`,
    `Profession: ${profile.profession}`,
    `Current city: ${profile.current_city ?? "—"}`,
  ];

  const text = [
    "New registration pending approval",
    "نئی رجسٹریشن منظوری کے لیے زیرِ التوا ہے",
    "",
    ...lines,
    "",
    `Review pending registrations: ${pendingUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,Segoe UI,sans-serif;color:#2b2b2b;line-height:1.6">
      <h2 style="margin:0 0 4px">New registration pending approval</h2>
      <p style="margin:0 0 16px;color:#6b6b6b">نئی رجسٹریشن منظوری کے لیے زیرِ التوا ہے</p>
      <ul style="padding-inline-start:18px;margin:0 0 16px">
        ${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
      </ul>
      <p style="margin:0">
        <a href="${pendingUrl}" style="color:#1B4332;font-weight:600">
          Review pending registrations →
        </a>
      </p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New registration: ${profile.full_name_en}`,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[email] Resend responded ${res.status}: ${detail.slice(0, 500)}`,
      );
    }
  } catch (err) {
    console.error("[email] Failed to send admin notification:", err);
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
