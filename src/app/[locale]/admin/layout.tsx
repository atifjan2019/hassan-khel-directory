import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/features/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  return (
    <div className="lg:flex">
      <AdminNav />
      <div className="min-w-0 flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
