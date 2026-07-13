import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useMotionValue,
  useAnimationFrame,
} from 'framer-motion';

function wrap(min: number, max: number, value: number): number {
  const range = max - min;
  const mod = (((value - min) % range) + range) % range;
  return mod + min;
}

export interface StripItem {
  id: number | string;
  src: string;
  label: string;
}

/**
 * A horizontally auto-drifting photo strip whose speed and direction
 * respond to how fast the page is being scrolled — scroll quickly and it
 * surges or reverses; scroll slowly, or not at all, and it drifts at its
 * own base pace. Two copies of the item list sit side by side and the x
 * offset wraps seamlessly between 0% and -50%, so the loop never visibly
 * resets.
 */
export function ScrollVelocityStrip({ items, baseSpeed = -6 }: { items: StripItem[]; baseSpeed?: number }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [-2000, 2000], [-5, 5], { clamp: false });

  useAnimationFrame((_, delta) => {
    let moveBy = baseSpeed * (delta / 1000);
    moveBy += moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden py-2">
      <motion.div className="flex gap-6 w-fit" style={{ x }}>
        {doubled.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="relative w-[240px] md:w-[320px] aspect-[3/4] shrink-0 overflow-hidden bg-muted border border-border"
          >
            <img src={item.src} alt={item.label} className="w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-2 text-white">
              <span className="font-serif italic text-base leading-tight">{item.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-70 shrink-0">
                {String(i % items.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
