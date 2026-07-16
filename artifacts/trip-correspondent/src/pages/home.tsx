import { useListTrips } from '@workspace/api-client-react';
import { UploadFlow } from '@/components/upload-flow';
import { Link } from 'wouter';
import { FileText, Newspaper, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useClerk } from '@clerk/react';
import { Logo } from '@/components/logo';
import { MosaicTripCard, mosaicSpanClass } from '@/components/mosaic-trip-card';
import { HeroGlow, ChromeText } from '@/components/hero-glow';

type StyleDef = { id: string; name: string; bg: string; accent: string; fg: string; muted: string; description: string };

const COVER_STYLES: StyleDef[] = [
  { id: 'pop-art',          name: 'Pop Art',              bg: '#FFEC00', accent: '#E8112D', fg: '#0D0D0D', muted: '#3D3D3D', description: 'Bold primaries, thick borders, Ben-day energy' },
  { id: 'supermarket',      name: 'Supermarket',          bg: '#F5F5F0', accent: '#CC0000', fg: '#111111', muted: '#555555', description: 'Receipt paper white, barcode accents' },
  { id: 'camera-interface', name: 'Viewfinder Interface', bg: '#0A0A0A', accent: '#00FF41', fg: '#E8E8E8', muted: '#6B6B6B', description: 'Black EVF, green CRT readouts' },
  { id: 'canon-camera',     name: 'Canon Camera',         bg: '#1A1A1A', accent: '#E0051E', fg: '#F0F0F0', muted: '#8A8A8A', description: 'Classic body black, signature red' },
  { id: 'ios-core',         name: 'iOS Core',             bg: '#F2F2F7', accent: '#007AFF', fg: '#1C1C1E', muted: '#8E8E93', description: 'Light grouped backgrounds, system blue' },
  { id: 'android-core',     name: 'Android Core',         bg: '#1C1B1F', accent: '#D0BCFF', fg: '#E6E1E5', muted: '#938F99', description: 'Material dark surface, tertiary purple' },
];

export default function Home() {
  const { data: trips, isLoading } = useListTrips();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen pb-24">
      {/* Editorial masthead nav */}
      <nav className="py-3 px-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Logo className="text-lg" />
        <div className="flex items-center gap-2">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
          >
            <Newspaper className="h-3 w-3" /> Feed
          </Link>
          {user && (
            <Link
              href={`/users/${user.id}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            >
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

      {/* Editorial masthead — strong indigo, magazine-grade */}
      <header className="relative overflow-hidden border-b border-border">
        <HeroGlow />
        <div className="relative">
          {/* Thin editorial rule */}
          <div className="border-b border-border px-6 py-2 flex justify-between items-center bg-primary text-primary-foreground">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Field Correspondent Network</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Est. 2025</span>
          </div>
          <div className="px-6 py-14 md:py-20 text-center bg-card">
            <h1 className="text-[clamp(3rem,10vw,7rem)] font-serif font-black tracking-tighter leading-none uppercase text-foreground">
              Turasum
            </h1>
            <div className="w-full h-[2px] bg-foreground mt-4 mb-4" />
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Your camera roll · Turned into a story you remember
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* Upload / Dispatch section */}
        <section>
          <UploadFlow />
        </section>

        {/* Special Edition Covers — preview grid */}
        <section className="space-y-0">
          {/* Section masthead */}
          <div className="border border-border">
            <div className="bg-foreground text-background px-6 py-3 flex items-baseline justify-between">
              <h2 className="text-xl font-serif font-black uppercase tracking-tight">Special Edition Covers</h2>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-70">6 Editions</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border">
              {COVER_STYLES.map((style, i) => (
                <div key={style.id} className={`group ${i > 0 && i % 3 === 0 ? 'border-t border-border' : ''}`}>
                  {/* Mini cover swatch */}
                  <div className="relative h-32 overflow-hidden" style={{ backgroundColor: style.bg }}>
                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      <div>
                        <div className="h-[3px] w-10 mb-2" style={{ backgroundColor: style.accent }} />
                        <div className="font-black text-[22px] leading-none" style={{ color: style.fg, fontFamily: 'Georgia, serif', opacity: 0.85 }}>
                          Aa
                        </div>
                        <div className="text-[9px] mt-1 leading-tight" style={{ color: style.muted, fontFamily: 'monospace' }}>
                          {style.name.toUpperCase()}
                        </div>
                      </div>
                      {/* Photo placeholder blocks */}
                      <div className="flex gap-1.5">
                        <div className="h-12 flex-1 opacity-30" style={{ backgroundColor: style.fg }} />
                        <div className="h-12 w-7 opacity-20" style={{ backgroundColor: style.muted }} />
                      </div>
                    </div>
                    {/* Accent rule at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: style.accent }} />
                  </div>
                  {/* Label */}
                  <div className="px-4 py-3 bg-card border-t border-border">
                    <div className="font-serif font-black text-sm text-foreground">{style.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5 leading-relaxed">{style.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Archive section */}
        <section className="space-y-0">
          <div className="border border-border">
            {/* Section header bar */}
            <div className="relative border-b border-border px-6 py-4 flex items-baseline justify-between bg-card">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <h2 className="text-2xl font-serif font-black uppercase tracking-tight pl-2">The Archive</h2>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Your Stories</span>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[180px] gap-4">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className={mosaicSpanClass(i)}>
                      <Skeleton className="w-full h-full min-h-[220px] rounded-none" />
                    </div>
                  ))}
                </div>
              ) : !trips?.length ? (
                <div className="text-center py-20 border border-dashed border-border">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-30" />
                  <h3 className="font-serif text-xl mb-1">No Stories Filed</h3>
                  <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Submit a folder of photos above to begin</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[180px] gap-4" style={{ gridAutoFlow: 'dense' }}>
                  {trips.map((trip, i) => (
                    <MosaicTripCard key={trip.id} trip={trip} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo className="text-sm opacity-60" />
          <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
