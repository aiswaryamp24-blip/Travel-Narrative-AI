import { Link } from 'wouter';
import { useGetDiscoverFeed } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Camera, Compass, Newspaper, Volume2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AnimatedLogoMark } from '@/components/animated-logo';
import { ScrollVelocityStrip, type StripItem } from '@/components/scroll-velocity-strip';

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

      {/* Editorial masthead */}
      <header className="relative border-b border-border overflow-hidden">
        {/* Indigo aurora */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: [
            'radial-gradient(ellipse 65% 55% at 20% 20%, hsl(243 75% 55% / 0.13) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 45% at 75% 75%, hsl(260 70% 60% / 0.10) 0%, transparent 60%)',
            'hsl(var(--background))',
          ].join(', '),
        }} />

        {/* Top editorial bar */}
        <div className="relative bg-foreground text-background px-6 py-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Turasum · Field Correspondent Network</span>
          <AnimatedLogoMark className="h-4 w-4 text-background" />
        </div>

        <div className="relative px-6 py-20 md:py-28 text-center bg-card/60 backdrop-blur-sm">
          <h1 className="text-[clamp(3.5rem,12vw,9rem)] font-serif font-black tracking-tighter leading-none uppercase text-foreground">
            Turasum
          </h1>
          <div className="w-full h-[3px] bg-foreground mt-5 mb-5" />
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.35em] text-muted-foreground max-w-sm mx-auto">
            Your camera roll · Turned into a story you remember
          </p>
          <div className="pt-8">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-none font-mono text-[10px] uppercase tracking-[0.25em] shadow-[0_0_35px_-8px_hsl(243_75%_55%/0.65)] hover:shadow-[0_0_45px_-6px_hsl(243_75%_55%/0.85)] transition-shadow"
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

      {/* Features — magazine column layout */}
      <main className="border-b border-border">
        <div className="max-w-5xl mx-auto">
          {/* Section head */}
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
    <div className="p-8 md:p-10 space-y-4 group border-b border-border md:border-b-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground border border-border px-2 py-1">{step}</span>
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-xl font-serif font-black">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </div>
  );
}
