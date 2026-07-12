import { useGetFeed, useGetDiscoverFeed } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Users, Compass, FileText } from 'lucide-react';
import { Logo } from '@/components/logo';
import { TripCard, TripGridSkeleton } from '@/components/trip-card';

export default function Feed() {
  const { data: feedTrips, isLoading: isFeedLoading } = useGetFeed();
  const { data: discoverTrips, isLoading: isDiscoverLoading } = useGetDiscoverFeed();

  return (
    <div className="min-h-screen bg-background pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border">
        <Link href="/library"><Logo className="text-lg" /></Link>
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">The Feed</span>
      </nav>

      <header className="py-12 px-6 border-b border-border bg-card text-card-foreground">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-12 bg-primary"></span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Wire Service</span>
            <span className="h-[1px] w-12 bg-primary"></span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tight text-center uppercase">
            The Feed
          </h1>
          <p className="text-muted-foreground font-serif italic text-lg max-w-xl text-center">
            Dispatches from correspondents you follow.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        <section className="space-y-10">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <h2 className="text-3xl font-serif flex items-center gap-3"><Users className="h-6 w-6 text-primary" /> Following</h2>
          </div>

          {isFeedLoading ? (
            <TripGridSkeleton />
          ) : !feedTrips?.length ? (
            <div className="text-center py-24 bg-accent/30 border border-border">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-serif text-xl mb-2">No Dispatches Yet</h3>
              <p className="text-muted-foreground">Follow other correspondents below to fill your feed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {feedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-10">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <h2 className="text-3xl font-serif flex items-center gap-3"><Compass className="h-6 w-6 text-primary" /> Discover</h2>
            <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Public Stories</span>
          </div>

          {isDiscoverLoading ? (
            <TripGridSkeleton />
          ) : !discoverTrips?.length ? (
            <div className="text-center py-24 bg-accent/30 border border-border">
              <Compass className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-serif text-xl mb-2">Nothing New to Discover</h3>
              <p className="text-muted-foreground">Check back later for public stories from new correspondents.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {discoverTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
