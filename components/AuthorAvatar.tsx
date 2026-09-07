import Image from "next/image";
import { AUTHOR_AVATAR, AUTHOR_NAME } from "@/lib/author";

/** The author's portrait, in one place so the hero, the article footer and the About page can
 * never drift apart. next/image rather than a bare <img> because this is the one image on the
 * site that ships from our own repo: it gets resized and re-encoded per device instead of
 * sending a 1080px original to a 56px slot on a phone. */
export function AuthorAvatar({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src={AUTHOR_AVATAR}
      alt={AUTHOR_NAME}
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={size >= 64}
      className={`shrink-0 rounded-full border border-border object-cover ${className}`}
    />
  );
}
