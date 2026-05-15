import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLink } from "@/components/layout/nav-link";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const { user, isAdmin } = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream-50/90 backdrop-blur supports-[backdrop-filter]:bg-cream-50/75">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Logo locale={locale} />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">{t("admin")}</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">{t("myProfile")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/api/auth/signout">{t("logout")}</a>
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{t("login")}</Link>
            </Button>
          )}
          <Button asChild variant="secondary" size="sm">
            <Link href="/register">{t("register")}</Link>
          </Button>
        </div>

        <MobileNav isLoggedIn={Boolean(user)} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
