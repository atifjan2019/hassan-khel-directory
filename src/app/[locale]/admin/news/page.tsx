import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { getNews } from "@/lib/queries";
import { NewsEditor } from "@/features/admin/news-editor";

export default async function AdminNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const posts = await getNews();

  return <NewsEditor posts={posts} locale={locale} />;
}
