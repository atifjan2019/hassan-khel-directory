"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Clock,
  Users,
  Newspaper,
  Images,
  BarChart3,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  key: "overview" | "pending" | "members" | "news" | "albums" | "reports";
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: NavItem[] = [
  { href: "/admin", key: "overview", icon: LayoutDashboard },
  { href: "/admin/pending", key: "pending", icon: Clock },
  { href: "/admin/members", key: "members", icon: Users },
  { href: "/admin/news", key: "news", icon: Newspaper },
  { href: "/admin/albums", key: "albums", icon: Images },
  { href: "/admin/reports", key: "reports", icon: BarChart3 },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminNav() {
  const t = useTranslations("admin.nav");
  const tAdmin = useTranslations("admin");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (onClick?: () => void) =>
    ITEMS.map(({ href, key, icon: Icon }) => {
      const active = isActive(pathname, href);
      return (
        <Link
          key={href}
          href={href}
          onClick={onClick}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground shadow-soft"
              : "text-foreground hover:bg-primary/5",
          )}
        >
          <Icon className="size-4 shrink-0" />
          {t(key)}
        </Link>
      );
    });

  const logoutLink = (
    <a
      href="/api/auth/signout"
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="size-4 shrink-0" />
      {tNav("logout")}
    </a>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <span className="font-display text-lg text-forest-700">
          {tAdmin("title")}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="rounded-md p-2 text-foreground hover:bg-primary/5"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="admin-mobile-nav"
          className="grid gap-1 border-b border-border bg-card p-3 lg:hidden"
        >
          {links(() => setOpen(false))}
          <div className="mt-1 border-t border-border pt-1">{logoutLink}</div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-e border-border bg-card lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-4">
          <p className="mb-4 px-3 font-display text-lg text-forest-700">
            {tAdmin("title")}
          </p>
          <nav className="grid gap-1">{links()}</nav>
          <div className="mt-auto border-t border-border pt-4">
            {logoutLink}
          </div>
        </div>
      </aside>
    </>
  );
}
