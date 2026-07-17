import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, animate } from 'framer-motion';

/**
 * Counts up from 0 to `value` the first time it enters the viewport —
 * like a mechanical departure-board odometer clicking into place.
 */
export function AnimatedNumber({
  value,
  suffix = '',
  className = '',
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [inView, value, motionVal]);

  useEffect(() => {
    return motionVal.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = Math.round(v).toLocaleString() + suffix;
      }
    });
  }, [motionVal, suffix]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
