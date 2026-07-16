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
      <div className="text-center py-24 bg-accent/30 border border-border">
        <EmptyIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="font-serif text-xl mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

export default function Feed() {
  const { data: feedTrips, isLoading: isFeedLoading } = useGetFeed();
  const { data: followerTrips, isLoading: isFollowersLoading } = useGetFollowersFeed();
  const { data: discoverTrips, isLoading: isDiscoverLoading } = useGetDiscoverFeed();

  return (
    <div className="min-h-screen bg-background/95 pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border">
        <Link href="/library"><Logo className="text-lg" /></Link>
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">The Feed</span>
      </nav>

      <header className="relative py-12 px-6 border-b border-border overflow-hidden">
        <video
          src="/feed-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative max-w-6xl mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-12 bg-primary"></span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Wire Service</span>
            <span className="h-[1px] w-12 bg-primary"></span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tight text-center uppercase">
            The Feed
          </h1>
          <p className="text-muted-foreground font-serif italic text-lg max-w-xl text-center">
            Dispatches from your network, and beyond.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <Tabs defaultValue="following">
          <TabsList className="mb-10 w-full sm:w-auto rounded-none bg-accent/30 p-1">
            <TabsTrigger value="following" className="rounded-none font-mono text-xs uppercase tracking-widest gap-2">
              <Users className="h-3.5 w-3.5" /> Following
            </TabsTrigger>
            <TabsTrigger value="followers" className="rounded-none font-mono text-xs uppercase tracking-widest gap-2">
              <UserPlus className="h-3.5 w-3.5" /> Followers
            </TabsTrigger>
            <TabsTrigger value="discover" className="rounded-none font-mono text-xs uppercase tracking-widest gap-2">
              <Compass className="h-3.5 w-3.5" /> Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following">
            <FeedTabContent
              trips={feedTrips}
              isLoading={isFeedLoading}
              emptyIcon={Users}
              emptyTitle="No Dispatches Yet"
              emptyMessage="Follow other correspondents to fill this tab."
            />
          </TabsContent>

          <TabsContent value="followers">
            <FeedTabContent
              trips={followerTrips}
              isLoading={isFollowersLoading}
              emptyIcon={UserPlus}
              emptyTitle="No Followers Yet"
              emptyMessage="Trips from people who follow you will show up here."
            />
          </TabsContent>

          <TabsContent value="discover">
            <FeedTabContent
              trips={discoverTrips}
              isLoading={isDiscoverLoading}
              emptyIcon={Compass}
              emptyTitle="Nothing New to Discover"
              emptyMessage="Check back later for public stories from new correspondents."
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
