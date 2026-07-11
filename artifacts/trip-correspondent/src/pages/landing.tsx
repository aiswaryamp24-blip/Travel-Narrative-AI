import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Camera, Map, Newspaper, Volume2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="py-6 px-6 flex justify-between items-center border-b border-border">
        <span className="font-serif italic text-lg">Trip Correspondent</span>
        <div className="flex items-center gap-2">
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

      <header className="py-24 md:py-32 px-6 border-b border-border bg-card text-card-foreground">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 text-center">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-12 bg-primary"></span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Volume I</span>
            <span className="h-[1px] w-12 bg-primary"></span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight uppercase">
            Trip Correspondent
          </h1>
          <p className="text-muted-foreground font-serif italic text-lg md:text-xl max-w-xl">
            Journalism for your personal journeys. Submit your photos, and our AI correspondent files the story.
          </p>
          <div className="pt-6">
            <Link href="/sign-up">
              <Button size="lg" className="rounded-none font-mono uppercase tracking-widest">
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
