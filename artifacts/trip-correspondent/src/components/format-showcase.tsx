import { motion } from 'framer-motion';

/**
 * Bold, simple visual menu of the physical/social forms a finished story
 * can take — fills the dead space between the hero and Upload on the Home
 * page, and doubles as discoverability for features (PDF export, share
 * cards) that otherwise only live inside an already-opened trip. Every
 * mockup is pure CSS/SVG, matching the app's bold graphic-poster language
 * rather than needing photographic assets.
 */

function FramedPrintMockup() {
  return (
    <div className="relative flex items-center justify-center h-40">
      <motion.div
        className="relative w-28 h-36 bg-[#f4f1e8] p-2 shadow-[0_18px_30px_-10px_rgba(0,0,0,0.6)]"
        initial={{ rotate: -4 }}
        animate={{ rotate: [-4, -2, -4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-full w-full border border-black/10" style={{ background: 'linear-gradient(135deg, hsl(213 70% 55%), hsl(270 60% 60%))' }} />
      </motion.div>
    </div>
  );
}

function SocialCardMockup() {
  return (
    <div className="relative flex items-center justify-center h-40">
      <div className="relative w-24 h-36 rounded-[14px] border-2 border-white/70 bg-black/40 overflow-hidden shadow-[0_18px_30px_-10px_rgba(0,0,0,0.6)]">
        <div className="h-20 w-full" style={{ background: 'linear-gradient(160deg, hsl(320 80% 60%), hsl(213 90% 55%))' }} />
        <div className="px-2 pt-2 space-y-1.5">
          <div className="h-1.5 w-3/4 rounded-full bg-white/40" />
          <div className="h-1.5 w-1/2 rounded-full bg-white/25" />
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-white/50 text-[8px] font-mono">
          <span>♡ 24</span>
          <span>↗</span>
        </div>
      </div>
    </div>
  );
}

function PhotocardStackMockup() {
  const cards = [
    { rotate: -8, bg: 'hsl(45 90% 60%)' },
    { rotate: 3, bg: 'hsl(0 80% 60%)' },
    { rotate: -2, bg: 'hsl(213 90% 55%)' },
  ];
  return (
    <div className="relative flex items-center justify-center h-40">
      {cards.map((c, i) => (
        <motion.div
          key={i}
          className="absolute w-20 h-28 rounded-sm border-2 border-white/80 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.6)]"
          style={{ background: c.bg, zIndex: i }}
          initial={{ rotate: c.rotate }}
          animate={{ rotate: [c.rotate, c.rotate * 0.6, c.rotate] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
    </div>
  );
}

const FORMATS = [
  {
    id: 'print',
    title: 'Print & Frame',
    copy: 'Export any story as a print-ready PDF and hang your favourite trip on the wall.',
    tag: 'Available now',
    Mockup: FramedPrintMockup,
  },
  {
    id: 'share',
    title: 'Share the Card',
    copy: 'Every story generates a shareable card — post it straight to Instagram or send it in a chat.',
    tag: 'Available now',
    Mockup: SocialCardMockup,
  },
  {
    id: 'photocards',
    title: 'Photocard Deck',
    copy: 'Turn a trip’s best days into a physical set of postcards you can mail or keep.',
    tag: 'Coming soon',
    Mockup: PhotocardStackMockup,
  },
] as const;

export function FormatShowcase() {
  return (
    <section className="space-y-0">
      <div className="text-center mb-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/50 mb-3">
          One Story · Every Format
        </div>
        <h2
          className="font-serif font-black uppercase tracking-tight text-white"
          style={{ fontSize: 'clamp(1.75rem,5vw,3rem)', WebkitTextStroke: '1.5px black', paintOrder: 'stroke fill' }}
        >
          However You Want It
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black border border-black">
        {FORMATS.map(({ id, title, copy, tag, Mockup }) => (
          <div key={id} className="p-8 flex flex-col items-center text-center gap-4">
            <Mockup />
            <div className="space-y-2">
              <span className="inline-block font-mono text-[8px] uppercase tracking-[0.3em] text-white/40 border border-white/20 px-2 py-1" style={{ WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill' }}>
                {tag}
              </span>
              <h3 className="text-lg font-serif font-black text-white" style={{ WebkitTextStroke: '1px black', paintOrder: 'stroke fill' }}>{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-[220px]" style={{ WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill' }}>{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
