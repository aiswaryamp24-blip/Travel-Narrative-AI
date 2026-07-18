import {
  useGetUserProfile,
  getGetUserProfileQueryKey,
  useGetUserTripDayLocations,
  getGetUserTripDayLocationsQueryKey,
  useRespondToCompanionTag,
  type UserProfile,
  type TripDayLocation,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { format } from 'date-fns';
import { ChevronLeft, AlertTriangle, Map, FileText, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from '@/components/follow-button';
import { DigestsSection } from '@/components/digests-section';
import { Logo } from '@/components/logo';
import { EverywhereMap } from '@/components/everywhere-map';

/** Compass-rose + fox SVG watermark — light strokes for the dark navy backdrop. */
function CompassFoxWatermark() {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Outer circle */}
      <circle cx="150" cy="150" r="118" stroke="hsl(210 60% 75%)" strokeWidth="1.2" opacity="0.22" />
      {/* Inner circle */}
      <circle cx="150" cy="150" r="90" stroke="hsl(210 60% 75%)" strokeWidth="0.8" opacity="0.16" />
      {/* Meridian grid lines */}
      <line x1="150" y1="32" x2="150" y2="268" stroke="hsl(210 60% 75%)" strokeWidth="0.6" opacity="0.14" />
      <line x1="32" y1="150" x2="268" y2="150" stroke="hsl(210 60% 75%)" strokeWidth="0.6" opacity="0.14" />
      <line x1="67" y1="67" x2="233" y2="233" stroke="hsl(210 60% 75%)" strokeWidth="0.6" opacity="0.10" />
      <line x1="233" y1="67" x2="67" y2="233" stroke="hsl(210 60% 75%)" strokeWidth="0.6" opacity="0.10" />

      {/* Compass star — 4 main points, north bright gold */}
      <path d="M 150 32 L 158 140 L 150 150 L 142 140 Z" fill="hsl(45 85% 70%)" opacity="0.55" />
      <path d="M 150 268 L 158 160 L 150 150 L 142 160 Z" fill="hsl(210 60% 75%)" opacity="0.25" />
      <path d="M 32 150 L 140 142 L 150 150 L 140 158 Z" fill="hsl(210 60% 75%)" opacity="0.25" />
      <path d="M 268 150 L 160 142 L 150 150 L 160 158 Z" fill="hsl(210 60% 75%)" opacity="0.25" />
      {/* 4 secondary compass points */}
      <path d="M 67 67 L 145 145 L 150 150 L 144 146 Z" fill="hsl(210 60% 75%)" opacity="0.14" />
      <path d="M 233 67 L 155 145 L 150 150 L 156 146 Z" fill="hsl(210 60% 75%)" opacity="0.14" />
      <path d="M 67 233 L 145 155 L 150 150 L 144 156 Z" fill="hsl(210 60% 75%)" opacity="0.14" />
      <path d="M 233 233 L 155 155 L 150 150 L 156 156 Z" fill="hsl(210 60% 75%)" opacity="0.14" />

      {/* Fox outline — minimal line art, sitting within the compass circle */}
      {/* Fox body (curled) */}
      <path
        d="M 138 170 Q 128 165 125 155 Q 122 145 128 138 Q 134 130 142 128 Q 150 126 158 130 Q 164 134 164 142 Q 164 150 158 158 Q 155 162 150 164 Q 145 166 140 170"
        stroke="hsl(45 85% 72%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* Fox head */}
      <path
        d="M 155 130 Q 162 122 166 118 Q 163 124 168 124 Q 164 126 162 132"
        stroke="hsl(45 85% 72%)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Fox ear left */}
      <path d="M 155 128 L 152 118 L 160 126" stroke="hsl(45 85% 72%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      {/* Fox ear right */}
      <path d="M 162 122 L 168 112 L 170 124" stroke="hsl(45 85% 72%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      {/* Fox tail — big sweeping arc to left */}
      <path
        d="M 138 170 Q 120 178 112 170 Q 104 162 112 154 Q 118 148 128 152"
        stroke="hsl(45 85% 72%)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export default function Profile() {
  const { id } = useParams();
  const userId = id ?? '';

  const { data: profile, isLoading, isError } = useGetUserProfile(userId, {
    query: { queryKey: getGetUserProfileQueryKey(userId), enabled: !!userId },
  });
  const { data: tripDayLocations } = useGetUserTripDayLocations(userId, {
    query: { queryKey: getGetUserTripDayLocationsQueryKey(userId), enabled: !!userId },
  });

  if (isLoading) return <ProfileSkeleton />;

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

  return <ProfileContent profile={profile} tripDayLocations={tripDayLocations} />;
}

function ProfileContent({
  profile,
  tripDayLocations,
}: {
  profile: UserProfile;
  tripDayLocations: TripDayLocation[] | undefined;
}) {
  const queryClient = useQueryClient();
  const respondToInvite = useRespondToCompanionTag();

  const handleRespond = async (tripId: number, accept: boolean) => {
    try {
      await respondToInvite.mutateAsync({ tripId, userId: profile.id, data: { accept } });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(profile.id) });
      toast.success(accept ? 'Invite accepted.' : 'Invite declined.');
    } catch {
      toast.error('Failed to respond to invite.');
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <nav className="py-3 px-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/feed" className="inline-flex items-center text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Feed
        </Link>
        <Logo className="text-lg" />
      </nav>

      {/* Profile header — navy night-sky backdrop */}
      <header className="relative overflow-hidden border-b border-border">
        {/* Night-sky layered background */}
        <div className="absolute inset-0">
          {/* Base: deep navy gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, hsl(228 55% 8%) 0%, hsl(235 60% 11%) 40%, hsl(240 55% 9%) 100%)',
            }}
          />
          {/* Nebula swirls — soft lighter-navy clouds */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                'radial-gradient(ellipse 70% 55% at 20% 30%, hsl(230 60% 18% / 0.70) 0%, transparent 65%)',
                'radial-gradient(ellipse 55% 65% at 80% 70%, hsl(245 55% 16% / 0.65) 0%, transparent 60%)',
                'radial-gradient(ellipse 40% 35% at 60% 15%, hsl(220 50% 22% / 0.50) 0%, transparent 55%)',
                'radial-gradient(ellipse 35% 40% at 10% 85%, hsl(250 50% 14% / 0.55) 0%, transparent 55%)',
              ].join(', '),
            }}
          />
          {/* Faint star-dust shimmer */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: [
                'radial-gradient(1px 1px at 12% 18%, hsl(210 80% 85%) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 35% 8%, hsl(210 70% 90%) 0%, transparent 100%)',
                'radial-gradient(1.5px 1.5px at 55% 25%, hsl(45 80% 85%) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 72% 12%, hsl(210 80% 85%) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 88% 30%, hsl(210 70% 90%) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 25% 55%, hsl(210 80% 85%) 0%, transparent 100%)',
                'radial-gradient(1.5px 1.5px at 45% 72%, hsl(45 80% 85%) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 78% 65%, hsl(210 80% 85%) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 92% 78%, hsl(210 70% 90%) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 5% 90%, hsl(210 80% 85%) 0%, transparent 100%)',
                'radial-gradient(1.5px 1.5px at 62% 88%, hsl(45 80% 85%) 0%, transparent 100%)',
              ].join(', '),
            }}
          />
          {/* Compass-rose + fox watermark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-xs h-64 relative">
              <CompassFoxWatermark />
            </div>
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-20 flex flex-col items-center space-y-6 text-center">
          {/* Avatar */}
          <div className="relative">
            <div
              className="absolute -inset-1 rounded-none opacity-50"
              style={{ background: 'linear-gradient(135deg, hsl(45 85% 65%), hsl(210 60% 55%))' }}
            />
            <Avatar className="h-24 w-24 relative border-2 border-white/20 rounded-none shadow-lg">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} className="rounded-none" />
              <AvatarFallback className="rounded-none text-2xl font-serif bg-white/10 text-white">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-black uppercase tracking-tight text-white drop-shadow-md">
              {profile.displayName}
            </h1>
            <div className="flex items-center justify-center gap-6 text-xs font-mono uppercase tracking-widest text-white/60">
              <span>{profile.followerCount} Followers</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{profile.followingCount} Following</span>
            </div>
          </div>

          {!profile.isSelf && <FollowButton userId={profile.id} isFollowing={profile.isFollowing} />}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {profile.isSelf && (profile.pendingCompanionInvites?.length ?? 0) > 0 && (
          <div className="border border-primary/30 bg-primary/5">
            <div className="px-6 py-3 border-b border-primary/30">
              <h2 className="font-mono text-xs uppercase tracking-widest text-primary">
                Trip Invites Waiting On You
              </h2>
            </div>
            <div className="divide-y divide-border">
              {(profile.pendingCompanionInvites ?? []).map(({ trip, taggedBy }) => (
                <div key={trip.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-lg">{trip.title}</p>
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                      Tagged by {taggedBy.displayName}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-none gap-1.5"
                      onClick={() => handleRespond(trip.id, false)}
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-none gap-1.5"
                      onClick={() => handleRespond(trip.id, true)}
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.isSelf && (
          <DigestsSection
            userId={profile.id}
            digestCadenceMonths={profile.digestCadenceMonths}
            preferredDigestStyle={profile.preferredDigestStyle}
            digestEmailEnabled={profile.digestEmailEnabled}
          />
        )}

        {Array.isArray(tripDayLocations) && <EverywhereMap locations={tripDayLocations} />}

        {(profile.companionTrips?.length ?? 0) > 0 && (
          <div className="border border-border">
            <div className="relative border-b border-border px-6 py-4 flex items-baseline justify-between bg-card">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <h2 className="text-2xl font-serif font-black uppercase tracking-tight pl-2">Tagged In</h2>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                {profile.companionTrips?.length ?? 0} {(profile.companionTrips?.length ?? 0) === 1 ? 'Story' : 'Stories'}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(profile.companionTrips ?? []).map((trip) => (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="group block">
                  <article className="relative bg-card border border-border h-full flex flex-col hover:border-primary/50 transition-colors duration-300">
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted border-b border-border">
                      {trip.coverObjectPath ? (
                        <img
                          src={`/api/storage${trip.coverObjectPath}`}
                          alt={trip.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-accent">
                          <Map className="h-16 w-16 text-muted-foreground opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-2xl font-serif leading-tight drop-shadow-md">{trip.title}</h3>
                      </div>
                      {trip.status === 'error' && (
                        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[9px] font-mono uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Error
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="border border-border">
          <div className="relative border-b border-border px-6 py-4 flex items-baseline justify-between bg-card">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <h2 className="text-2xl font-serif font-black uppercase tracking-tight pl-2">
              {profile.isSelf ? 'Your Stories' : 'Filed Stories'}
            </h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              {profile.trips?.length ?? 0} {(profile.trips?.length ?? 0) === 1 ? 'Story' : 'Stories'}
            </span>
          </div>

          <div className="p-6">
            {(profile.trips?.length ?? 0) === 0 ? (
              <div className="text-center py-20 border border-dashed border-border">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-30" />
                <h3 className="font-serif text-xl mb-1">No Stories Visible</h3>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                  {profile.isSelf
                    ? (profile.companionTrips?.length ?? 0) > 0
                      ? 'No stories filed yet — your tagged adventures appear above.'
                      : 'Submit a folder of photos to dispatch our correspondent.'
                    : 'Follow this correspondent to see their friends-only stories.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(profile.trips ?? []).map(trip => (
                  <Link key={trip.id} href={`/trips/${trip.id}`} className="group block">
                    <article className="relative bg-card border border-border h-full flex flex-col hover:border-primary/50 transition-colors duration-300">
                      <div className="relative aspect-[4/5] overflow-hidden bg-muted border-b border-border">
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
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <div className="text-[9px] font-mono tracking-widest uppercase mb-2 opacity-70">
                            {format(new Date(trip.createdAt), 'MMM yyyy')}
                          </div>
                          <h3 className="text-2xl font-serif leading-tight drop-shadow-md">{trip.title}</h3>
                        </div>
                        {trip.status === 'error' && (
                          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[9px] font-mono uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Error
                          </div>
                        )}
                      </div>
                      {trip.summary && (
                        <div className="p-4 flex-grow">
                          <p className="text-muted-foreground text-sm line-clamp-3 font-serif italic">"{trip.summary}"</p>
                        </div>
                      )}
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
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
      <div className="py-20 px-6 border-b border-border bg-card/60">
        <div className="max-w-3xl mx-auto flex flex-col items-center space-y-6">
          <Skeleton className="h-24 w-24 rounded-none" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-none" />)}
        </div>
      </div>
    </div>
  );
}
