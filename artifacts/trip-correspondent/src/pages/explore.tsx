import { useGetDiscoverFeed } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TripCard, TripGridSkeleton } from '@/components/trip-card';
import { Logo } from '@/components/logo';
import { HeroGlow, ChromeText } from '@/components/hero-glow';

/**
 * The logged-out front door: public trips, no account required to browse.
 * Distinct from feed.tsx's "Discover" section (which additionally shows a
 * signed-in user's "Following" feed) — this page is the marketing funnel
 * for visitors who land on the site without an account yet.
 */
export default function Explore() {
  const { data: trips, isLoading } = useGetDiscoverFeed();

  return (
    <div className="min-h-screen bg-background/95 pb-24">
      <nav className="py-6 px-6 flex justify-between items-center border-b border-border">
        <Link href="/"><Logo className="text-lg" /></Link>
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

      <header className="relative py-16 px-6 border-b border-border bg-secondary text-secondary-foreground overflow-hidden">
        <HeroGlow />
        <div className="relative max-w-4xl mx-auto flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-12 bg-primary"></span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-foreground/70">
              <Compass className="h-3 w-3 inline mr-2" />
              Explore
            </span>
            <span className="h-[1px] w-12 bg-primary"></span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tight uppercase">
            <ChromeText>Real Trips, Really Told</ChromeText>
          </h1>
          <p className="text-secondary-foreground/80 font-serif italic text-lg md:text-xl max-w-xl">
            Public stories from people using Turasum for their own travels.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {isLoading ? (
          <TripGridSkeleton />
        ) : !trips?.length ? (
          <div className="text-center py-24 bg-accent/30 border border-border">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-serif text-xl mb-2">Nothing Public Yet</h3>
            <p className="text-muted-foreground">Be the first to publish a story.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        <div className="mt-24 text-center border-t border-border pt-16">
          <h2 className="text-3xl font-serif mb-4">Got a trip worth telling?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Upload your own photos and Turasum researches and writes the story for you.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="rounded-none font-mono uppercase tracking-widest">
              Start Your Story
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
