import { Link } from 'wouter';
import { useGetDiscoverFeed } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/logo';
import { ScrollVelocityStrip, type StripItem } from '@/components/scroll-velocity-strip';
import { DayNightHero } from '@/components/day-night-hero';
import { SparkleGlow } from '@/components/sparkle-glow';
import { HowItWorksSection } from '@/components/how-it-works-section';

export default function Landing() {
  const { data: discoverTrips } = useGetDiscoverFeed();
  const stripItems: StripItem[] = (Array.isArray(discoverTrips) ? discoverTrips : [])
    .filter(trip => trip.coverObjectPath)
    .map(trip => ({
      id: trip.id,
      src: `/api/storage${trip.coverObjectPath}`,
      label: trip.title,
    }));

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Logo className="text-lg" />
        <div className="flex items-center gap-2">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
            <Compass className="h-3 w-3" /> Explore
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em]">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em]">Sign Up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero — scroll-driven portal zoom.
          No bottom border: the indigo reveal bleeds seamlessly into
          the How It Works section that sits immediately below. */}
      <header className="relative">
        <DayNightHero daySrc="/window-interior.jpg" daySrcSet="/window-interior-640w.jpg 640w, /window-interior.jpg 1024w" nightSrc="/window-interior.jpg" portalItems={stripItems} windowX={50} windowY={40}>
          <div
            className="font-mono text-[9px] uppercase tracking-[0.5em] text-white mb-6 inline-block"
            style={{
              textShadow: '0 1px 8px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.7)',
              background: 'rgba(0,0,0,0.28)',
              padding: '4px 10px',
              letterSpacing: '0.5em',
            }}
          >
            Fall 2025 · Vol. I · Issue 1
          </div>

          <SparkleGlow>
            <h1
              className="font-serif font-black tracking-tighter leading-none uppercase text-white"
              style={{ fontSize: 'clamp(3.5rem,13vw,10rem)', textShadow: '4px 4px 0 rgba(0,0,0,0.35)' }}
            >
              Turasum
            </h1>
          </SparkleGlow>

          <div className="holo-stripe h-[3px] w-full max-w-xl mt-5 mb-5 opacity-90" />

          <p
            className="font-serif italic text-white mb-8"
            style={{
              fontSize: 'clamp(0.9rem,2.5vw,1.4rem)',
              textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 32px rgba(0,0,0,0.7)',
            }}
          >
            Turned into a story you remember
          </p>

          <Link href="/sign-up">
            <Button
              size="lg"
              className="rounded-none font-mono text-[10px] uppercase tracking-[0.25em] bg-white text-foreground hover:bg-white/90 border-0 shadow-[0_0_40px_-8px_rgba(255,255,255,0.5)] hover:shadow-[0_0_55px_-6px_rgba(255,255,255,0.7)] transition-all"
            >
              Start Your Story
            </Button>
          </Link>
        </DayNightHero>
      </header>

      {/* How It Works — immediately after the scroll, same indigo bg */}
      <HowItWorksSection />

      {/* Photo strip — community trips */}
      {stripItems.length > 0 && (
        <section
          className="relative py-10 border-b border-indigo-200/60"
          style={{ background: 'hsl(243 40% 97%)' }}
        >
          <div className="px-6 mb-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              From the field
            </span>
          </div>
          <ScrollVelocityStrip items={stripItems} />
        </section>
      )}

      {/* Footer */}
      <footer
        className="relative py-12 px-6 text-center"
        style={{ background: 'hsl(243 40% 97%)' }}
      >
        <div className="flex items-center justify-center gap-6 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link>
          <span className="h-3 w-px bg-border" />
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <span className="h-3 w-px bg-border" />
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </div>
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground/50 mt-4">
          © {new Date().getFullYear()} Turasum. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
