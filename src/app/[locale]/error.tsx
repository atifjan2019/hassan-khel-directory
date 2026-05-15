"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-28 text-center">
      <h1 className="text-3xl">{t("error")}</h1>
      <Button onClick={reset} className="mt-6" variant="secondary">
        {t("retry")}
      </Button>
    </div>
  );
}
