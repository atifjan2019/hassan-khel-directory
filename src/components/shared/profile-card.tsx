import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/shared/avatar";
import { MarhoomBadge } from "@/components/shared/marhoom-badge";
import { Card } from "@/components/ui/card";
import { displayName, localized } from "@/lib/utils";
import type { PublicProfile } from "@/lib/database.types";

export async function ProfileCard({
  profile,
  locale,
}: {
  profile: PublicProfile;
  locale: string;
}) {
  const t = await getTranslations("directory");
  const tp = await getTranslations(`options.profession`);
  const name = displayName(locale, profile);
  const father = localized(locale, profile.father_name_en, profile.father_name_ur);

  return (
    <Card className="group h-full overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
      <Link
        href={`/directory/${profile.id}`}
        className="flex h-full flex-col items-center p-5 text-center"
      >
        <Avatar
          src={profile.photo_url}
          alt={name}
          hidden={profile.hide_photo}
          size={88}
          className="mb-3"
        />
        <h3 className="font-display text-lg leading-tight text-forest-700">
          {name}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("sonOf")} {father}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {tp(profile.profession as never)}
          </span>
          {profile.is_deceased && <MarhoomBadge />}
        </div>

        {profile.current_city && (
          <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {profile.current_city}
          </p>
        )}
      </Link>
    </Card>
  );
}
