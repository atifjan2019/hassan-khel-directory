"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

export function MobileNav({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("menu")}
        className="rounded-md p-2 text-forest-700 transition-transform duration-150 hover:bg-primary/5 active:scale-90 motion-reduce:active:scale-100"
      >
        <Menu className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          <div
            className="absolute inset-0 bg-charcoal/50"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute inset-y-0 end-0 flex w-[82%] max-w-xs flex-col bg-cream-50 p-6 shadow-card animate-fade-in">
            <div className="mb-6 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("menu")}
                className="rounded-md p-2 text-forest-700 transition-transform duration-150 hover:bg-primary/5 active:scale-90 motion-reduce:active:scale-100"
              >
                <X className="size-6" />
              </button>
            </div>

            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-md px-3 py-3 text-base font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-primary/5",
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-center font-medium text-foreground hover:bg-primary/5"
                  >
                    {t("myProfile")}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-3 text-center font-medium text-primary hover:bg-primary/5"
                    >
                      {t("admin")}
                    </Link>
                  )}
                  <a
                    href="/api/auth/signout"
                    className="rounded-md px-3 py-3 text-center font-medium text-muted-foreground hover:bg-primary/5"
                  >
                    {t("logout")}
                  </a>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-primary/40 px-3 py-3 text-center font-medium text-primary"
                >
                  {t("login")}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
