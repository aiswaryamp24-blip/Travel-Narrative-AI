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

      {/* Masthead — electric cobalt, Feed edition */}
      <header className="relative border-b-4 border-foreground overflow-hidden">
        {/* Info bar */}
        <div className="relative px-6 py-2 flex items-center justify-between"
             style={{ background: 'hsl(213 100% 44%)' }}>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/85">The Feed</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/85">Turasum Wire Service</span>
        </div>

        {/* Electric blue hero with CD decorations */}
        <div className="relative overflow-hidden" style={{ background: 'hsl(213 100% 44%)' }}>
          {/* CD disc decorations */}
          <div className="cd-disc absolute -top-12 -right-12 w-56 h-56 opacity-28 pointer-events-none"
               style={{ animation: 'holo-spin 20s linear infinite' }} />
          <div className="cd-disc absolute -bottom-10 -left-10 w-44 h-44 opacity-22 pointer-events-none"
               style={{ animation: 'holo-spin 26s linear infinite reverse' }} />

          <div className="relative z-10 px-6 py-12 text-center">
            <h1 className="font-serif font-black tracking-tighter leading-none uppercase text-white"
                style={{ fontSize: 'clamp(2.5rem,8vw,6rem)', textShadow: '3px 3px 0 rgba(0,0,0,0.2)' }}>
              The Feed
            </h1>
            <div className="holo-stripe h-[3px] w-full mt-3 mb-3 opacity-80" />
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/65">
              Dispatches from your network · and beyond
            </p>
          </div>
        </div>
      </header>

      {/* Tabs + content — electric cobalt deep background */}
      <div
        className="relative"
        style={{ background: 'hsl(213 70% 8%)' }}
      >
        {/* Y2K grid overlay — now blue-tinted */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,120,255,0.10) 39px, rgba(0,120,255,0.10) 40px)',
              'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,120,255,0.10) 39px, rgba(0,120,255,0.10) 40px)',
            ].join(', '),
          }}
        />
        {/* Holographic top/bottom accent lines */}
        <div className="holo-stripe absolute top-0 left-0 right-0 h-[2px] opacity-60" />
        <div className="holo-stripe absolute bottom-0 left-0 right-0 h-[1px] opacity-40" />

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
