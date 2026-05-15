import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-28 text-center">
      <p className="font-display text-7xl text-gold-500">404</p>
      <h1 className="mt-4 text-3xl">{t("noResults")}</h1>
      <Button asChild className="mt-8" variant="secondary">
        <Link href="/">{t("back")}</Link>
      </Button>
    </div>
  );
}
