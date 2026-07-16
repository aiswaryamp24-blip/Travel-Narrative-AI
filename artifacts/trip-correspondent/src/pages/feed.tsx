import { useGetFeed, useGetFollowersFeed, useGetDiscoverFeed, type FeedTripSummary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Users, UserPlus, Compass, type LucideIcon } from 'lucide-react';
import { Logo } from '@/components/logo';
import { TripCard, TripGridSkeleton } from '@/components/trip-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function FeedTabContent({
  trips,
  isLoading,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyMessage,
}: {
  trips: FeedTripSummary[] | undefined;
  isLoading: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyMessage: string;
}) {
  if (isLoading) return <TripGridSkeleton />;
  if (!trips?.length) {
    return (
      <div className="text-center py-24 border border-dashed border-primary/20">
        <EmptyIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-30" />
        <h3 className="font-serif text-xl mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
    </div>
  );
}

export default function Feed() {
  const { data: feedTrips, isLoading: isFeedLoading } = useGetFeed();
  const { data: followerTrips, isLoading: isFollowersLoading } = useGetFollowersFeed();
  const { data: discoverTrips, isLoading: isDiscoverLoading } = useGetDiscoverFeed();

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Nav */}
      <nav className="py-3 px-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/library"><Logo className="text-lg" /></Link>
        <span className="text-[10px] font-black font-mono uppercase tracking-[0.3em] text-muted-foreground border border-primary/30 px-3 py-1.5">Wire Service</span>
      </nav>

      {/* Masthead */}
      <header className="relative border-b border-border overflow-hidden">
        {/* Watercolor top layer (soft blue blobs) */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', inset: 0,
            background: [
              'radial-gradient(ellipse 80% 60% at 15% 25%, rgba(147,197,253,0.32) 0%, transparent 65%)',
              'radial-gradient(ellipse 60% 50% at 80% 60%, rgba(196,219,255,0.28) 0%, transparent 60%)',
              'hsl(var(--background))',
            ].join(', '),
          }} />
          {/* Airplane + contrail SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.10]" viewBox="0 0 800 220" preserveAspectRatio="xMidYMid slice" fill="none">
            <path d="M 40 160 Q 180 60 360 95 Q 520 130 680 40" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="5 8" />
            <g transform="translate(676, 32) rotate(-32)">
              <path d="M0 0 L-9 4.5 L-7 0 L-9 -4.5 Z" fill="hsl(var(--primary))" />
              <path d="M-5 0 L-12 -7 L-13 -6 L-7 0 L-13 6 L-12 7 Z" fill="hsl(var(--primary))" />
            </g>
          </svg>
        </div>

        {/* Editorial bar */}
        <div className="relative bg-primary text-primary-foreground px-6 py-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em]">The Feed</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Turasum Wire Service</span>
        </div>
        <div className="relative px-6 py-12 text-center bg-card/70 backdrop-blur-sm">
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-serif font-black tracking-tighter leading-none uppercase text-foreground">
            The Feed
          </h1>
          <div className="w-full h-[2px] bg-foreground mt-3 mb-3" />
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            Dispatches from your network · and beyond
          </p>
        </div>
      </header>

      {/* Tabs + content area with Y2K indigo background */}
      <div
        className="relative"
        style={{
          background: [
            /* Base deep indigo */
            'hsl(234 40% 10%)',
          ].join(', '),
        }}
      >
        {/* Y2K grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              /* Horizontal lines */
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(99,102,241,0.12) 39px, rgba(99,102,241,0.12) 40px)',
              /* Vertical lines */
              'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(99,102,241,0.12) 39px, rgba(99,102,241,0.12) 40px)',
            ].join(', '),
          }}
        />
        {/* Diagonal neon accent bars (Y2K) */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(243 75% 55% / 0.6), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(243 75% 55% / 0.3), transparent)' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-12">
          <Tabs defaultValue="following">
            <TabsList className="mb-8 w-full sm:w-auto rounded-none bg-white/5 backdrop-blur-sm border border-white/10 p-1">
              <TabsTrigger
                value="following"
                className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em] gap-2 text-white/60 data-[state=active]:text-white data-[state=active]:bg-primary data-[state=active]:shadow-none"
              >
                <Users className="h-3.5 w-3.5" /> Following
              </TabsTrigger>
              <TabsTrigger
                value="followers"
                className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em] gap-2 text-white/60 data-[state=active]:text-white data-[state=active]:bg-primary data-[state=active]:shadow-none"
              >
                <UserPlus className="h-3.5 w-3.5" /> Followers
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em] gap-2 text-white/60 data-[state=active]:text-white data-[state=active]:bg-primary data-[state=active]:shadow-none"
              >
                <Compass className="h-3.5 w-3.5" /> Discover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="following">
              <FeedTabContent trips={feedTrips} isLoading={isFeedLoading} emptyIcon={Users} emptyTitle="No Dispatches Yet" emptyMessage="Follow other correspondents to fill this tab" />
            </TabsContent>
            <TabsContent value="followers">
              <FeedTabContent trips={followerTrips} isLoading={isFollowersLoading} emptyIcon={UserPlus} emptyTitle="No Followers Yet" emptyMessage="Trips from people who follow you appear here" />
            </TabsContent>
            <TabsContent value="discover">
              <FeedTabContent trips={discoverTrips} isLoading={isDiscoverLoading} emptyIcon={Compass} emptyTitle="Nothing New to Discover" emptyMessage="Check back later for public stories" />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-6 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <span className="h-3 w-px bg-border" />
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
