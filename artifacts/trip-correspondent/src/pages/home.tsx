import { useListTrips } from '@workspace/api-client-react';
import { UploadFlow } from '@/components/upload-flow';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Map, AlertCircle, FileText, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useClerk } from '@clerk/react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: trips, isLoading } = useListTrips();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border">
        <span className="font-serif italic text-lg">Trip Correspondent</span>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-muted-foreground font-mono hidden sm:inline">
              {user.firstName ?? user.username ?? 'Correspondent'}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none font-mono text-xs uppercase tracking-widest"
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })}
          >
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Masthead */}
      <header className="py-12 px-6 border-b border-border bg-card text-card-foreground">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-12 bg-primary"></span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Volume I</span>
            <span className="h-[1px] w-12 bg-primary"></span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight text-center uppercase">
            Trip Correspondent
          </h1>
          <p className="text-muted-foreground font-serif italic text-lg max-w-xl text-center">
            Journalism for your personal journeys. Submit your photos, and our AI correspondent files the story.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        {/* Upload Section */}
        <section>
          <UploadFlow />
        </section>

        {/* Issues Gallery */}
        <section className="space-y-10">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <h2 className="text-3xl font-serif">Archived Features</h2>
            <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">The Library</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/5] w-full rounded-none" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map(trip => (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="group block">
                  <article className="relative bg-card border border-border h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    {/* Magazine Cover */}
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
                        <h3 className="text-3xl font-serif leading-tight drop-shadow-md">
                          {trip.title}
                        </h3>
                      </div>

                      {/* Status Badges */}
                      {(trip.status === 'pending' || trip.status === 'processing') && (
                        <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest px-3 py-1 animate-pulse">
                          Writing
                        </div>
                      )}
                      {trip.status === 'error' && (
                        <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs font-mono uppercase tracking-widest px-3 py-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Error
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      {trip.summary ? (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 font-serif italic">
                          "{trip.summary}"
                        </p>
                      ) : (
                        <div className="flex-grow" />
                      )}
                      
                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        {trip.startDate && trip.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'd, yyyy')}
                          </span>
                        )}
                        {trip.totalDistanceKm && (
                          <span>{Math.round(trip.totalDistanceKm)} KM</span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
