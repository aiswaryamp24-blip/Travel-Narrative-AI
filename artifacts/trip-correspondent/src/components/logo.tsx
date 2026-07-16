/**
 * Turasum's mark — the neon fox PNG as the primary brand logo.
 * Sized and styled for clarity at small nav scales.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/fox-logo.png"
      alt="Turasum fox"
      className={className}
      aria-hidden="true"
      style={{
        filter:
          'drop-shadow(0 0 5px hsl(243 75% 55% / 0.55)) drop-shadow(0 0 2px hsl(243 75% 55% / 0.8))',
      }}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className="h-8 w-8 shrink-0 object-contain" />
      <span className="font-serif font-black tracking-tight text-foreground" style={{ letterSpacing: '-0.02em' }}>
        Turasum
      </span>
    </span>
  );
}
