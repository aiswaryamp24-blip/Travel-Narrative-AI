import { Link } from 'wouter';
import { useGetDiscoverFeed } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Camera, Compass, Newspaper, Volume2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AnimatedLogoMark } from '@/components/animated-logo';
import { ScrollVelocityStrip, type StripItem } from '@/components/scroll-velocity-strip';
import { ThreeCubeBg } from '@/components/three-cube-bg';

export default function Landing() {
  const { data: discoverTrips } = useGetDiscoverFeed();
  const stripItems: StripItem[] = (discoverTrips ?? [])
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

      {/* Hero — electric cobalt magazine cover */}
      <header className="relative border-b-4 border-foreground overflow-hidden">
        {/* Info ticker */}
        <div className="relative px-6 py-2 flex items-center justify-between overflow-hidden"
             style={{ background: 'hsl(213 100% 44%)' }}>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/85">
            Turasum · Field Correspondent Network
          </span>
          <AnimatedLogoMark className="h-4 w-4 text-white/70" />
        </div>

        {/* Electric blue cover */}
        <div className="relative overflow-hidden" style={{ background: 'hsl(213 100% 44%)', minHeight: '55vh' }}>
          {/* Floating CD discs — like the magazine cover */}
          <div className="cd-disc absolute -top-20 -right-20 w-80 h-80 opacity-35 pointer-events-none"
               style={{ animation: 'holo-spin 24s linear infinite' }} />
          <div className="cd-disc absolute bottom-0 -left-16 w-60 h-60 opacity-28 pointer-events-none"
               style={{ animation: 'holo-spin 30s linear infinite reverse' }} />
          <div className="cd-disc absolute top-12 left-1/4 w-36 h-36 opacity-20 pointer-events-none"
               style={{ animation: 'holo-spin 18s linear infinite' }} />
          <div className="cd-disc absolute bottom-12 right-1/4 w-24 h-24 opacity-18 pointer-events-none"
               style={{ animation: 'holo-spin 14s linear infinite reverse' }} />

          {/* Three.js cube — right accent */}
          <div className="absolute right-0 top-0 bottom-0 w-64 md:w-80 pointer-events-none opacity-15">
            <ThreeCubeBg className="w-full h-full" />
          </div>

          {/* Cover content */}
          <div className="relative z-10 px-6 py-20 md:py-28 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/60 mb-6">
              Fall 2025 · Vol. I · Issue 1
            </div>

            <h1
              className="font-serif font-black tracking-tighter leading-none uppercase text-white"
              style={{ fontSize: 'clamp(3.5rem,13vw,10rem)', textShadow: '4px 4px 0 rgba(0,0,0,0.22)' }}
            >
              Turasum
            </h1>

            {/* Holographic rule */}
            <div className="holo-stripe h-[3px] w-full mt-5 mb-3 opacity-90" />
            <p
              className="font-serif italic text-white/80 mt-2 mb-1"
              style={{ fontSize: 'clamp(0.9rem,2.5vw,1.4rem)' }}
            >
              Y2K and the art of the travel story
            </p>
            <div className="holo-stripe h-[2px] w-full mt-3 mb-8 opacity-60" />

            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/65 mb-8">
              Your camera roll · Turned into a story you remember
            </p>

            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-none font-mono text-[10px] uppercase tracking-[0.25em] bg-white text-foreground hover:bg-white/90 border-0 shadow-[0_0_40px_-8px_rgba(255,255,255,0.5)] hover:shadow-[0_0_55px_-6px_rgba(255,255,255,0.7)] transition-all"
              >
                Start Your Story
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Photo strip */}
      {stripItems.length > 0 && (
        <section className="py-10 border-b border-border bg-card">
          <ScrollVelocityStrip items={stripItems} />
        </section>
      )}

      {/* Features */}
      <main className="border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="px-6 py-4 border-b border-border flex items-baseline justify-between">
            <h2 className="font-serif font-black text-sm uppercase tracking-tight">How It Works</h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">4 Steps</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <Feature icon={<Camera className="h-5 w-5" />} step="01" title="Upload & Cluster" description="Drop in your travel photos — they're automatically grouped into days by location and time." />
            <Feature icon={<Newspaper className="h-5 w-5" />} step="02" title="AI-Researched Narrative" description="Our correspondent researches the weather, landmarks, and history of each stop to write a magazine-style feature." />
            <Feature icon={<img src="/icon-plane.png" alt="" className="h-5 w-5 object-contain" />} step="03" title="Route Map & Stats" description="See your journey traced on a map, with distance, countries, and conditions summarised at a glance." />
            <Feature icon={<Volume2 className="h-5 w-5" />} step="04" title="Listen, Share, Export" description="Hear each day narrated aloud, share a story card, or export the whole trip as a keepsake Special Edition Cover." />
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-border text-center">
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

function Feature({ icon, step, title, description }: { icon: React.ReactNode; step: string; title: string; description: string }) {
  return (
    <div className="p-8 md:p-10 space-y-4 border-b border-border md:border-b-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground border border-border px-2 py-1">{step}</span>
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-xl font-serif font-black">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </div>
  );
}
