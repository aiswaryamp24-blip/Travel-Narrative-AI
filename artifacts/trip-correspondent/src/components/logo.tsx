/**
 * Turasum's mark: a sleepy arctic fox's head, closed eyes, single flowing
 * cheek line with the small hook flourish that recurs across the brand's
 * reference renders — matches the fox used in the loading screen video so
 * the mark reads as the same character everywhere, not two different foxes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 26 L13 6 L28 18" />
      <path d="M36 18 L51 6 L42 26" />
      <path d="M22 26 C16 33, 16 44, 24 51 C28 54, 36 54, 40 51 C48 44, 48 33, 42 26" />
      <path d="M24 34 Q27.5 31 31 34" />
      <path d="M33 34 Q36.5 31 40 34" />
      <path d="M29 45 L32 48 L35 45" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className="h-6 w-6 text-primary shrink-0" />
      <span className="font-serif italic">Turasum</span>
    </span>
  );
}
