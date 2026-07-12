import { useGetFeed, useGetDiscoverFeed, type FeedTripSummary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Map, Users, Compass, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function TripCard({ trip }: { trip: FeedTripSummary }) {
  return (
    <article className="relative bg-card border border-border h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/trips/${trip.id}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted border-b border-border p-6 flex flex-col justify-end">
          {trip.coverObjectPath ? (
            <>
              <img
                src={`/api/storage${trip.coverObjectPath}`}
                alt={trip.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent">
              <Map className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
          )}
          <div className="relative z-10 space-y-2 text-white">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-4 opacity-80">
              <span>{format(new Date(trip.createdAt), 'MMM yyyy')}</span>
            </div>
            <h3 className="text-3xl font-serif leading-tight drop-shadow-md">{trip.title}</h3>
          </div>
        </div>
      </Link>
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        {trip.summary && (
          <p className="text-muted-foreground text-sm line-clamp-3 font-serif italic">"{trip.summary}"</p>
        )}
        <Link href={`/users/${trip.owner.id}`} className="flex items-center gap-2 group w-fit">
          <Avatar className="h-6 w-6 rounded-none border border-border">
            <AvatarImage src={trip.owner.avatarUrl ?? undefined} alt={trip.owner.displayName} className="rounded-none" />
            <AvatarFallback className="rounded-none text-xs font-serif">
              {trip.owner.displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
            {trip.owner.displayName}
          </span>
        </Link>
      </div>
    </article>
  );
}

function TripGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default function Feed() {
  const { data: feedTrips, isLoading: isFeedLoading } = useGetFeed();
  const { data: discoverTrips, isLoading: isDiscoverLoading } = useGetDiscoverFeed();

  return (
    <div className="min-h-screen bg-background pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border">
        <Link href="/library" className="font-serif italic text-lg">Trip Correspondent</Link>
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
