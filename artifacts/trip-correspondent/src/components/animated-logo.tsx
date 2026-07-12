import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

/**
 * The line-art fox+T mark, drawn on stroke by stroke on mount using
 * anime.js — each path's length becomes its own dash-offset tween, the
 * classic "hand-drawn" SVG reveal. Used once, in the landing hero; the
 * static <LogoMark> (logo.tsx) is used everywhere else — animating this on
 * every nav bar would be more distracting than impressive.
 */
export function AnimatedLogoMark({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const shapes = Array.from(svg.querySelectorAll<SVGGeometryElement>('path, line'));

    shapes.forEach((shape, i) => {
      const length = shape.getTotalLength();
      shape.style.strokeDasharray = `${length}`;
      shape.style.strokeDashoffset = `${length}`;
      animate(shape, {
        strokeDashoffset: [length, 0],
        duration: 900,
        delay: i * 110,
      });
    });
  }, []);

  return (
    <svg
      ref={svgRef}
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
