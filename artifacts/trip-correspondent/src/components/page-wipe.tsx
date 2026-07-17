import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'wouter';

/**
 * Paint-wipe page transition: a full-screen primary-colour slab slides in
 * from the right, holds for a frame, then wipes off to the left — covering
 * the hard navigation cut so the switch feels intentional rather than instant.
 * No routing delay: the actual route change still happens immediately; this
 * is a purely cosmetic overlay on top.
 */
export function PageWipe() {
  const [location] = useLocation();
  const prevLocation = useRef(location);
  const [wipeKey, setWipeKey] = useState<number | null>(null);

  useEffect(() => {
    if (location !== prevLocation.current) {
      prevLocation.current = location;
      setWipeKey(Date.now());
    }
  }, [location]);

  return (
    <AnimatePresence>
      {wipeKey !== null && (
        <motion.div
          key={wipeKey}
          className="fixed inset-0 z-[200] pointer-events-none"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0 0 100%)'] }}
          transition={{ duration: 0.65, times: [0, 0.4, 0.55, 1], ease: 'easeInOut' }}
          onAnimationComplete={() => setWipeKey(null)}
        />
      )}
    </AnimatePresence>
  );
}
