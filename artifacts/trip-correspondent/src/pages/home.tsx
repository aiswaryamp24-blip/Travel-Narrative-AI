import { useListTrips } from '@workspace/api-client-react';
import { UploadFlow } from '@/components/upload-flow';
import { Link } from 'wouter';
import { FileText, Newspaper, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useClerk } from '@clerk/react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { MosaicTripCard, mosaicSpanClass } from '@/components/mosaic-trip-card';

export default function Home() {
  const { data: trips, isLoading } = useListTrips();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border">
        <Logo className="text-lg" />
        <div className="flex items-center gap-3">
          <Link href="/feed" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            <Newspaper className="h-3.5 w-3.5" /> Feed
          </Link>
          {user && (
            <Link href={`/users/${user.id}`} className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              <UserCircle className="h-3.5 w-3.5" /> Profile
            </Link>
          )}
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
            Turasum
          </h1>
          <p className="text-muted-foreground font-serif italic text-lg max-w-xl text-center">
            Your camera roll, turned into a proper story.
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
