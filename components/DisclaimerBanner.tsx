import type { Locale } from "@/lib/types";
import { getStrings } from "@/lib/i18n";

export function DisclaimerBanner({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  return (
    <div className="w-full bg-warning-soft border-b border-warning/30 text-foreground/80 text-xs sm:text-sm px-4 py-2 text-center">
      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-warning/25 text-[10px] font-bold mr-1.5 align-[-2px]">
        i
      </span>
      {t.disclaimer}
    </div>
  );
}
