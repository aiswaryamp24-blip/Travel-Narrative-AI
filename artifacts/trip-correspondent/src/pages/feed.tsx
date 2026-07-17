import { useGetFeed, useGetFollowersFeed, useGetDiscoverFeed, type FeedTripSummary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Users, UserPlus, Compass, type LucideIcon } from 'lucide-react';
import { Logo } from '@/components/logo';
import { TripCard, TripGridSkeleton } from '@/components/trip-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { CursorSpotlight } from '@/components/cursor-spotlight';

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
      <div className="text-center py-24 border border-dashed border-border">
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
        <span className="text-[10px] font-black font-mono uppercase tracking-[0.3em] text-muted-foreground border border-border px-3 py-1.5">Wire Service</span>
      </nav>

      {/* Hero — plane-exterior photo with deep indigo overlay */}
      <header className="relative border-b-4 border-foreground overflow-hidden" style={{ minHeight: '32vh' }}>
        <CursorSpotlight color="180,160,255" opacity={0.18} radius={500} />
        <motion.img
          src="/feed-hero-sunset.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          initial={{ scale: 1.04 }}
          animate={{ scale: 1.10 }}
          transition={{ duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        {/* Indigo overlay — replaces the flat cobalt */}
        <div className="absolute inset-0" style={{ background: 'hsl(243 55% 22% / 0.82)' }} />

        <div className="relative z-10 px-6 py-10 md:py-14 text-center">
          <div className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/60 mb-3">
            Turasum · Wire Service
          </div>
          <h1
            className="font-serif font-black tracking-tighter leading-none uppercase text-white"
            style={{ fontSize: 'clamp(2.5rem,8vw,6rem)', textShadow: '3px 3px 0 rgba(0,0,0,0.35)' }}
          >
            The Feed
          </h1>
          <div className="holo-stripe h-[2px] w-full max-w-md mx-auto mt-3 mb-3 opacity-70" />
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/65">
            Dispatches from your network · and beyond
          </p>
        </div>
      </header>

      {/* Tabs + content on the normal page background */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Tabs defaultValue="following">
          <TabsList className="mb-8 w-full sm:w-auto rounded-none bg-muted border border-border p-1">
            <TabsTrigger
              value="following"
              className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
            >
              <Users className="h-3.5 w-3.5" /> Following
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
            >
              <UserPlus className="h-3.5 w-3.5" /> Followers
            </TabsTrigger>
            <TabsTrigger
              value="discover"
              className="rounded-none font-mono text-[10px] uppercase tracking-[0.2em] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
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
