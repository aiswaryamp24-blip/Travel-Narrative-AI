/**
 * Turasum's mark: a fox's perked ears form the crossbar of a "T", the
 * stem doubles as the muzzle, with minimal line-art eyes/nose. Single
 * continuous stroke weight to match the thin topographic-line poster
 * aesthetic the brand is drawing from — deliberately not a filled/solid
 * icon, even though that costs a little legibility at very small sizes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 20 L6 4 L22 16" />
      <path d="M50 20 L58 4 L42 16" />
      <line x1="10" y1="20" x2="54" y2="20" />
      <line x1="32" y1="20" x2="32" y2="56" />
      <path d="M24 28 L28 31" />
      <path d="M40 28 L36 31" />
      <path d="M29 44 L32 48 L35 44" />
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
