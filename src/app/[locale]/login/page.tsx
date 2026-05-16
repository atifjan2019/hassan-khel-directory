import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { LoginForm } from "@/features/auth/login-form";
import { pageMetadata } from "@/lib/seo";

// Auth surface — keep out of search results.
export const metadata: Metadata = pageMetadata({
  title: "Log in",
  path: "/login",
  noindex: true,
});

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="container mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="mb-6 text-center">
        <h1 className="text-3xl">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("loginSubtitle")}
        </p>
      </div>
      <Card className="p-6">
        <Suspense
          fallback={
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          }
        >
          <LoginForm locale={locale} />
        </Suspense>
      </Card>
    </div>
  );
}
