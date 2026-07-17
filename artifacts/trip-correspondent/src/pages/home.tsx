import { useState } from 'react';
import { motion } from 'framer-motion';
import { useListTrips } from '@workspace/api-client-react';
import { UploadFlow } from '@/components/upload-flow';
import { Link } from 'wouter';
import { FileText, Newspaper, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useClerk } from '@clerk/react';
import { Logo } from '@/components/logo';
import { MosaicTripCard, mosaicSpanClass } from '@/components/mosaic-trip-card';
import { SparkleGlow } from '@/components/sparkle-glow';
import { FormatShowcase } from '@/components/format-showcase';

const GRID_BACKGROUND_IMAGE = [
  'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,120,255,0.10) 39px, rgba(0,120,255,0.10) 40px)',
  'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,120,255,0.10) 39px, rgba(0,120,255,0.10) 40px)',
].join(', ');

type StyleDef = {
  id: string; name: string; bg: string; accent: string; fg: string; muted: string;
  tagline: string; preview: string;
};

const COVER_STYLES: StyleDef[] = [
  {
    id: 'pop-art', name: 'Pop Art', bg: '#FFEC00', accent: '#E8112D', fg: '#0D0D0D', muted: '#3D3D3D',
    tagline: 'Roy Lichtenstein meets your holiday snaps.',
    preview: 'Ben-day dots, pillarbox red, thick ink borders. Every spread looks like a 1960s graphic novel. Your trip, amplified.',
  },
  {
    id: 'supermarket', name: 'Supermarket', bg: '#F5F5F0', accent: '#CC0000', fg: '#111111', muted: '#555555',
    tagline: 'Like a receipt, but make it fashion.',
    preview: 'Off-white paper, barcode accents, scannable moments. Clean and brutally honest — the kind of editorial that wins awards at Sainsbury\'s.',
  },
  {
    id: 'camera-interface', name: 'Viewfinder Interface', bg: '#0A0A0A', accent: '#00FF41', fg: '#E8E8E8', muted: '#6B6B6B',
    tagline: 'Your trip as the camera sees it.',
    preview: 'Black EVF background, emerald green HUD readouts, monospace everywhere. Looks like a photographer\'s contact sheet crossed with a 35mm darkroom.',
  },
  {
    id: 'canon-camera', name: 'Canon Camera', bg: '#1A1A1A', accent: '#E0051E', fg: '#F0F0F0', muted: '#8A8A8A',
    tagline: 'The pro\'s choice.',
    preview: 'Deep body black, Canon signature red. Bold, serious, built for correspondents who shoot primes and wake up before the light.',
  },
  {
    id: 'ios-core', name: 'iOS Core', bg: '#F2F2F7', accent: '#007AFF', fg: '#1C1C1E', muted: '#8E8E93',
    tagline: 'Clean, airy, grouped — very you.',
    preview: 'Light system backgrounds, system blue, crisp spacing. Like a beautifully organised photo library — every memory in its own perfectly rounded card.',
  },
  {
    id: 'android-core', name: 'Android Core', bg: '#1C1B1F', accent: '#D0BCFF', fg: '#E6E1E5', muted: '#938F99',
    tagline: 'Material midnight. The dark-mode edition.',
    preview: 'Deep indigo surface, lilac display type, tertiary purple accents. Looks like your travel diary was designed by a Google UX team on a deadline they actually loved.',
  },
];

function CoverCard({ style }: { style: StyleDef }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative border border-border overflow-visible"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Mini cover swatch */}
      <div className="relative h-32 overflow-hidden" style={{ backgroundColor: style.bg }}>
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div>
            <div className="h-[3px] w-10 mb-2" style={{ backgroundColor: style.accent }} />
            <div className="font-black text-[22px] leading-none" style={{ color: style.fg, fontFamily: 'Georgia, serif', opacity: 0.85 }}>
              Aa
            </div>
            <div className="text-[9px] mt-1 leading-tight font-mono" style={{ color: style.muted }}>
              {style.name.toUpperCase()}
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="h-12 flex-1 opacity-25" style={{ backgroundColor: style.fg }} />
            <div className="h-12 w-7 opacity-15" style={{ backgroundColor: style.muted }} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: style.accent }} />
      </div>

      {/* Label */}
      <div className="px-4 py-3 bg-card border-t border-border">
        <div className="font-serif font-black text-sm text-foreground">{style.name}</div>
        <div className="text-[10px] text-muted-foreground font-mono mt-0.5 italic">{style.tagline}</div>
      </div>

      {/* Hover tooltip card — appears below */}
      {hovered && (
        <div
          className="absolute left-0 right-0 z-50 top-full mt-1 border border-border bg-card shadow-xl p-4 space-y-2 pointer-events-none"
          style={{ minWidth: '220px' }}
        >
          {/* Mini colour strip */}
          <div className="flex gap-1 mb-2">
            <div className="h-2 flex-1 rounded-none" style={{ backgroundColor: style.bg, border: `1px solid ${style.accent}` }} />
            <div className="h-2 w-6 rounded-none" style={{ backgroundColor: style.accent }} />
            <div className="h-2 w-4 rounded-none" style={{ backgroundColor: style.fg }} />
          </div>
          <p className="text-xs font-serif font-bold text-foreground leading-snug">{style.name}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{style.preview}</p>
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 pt-1">
            Select in the upload form above
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { data: trips, isLoading } = useListTrips();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen pb-24">
      {/* Nav */}
      <nav className="py-3 px-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Logo className="text-lg" />
        <div className="flex items-center gap-2">
          <Link href="/feed" className="inline-flex items-center gap-1.5 text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
            <Newspaper className="h-3 w-3" /> Feed
          </Link>
          {user && (
            <Link href={`/users/${user.id}`} className="inline-flex items-center gap-1.5 text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
              <UserCircle className="h-3 w-3" /> Profile
            </Link>
          )}
          {user && (
            <span className="text-xs text-muted-foreground font-mono hidden md:inline px-2">
              {user.firstName ?? user.username ?? 'Correspondent'}
            </span>
          )}
          <button
            className="inline-flex items-center text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Masthead — airplane window shot, same visual language as the
          landing hero, but static (no scroll-pin/zoom): this page is
          visited repeatedly to reach the archive below, so the hero stays
          out of the way rather than hijacking scroll like the one-time
          landing impression does. A slow idle Ken Burns drift keeps it
          from feeling static. */}
      <header className="relative overflow-hidden border-b-4 border-foreground">
        <div className="relative overflow-hidden" style={{ minHeight: '38vh' }}>
          <motion.img
            src="/window-night.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1.14 }}
            transition={{ duration: 24, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 bg-black/35" />

          <div className="relative z-10 px-6 py-14 md:py-20 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/70 mb-6">
              Vol. I — Special Correspondent Edition
            </div>
            <SparkleGlow>
              <h1
                className="font-serif font-black tracking-tighter leading-none uppercase text-white"
                style={{ fontSize: 'clamp(3rem,11vw,8rem)', textShadow: '3px 3px 0 rgba(0,0,0,0.35)' }}
              >
                Turasum
              </h1>
            </SparkleGlow>
            {/* Holographic stripe rule */}
            <div className="holo-stripe h-[3px] w-full mt-5 mb-5 opacity-80" />
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/80">
              Your camera roll · Turned into a story you remember
            </p>
          </div>
        </div>
      </header>

      {/* Everything past the hero — same electric-cobalt Y2K retro
          treatment (deep blue, grid overlay, floating CD discs) used on
          Feed and the landing page, so signed-in and signed-out pages read
          as one consistent system. */}
      <div className="relative" style={{ background: 'hsl(213 70% 8%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRID_BACKGROUND_IMAGE }} />
        <div className="cd-disc absolute -top-16 -right-16 w-64 h-64 opacity-25 pointer-events-none"
             style={{ animation: 'holo-spin 26s linear infinite' }} />
        <div className="cd-disc absolute top-1/3 -left-20 w-48 h-48 opacity-20 pointer-events-none"
             style={{ animation: 'holo-spin 32s linear infinite reverse' }} />
        <div className="holo-stripe absolute top-0 left-0 right-0 h-[2px] opacity-60" />

        <main className="relative max-w-5xl mx-auto px-6 py-16 space-y-24">
          {/* Upload — moved to the top of the page content so the primary
              action is immediately visible below the hero. */}
          <section><UploadFlow /></section>

          {/* Special Edition Covers */}
          <section className="space-y-0">
            <div className="border border-white/10">
              <div className="bg-white text-[hsl(213_70%_8%)] px-6 py-3 flex items-baseline justify-between">
                <h2 className="text-xl font-serif font-black uppercase tracking-tight">Special Edition Covers</h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-60">Hover to preview · 6 Editions</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-white/10">
                {COVER_STYLES.map(style => (
                  <CoverCard key={style.id} style={style} />
                ))}
              </div>
            </div>
          </section>

          {/* Format showcase — sits between "style your story" (Special
              Edition Covers) and "here are your finished stories" (the
              Archive), since it's about what you can do once a story
              exists rather than the upload step itself. */}
          <FormatShowcase />

          {/* Archive */}
          <section>
            <div className="border border-white/10">
              <div className="relative border-b border-white/10 px-6 py-4 flex items-baseline justify-between bg-white/5">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <h2 className="text-2xl font-serif font-black uppercase tracking-tight pl-2 text-white">The Archive</h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">Your Stories</span>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[180px] gap-4">
                    {[0, 1, 2, 3, 4].map(i => <div key={i} className={mosaicSpanClass(i)}><Skeleton className="w-full h-full min-h-[220px] rounded-none" /></div>)}
                  </div>
                ) : !Array.isArray(trips) || trips.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/20">
                    <FileText className="mx-auto h-10 w-10 text-white/40 mb-4 opacity-30" />
                    <h3 className="font-serif text-xl mb-1 text-white">No Stories Filed</h3>
                    <p className="text-white/50 font-mono text-xs uppercase tracking-widest">Submit a folder of photos above to begin</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[180px] gap-4" style={{ gridAutoFlow: 'dense' }}>
                    {trips.map((trip, i) => <MosaicTripCard key={trip.id} trip={trip} index={i} />)}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="relative border-t border-white/10 py-8 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Logo className="text-sm opacity-60 text-white" />
            <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
