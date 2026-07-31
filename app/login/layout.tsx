import type { Metadata } from "next";
import { getStrings } from "@/lib/i18n";

export const metadata: Metadata = {
  title: getStrings("ru").loginTitle,
  robots: { index: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
