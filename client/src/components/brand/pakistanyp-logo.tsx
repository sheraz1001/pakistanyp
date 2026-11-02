import { cn } from "@/lib/utils";
import { country } from "@shared/country";

/*
 * pakistanyp.com brand assets — the owner's exact logo image files
 * (client/public/logo/*), never redrawn.
 *   pakistanyp-logo.png  full lockup, transparent, 1338 × 490
 *   pakistanyp-mark.png  pin mark only, transparent, 367 × 490
 *   icon-512.png    square app icon (favicons / app icons are generated from it)
 */
// Per-country assets (shared/country.ts); Pakistan values are unchanged.
export const LOGO_SRC = country.logo.full;
export const MARK_SRC = country.logo.mark;
/** Display renditions: 104px tall = 2x the 52px header logo (~17KB WebP, PNG fallback). */
const LOGO_WEBP = country.logo.fullWebp || country.logo.full;
const LOGO_PNG = country.logo.fullPng || country.logo.full;
const MARK_WEBP = country.logo.markWebp || country.logo.mark;
const MARK_PNG = country.logo.markPng || country.logo.mark;
export const LOGO_ALT = `${country.domain} — ${country.tagline}`;
/** Header rendition (mark + wordmark, no tagline): 688x104 */
const LOGO_RATIO = (country.logo.width104 || 688) / 104;
const MARK_RATIO = (country.logo.markWidth104 || 131) / 104;

/**
 * Full logo (pin mark + "pakistanyp.com" + "Pakistani BUSINESS DIRECTORY").
 * 52px tall in the header. Explicit width/height avoid layout shift.
 * `markSize`/`textSize` are accepted for older call sites and only scale the height.
 */
export function PakistanypLogo({
  height,
  markSize,
  href,
  className,
  imgClassName,
  onClick,
  priority = true,
}: {
  height?: number;
  /** @deprecated use `height` */
  markSize?: number;
  /** @deprecated ignored */
  textSize?: number;
  /** @deprecated ignored — the tagline is part of the image */
  tagline?: boolean;
  href?: string;
  className?: string;
  imgClassName?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Header/above-the-fold logos load eagerly; pass false for footer use. */
  priority?: boolean;
}) {
  const h = height ?? (markSize ? Math.round(markSize * (52 / 44)) : 52);
  const w = Math.round(h * LOGO_RATIO);
  // The 104px renditions cover up to 2x for logos up to 52px tall; larger uses get the original.
  const big = h > 52;
  const img = (
    <picture>
      {!big && <source type="image/webp" srcSet={LOGO_WEBP} />}
      <img
        src={big ? LOGO_SRC : LOGO_PNG}
        alt={LOGO_ALT}
        width={w}
        height={h}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("yp-logo-img block h-auto max-w-full", imgClassName)}
        style={{ height: h, width: "auto" }}
      />
    </picture>
  );
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cn("yp-logo inline-flex shrink-0 items-center no-underline", className)}>
        {img}
      </a>
    );
  }
  return <span className={cn("yp-logo inline-flex shrink-0 items-center", className)}>{img}</span>;
}

/** Pin mark only — for tight spaces (collapsed sidebars, splash screens). `size` is the height. */
export function PakistanypMark({
  size = 44,
  className,
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
  /** @deprecated ignored — the ground shadow is part of the image */
  shadow?: boolean;
}) {
  const big = size > 52;
  return (
    <picture>
      {!big && <source type="image/webp" srcSet={MARK_WEBP} />}
    <img
      src={big ? MARK_SRC : MARK_PNG}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      width={Math.round(size * MARK_RATIO)}
      height={size}
      decoding="async"
      className={cn("shrink-0 flex-none", className)}
      style={{ height: size, width: "auto" }}
    />
    </picture>
  );
}

/** 4px brand stripe (white and Pakistan green) at the very top of the header. */
export function FlagStripe({ className, height = 4 }: { className?: string; height?: number }) {
  return (
    <div className={cn("yp-flag-stripe", className)} style={{ height }} aria-hidden="true">
      {country.flagStripe.map((s, i) => (
        <span key={i} style={{ flex: s.weight, background: s.color }} />
      ))}
    </div>
  );
}

export default PakistanypLogo;
