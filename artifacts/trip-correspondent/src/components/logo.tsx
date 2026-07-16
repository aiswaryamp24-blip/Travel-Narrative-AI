/**
 * Turasum logo — neon blue vector fox face with indigo glow.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <img
        src="/fox-logo.png"
        alt="Turasum fox"
        className="h-8 w-8 shrink-0 object-contain"
        style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.7))' }}
      />
      <span
        className="font-serif font-black tracking-tight text-foreground"
        style={{ letterSpacing: '-0.02em' }}
      >
        Turasum
      </span>
    </span>
  );
}

/** Standalone fox mark (nav icons, loading screens, etc.) */
export function FoxMark({ className }: { className?: string }) {
  return (
    <img
      src="/fox-logo.png"
      alt=""
      aria-hidden="true"
      className={`object-contain ${className ?? 'h-8 w-8'}`}
      style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.75))' }}
    />
  );
}

/** Embedded in large headings — scales with font-size. */
export function FoxT({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src="/fox-logo.png"
      alt=""
      aria-hidden="true"
      className={className ?? 'inline h-[0.85em] w-auto align-[-0.12em]'}
      style={{ filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.8))', ...style }}
    />
  );
}
