import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Camera, Compass, Map, Newspaper, Volume2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AnimatedLogoMark } from '@/components/animated-logo';
import { HeroGlow, ChromeText } from '@/components/hero-glow';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="py-6 px-6 flex justify-between items-center border-b border-border">
        <Logo className="text-lg" />
        <div className="flex items-center gap-2">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-3">
            <Compass className="h-3.5 w-3.5" /> Explore
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" className="rounded-none font-mono text-xs uppercase tracking-widest">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-none font-mono text-xs uppercase tracking-widest">Sign Up</Button>
          </Link>
        </div>
      </nav>

      <header className="relative py-24 md:py-32 px-6 border-b border-border bg-card text-card-foreground overflow-hidden">
        <HeroGlow />
        <div className="relative max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 text-center">
          <AnimatedLogoMark className="h-14 w-14 md:h-16 md:w-16 text-primary" />
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-12 bg-primary"></span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Volume I</span>
            <span className="h-[1px] w-12 bg-primary"></span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight uppercase">
            <ChromeText>Turasum</ChromeText>
          </h1>
          <p className="text-muted-foreground font-serif italic text-lg md:text-xl max-w-xl">
            Your camera roll turned into a story you remember.
          </p>
          <div className="pt-6">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="rounded-none font-mono uppercase tracking-widest shadow-[0_0_35px_-8px_hsl(243_75%_55%/0.65)] hover:shadow-[0_0_45px_-6px_hsl(243_75%_55%/0.85)] transition-shadow"
              >
                Start Your Story
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <Feature
          icon={<Camera className="h-6 w-6" />}
          title="Upload & Cluster"
          description="Drop in your travel photos — they're automatically grouped into days by location and time."
        />
        <Feature
          icon={<Newspaper className="h-6 w-6" />}
          title="AI-Researched Narrative"
          description="Our correspondent researches the weather, landmarks, and history of each stop to write a magazine-style feature."
        />
        <Feature
          icon={<Map className="h-6 w-6" />}
          title="Route Map & Stats"
          description="See your journey traced on a map, with distance, countries, and conditions summarized at a glance."
        />
        <Feature
          icon={<Volume2 className="h-6 w-6" />}
          title="Listen, Share, Export"
          description="Hear each day narrated aloud, share a story card, or export the whole trip as a keepsake PDF."
        />
      </main>

      <footer className="py-16 px-6 border-t border-border text-center">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Sign in to file your first assignment
        </p>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="space-y-3">
      <div className="text-primary">{icon}</div>
      <h3 className="text-xl font-serif">{title}</h3>
      <p className="text-muted-foreground font-sans">{description}</p>
    </div>
  );
}
