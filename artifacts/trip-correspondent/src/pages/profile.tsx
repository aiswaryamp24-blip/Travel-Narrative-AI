import { useGetUserProfile, getGetUserProfileQueryKey } from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { format } from 'date-fns';
import { ChevronLeft, AlertTriangle, Map, FileText, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from '@/components/follow-button';
import { DigestsSection } from '@/components/digests-section';
import { Logo } from '@/components/logo';

export default function Profile() {
  const { id } = useParams();
  const userId = id ?? '';

  const { data: profile, isLoading, isError } = useGetUserProfile(userId, {
    query: { queryKey: getGetUserProfileQueryKey(userId), enabled: !!userId },
  });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 space-y-6 bg-background">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div>
          <h1 className="text-3xl font-serif mb-2">Correspondent Not Found</h1>
          <p className="text-muted-foreground">This profile doesn't exist.</p>
        </div>
        <Link href="/feed" className="inline-flex items-center text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/95 pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border">
        <Link href="/feed" className="inline-flex items-center text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Feed
        </Link>
        <Logo className="text-lg" />
      </nav>

      <header className="py-16 px-6 border-b border-border bg-card text-card-foreground">
        <div className="max-w-3xl mx-auto flex flex-col items-center space-y-6 text-center">
          <Avatar className="h-24 w-24 border border-border rounded-none">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} className="rounded-none" />
            <AvatarFallback className="rounded-none text-2xl font-serif">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-black uppercase tracking-tight">{profile.displayName}</h1>
            <div className="flex items-center justify-center gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span>{profile.followerCount} Followers</span>
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span>{profile.followingCount} Following</span>
            </div>
          </div>
          {!profile.isSelf && <FollowButton userId={profile.id} isFollowing={profile.isFollowing} />}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        {profile.isSelf && (
          <DigestsSection userId={profile.id} digestCadenceMonths={profile.digestCadenceMonths} />
        )}

        <div className="flex items-end justify-between border-b border-border pb-4">
          <h2 className="text-3xl font-serif">{profile.isSelf ? 'Your Stories' : 'Filed Stories'}</h2>
          <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            {profile.trips.length} {profile.trips.length === 1 ? 'Story' : 'Stories'}
          </span>
        </div>

        {profile.trips.length === 0 ? (
          <div className="text-center py-24 bg-accent/30 border border-border">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-serif text-xl mb-2">No Stories Visible</h3>
            <p className="text-muted-foreground">
              {profile.isSelf ? 'Submit a folder of photos to dispatch our correspondent.' : 'Follow this correspondent to see their friends-only stories.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {profile.trips.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="group block">
                <article className="relative bg-card border border-border h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
                    {trip.status === 'error' && (
                      <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs font-mono uppercase tracking-widest px-3 py-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Error
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-grow">
                    {trip.summary && (
                      <p className="text-muted-foreground text-sm line-clamp-3 font-serif italic">"{trip.summary}"</p>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border py-4 px-6 flex justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-32" />
      </nav>
      <header className="py-16 px-6 flex flex-col items-center space-y-6 border-b border-border">
        <Skeleton className="h-24 w-24 rounded-none" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </header>
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-none" />
          ))}
        </div>
      </main>
    </div>
  );
}
