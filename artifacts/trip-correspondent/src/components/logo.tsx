/**
 * Turasum's mark: the neon fox — the brand's main logo.
 * Uses the neon blue outline fox PNG as the primary mark everywhere.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/fox-logo.png"
      alt="Turasum fox"
      className={className}
      aria-hidden="true"
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className="h-7 w-7 shrink-0 object-contain" />
      <span className="font-serif font-bold tracking-tight">Turasum</span>
    </span>
  );
}
