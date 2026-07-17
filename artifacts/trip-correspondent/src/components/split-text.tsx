import { motion } from 'framer-motion';

/**
 * Splits a string into individual characters and staggers each one into
 * view from a random direction — Sandra Creates-style kinetic type.
 * Spaces become non-breaking spaces so they still take up width.
 */
export function SplitText({
  text,
  className = '',
  delayPerChar = 0.035,
  staggerFrom: _from = 'bottom',
}: {
  text: string;
  className?: string;
  delayPerChar?: number;
  staggerFrom?: 'bottom' | 'random';
}) {
  const chars = text.split('');

  return (
    <span className={className} aria-label={text} style={{ display: 'inline-block' }}>
      {chars.map((char, i) => {
        const yOffset = 48;
        const rotate = char === ' ' ? 0 : (i % 2 === 0 ? 6 : -6);
        return (
          <motion.span
            key={i}
            className="inline-block"
            style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
            initial={{ opacity: 0, y: yOffset, rotate }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.55,
              delay: i * delayPerChar,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        );
      })}
    </span>
  );
}
