/**
 * Turasum logo mark — a bold "T" with arctic fox ears embedded at the top.
 * Works as both the nav icon and inline within large display headings.
 */

/** Inline SVG: T letterform with fox ears rising above the crossbar. */
export function LogoMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 36 40"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* T crossbar */}
      <rect x="0" y="15" width="36" height="8" rx="0" />
      {/* T stem */}
      <rect x="13" y="23" width="10" height="17" rx="0" />

      {/* Left fox ear (triangle above left of crossbar) */}
      <path d="M 6 15 L 10.5 1 L 16 15 Z" />
      {/* Right fox ear */}
      <path d="M 20 15 L 25.5 1 L 30 15 Z" />

      {/* Inner ear detail — carved lighter to give depth */}
      <path
        d="M 8 15 L 10.5 5.5 L 13.5 15 Z"
        fill="var(--logo-inner, rgba(255,255,255,0.45))"
      />
      <path
        d="M 22 15 L 25.5 5.5 L 28 15 Z"
        fill="var(--logo-inner, rgba(255,255,255,0.45))"
      />

      {/* Fox eyes — two small white dots in crossbar */}
      <circle cx="13" cy="20.5" r="1.6" fill="var(--logo-inner, rgba(255,255,255,0.7))" />
      <circle cx="23" cy="20.5" r="1.6" fill="var(--logo-inner, rgba(255,255,255,0.7))" />

      {/* Tiny nose bridge */}
      <path
        d="M 17 22.5 Q 18 21.5 19 22.5 L 18 23.5 Z"
        fill="var(--logo-inner, rgba(255,255,255,0.55))"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-primary ${className ?? ''}`}>
      <LogoMark className="h-8 w-7 shrink-0" />
      <span
        className="font-serif font-black tracking-tight text-foreground"
        style={{ letterSpacing: '-0.02em' }}
      >
        Turasum
      </span>
    </span>
  );
}

/**
 * Embeds the fox-T mark inline within a large display heading.
 * Renders the SVG at the same cap-height as the surrounding text.
 * Usage: <FoxT className="inline h-[0.85em] w-auto align-baseline" />
 */
export function FoxT({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <LogoMark
      className={className ?? 'inline h-[0.82em] w-auto align-[-0.1em]'}
      style={{ '--logo-inner': 'rgba(255,255,255,0.5)', ...style } as React.CSSProperties}
    />
  );
}
