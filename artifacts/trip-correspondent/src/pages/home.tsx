import { useListTrips } from '@workspace/api-client-react';
import { UploadFlow } from '@/components/upload-flow';
import { Link } from 'wouter';
import { FileText, Newspaper, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useClerk } from '@clerk/react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { MosaicTripCard, mosaicSpanClass } from '@/components/mosaic-trip-card';
import { HeroGlow, ChromeText } from '@/components/hero-glow';

type StyleDef = { id: string; name: string; bg: string; accent: string; fg: string; muted: string; description: string };

const WRAPPED_STYLES: StyleDef[] = [
  { id: 'pop-art',          name: 'Pop Art',          bg: '#FFEC00', accent: '#E8112D', fg: '#0D0D0D', muted: '#3D3D3D', description: 'Bold primaries, thick borders, Ben-day energy' },
  { id: 'supermarket',      name: 'Supermarket',      bg: '#F5F5F0', accent: '#CC0000', fg: '#111111', muted: '#555555', description: 'Receipt paper white, barcode accents' },
  { id: 'camera-interface', name: 'Camera Interface', bg: '#0A0A0A', accent: '#00FF41', fg: '#E8E8E8', muted: '#6B6B6B', description: 'Black EVF, green CRT readouts' },
  { id: 'canon-camera',     name: 'Canon Camera',     bg: '#1A1A1A', accent: '#E0051E', fg: '#F0F0F0', muted: '#8A8A8A', description: 'Classic body black, signature red' },
  { id: 'ios-core',         name: 'iOS Core',         bg: '#F2F2F7', accent: '#007AFF', fg: '#1C1C1E', muted: '#8E8E93', description: 'Light grouped backgrounds, system blue' },
  { id: 'android-core',     name: 'Android Core',     bg: '#1C1B1F', accent: '#D0BCFF', fg: '#E6E1E5', muted: '#938F99', description: 'Material dark surface, tertiary purple' },
];

export default function Home() {
  const { data: trips, isLoading } = useListTrips();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-40">
        <Logo className="text-lg" />
        <div className="flex items-center gap-2">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-widest border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
          >
            <Newspaper className="h-3.5 w-3.5" /> Feed
          </Link>
          {user && (
            <Link
              href={`/users/${user.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-widest border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            >
              <UserCircle className="h-3.5 w-3.5" /> Profile
            </Link>
          )}
          {user && (
            <span className="text-sm text-muted-foreground font-mono hidden sm:inline px-2">
              {user.firstName ?? user.username ?? 'Correspondent'}
            </span>
          )}
          <button
            className="inline-flex items-center text-xs font-bold font-mono uppercase tracking-widest border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Masthead */}
      <header className="relative py-12 px-6 border-b border-border bg-card text-card-foreground overflow-hidden">
        <HeroGlow />
        <div className="relative max-w-6xl mx-auto flex flex-col items-center justify-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight text-center uppercase">
            <ChromeText>Turasum</ChromeText>
          </h1>
          <p className="text-muted-foreground font-serif italic text-lg max-w-xl text-center">
            Your camera roll turned into a story you remember.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        {/* Upload Section */}
        <section>
          <UploadFlow />
        </section>

        {/* Wrapped Styles */}
        <section className="space-y-10">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-3xl font-serif">Wrapped Editions</h2>
              <p className="text-sm text-muted-foreground font-mono mt-1">Choose a style when your story generates</p>
            </div>
            <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">6 Styles</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {WRAPPED_STYLES.map((style) => (
              <div key={style.id} className="border border-border overflow-hidden group hover:border-primary/60 transition-colors duration-200">
                {/* Mini cover preview */}
                <div className="relative h-28 overflow-hidden" style={{ backgroundColor: style.bg }}>
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <div>
                      <div className="h-1.5 w-8 mb-1.5 rounded-none" style={{ backgroundColor: style.accent }} />
                      <div className="h-2.5 w-16 rounded-none opacity-80" style={{ backgroundColor: style.fg }} />
                      <div className="h-1.5 w-12 mt-1 rounded-none" style={{ backgroundColor: style.muted, opacity: 0.5 }} />
                    </div>
                    <div className="h-16 w-full rounded-none opacity-20" style={{ backgroundColor: style.muted, maxWidth: '70%' }} />
                  </div>
                  {/* Accent bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ backgroundColor: style.accent }} />
                </div>
                <div className="p-3 bg-card border-t border-border">
                  <div className="font-serif font-bold text-sm text-foreground">{style.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5 leading-relaxed">{style.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Archived Features */}
        <section className="space-y-10 relative border-2 border-primary/20 p-8 md:p-10">
          {/* Y2K corner label */}
          <div className="absolute -top-3.5 left-8 bg-background px-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Archive</span>
          </div>
          <div className="flex items-end justify-between border-b border-border pb-4">
            <h2 className="text-3xl font-serif">Archived Features</h2>
            <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">The Library</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[180px] gap-4">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={mosaicSpanClass(i)}>
                  <Skeleton className="w-full h-full min-h-[220px] rounded-none" />
                </div>
              ))}
            </div>
          ) : !trips?.length ? (
            <div className="text-center py-24 bg-accent/30 border border-border">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-serif text-xl mb-2">No Stories Filed</h3>
              <p className="text-muted-foreground">Submit a folder of photos to dispatch our correspondent.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[180px] gap-4" style={{ gridAutoFlow: 'dense' }}>
              {trips.map((trip, i) => (
                <MosaicTripCard key={trip.id} trip={trip} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
