import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { getAlbums, getAlbum } from "@/lib/queries";
import { AlbumManager } from "@/features/admin/album-manager";

export default async function AdminAlbumsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const sp = await searchParams;
  const albumId = sp.album?.trim();

  const [albums, selected] = await Promise.all([
    getAlbums(),
    albumId ? getAlbum(albumId) : Promise.resolve(null),
  ]);

  return (
    <AlbumManager albums={albums} selected={selected} locale={locale} />
  );
}
