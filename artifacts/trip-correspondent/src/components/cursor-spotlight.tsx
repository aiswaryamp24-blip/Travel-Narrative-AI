import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';

/**
 * Soft radial spotlight that follows the cursor — reveals depth and texture
 * on dark hero sections. Drop it as the FIRST child inside any `relative`
 * dark container.
 */
export function CursorSpotlight({
  color = '99,102,241',
  opacity = 0.18,
  radius = 480,
}: {
  /** RGB triplet, e.g. "99,102,241" for indigo */
  color?: string;
  opacity?: number;
  radius?: number;
}) {
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);
  const springX = useSpring(mouseX, { stiffness: 70, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 70, damping: 20 });
  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${springX}px ${springY}px, rgba(${color},${opacity}), transparent 60%)`;

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-10"
      style={{ background }}
    />
  );
}
