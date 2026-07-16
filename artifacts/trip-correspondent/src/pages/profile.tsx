import { useGetUserProfile, getGetUserProfileQueryKey } from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { format } from 'date-fns';
import { ChevronLeft, AlertTriangle, Map, FileText, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from '@/components/follow-button';
import { DigestsSection } from '@/components/digests-section';
import { Logo } from '@/components/logo';

/** Compass-rose + fox SVG watermark, inspired by the indigo line-art reference. */
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
      <circle cx="150" cy="150" r="118" stroke="hsl(243 75% 55%)" strokeWidth="1.2" opacity="0.18" />
      {/* Inner circle */}
      <circle cx="150" cy="150" r="90" stroke="hsl(243 75% 55%)" strokeWidth="0.8" opacity="0.12" />
      {/* Meridian grid lines */}
      <line x1="150" y1="32" x2="150" y2="268" stroke="hsl(243 75% 55%)" strokeWidth="0.6" opacity="0.1" />
      <line x1="32" y1="150" x2="268" y2="150" stroke="hsl(243 75% 55%)" strokeWidth="0.6" opacity="0.1" />
      <line x1="67" y1="67" x2="233" y2="233" stroke="hsl(243 75% 55%)" strokeWidth="0.6" opacity="0.08" />
      <line x1="233" y1="67" x2="67" y2="233" stroke="hsl(243 75% 55%)" strokeWidth="0.6" opacity="0.08" />

      {/* Compass star — 4 main points */}
      <path d="M 150 32 L 158 140 L 150 150 L 142 140 Z" fill="hsl(243 75% 55%)" opacity="0.20" />
      <path d="M 150 268 L 158 160 L 150 150 L 142 160 Z" fill="hsl(243 75% 55%)" opacity="0.12" />
      <path d="M 32 150 L 140 142 L 150 150 L 140 158 Z" fill="hsl(243 75% 55%)" opacity="0.12" />
      <path d="M 268 150 L 160 142 L 150 150 L 160 158 Z" fill="hsl(243 75% 55%)" opacity="0.12" />
      {/* 4 secondary compass points */}
      <path d="M 67 67 L 145 145 L 150 150 L 144 146 Z" fill="hsl(243 75% 55%)" opacity="0.08" />
      <path d="M 233 67 L 155 145 L 150 150 L 156 146 Z" fill="hsl(243 75% 55%)" opacity="0.08" />
      <path d="M 67 233 L 145 155 L 150 150 L 144 156 Z" fill="hsl(243 75% 55%)" opacity="0.08" />
      <path d="M 233 233 L 155 155 L 150 150 L 156 156 Z" fill="hsl(243 75% 55%)" opacity="0.08" />

      {/* Fox outline — minimal line art, sitting within the compass circle */}
      {/* Fox body (curled) */}
      <path
        d="M 138 170 Q 128 165 125 155 Q 122 145 128 138 Q 134 130 142 128 Q 150 126 158 130 Q 164 134 164 142 Q 164 150 158 158 Q 155 162 150 164 Q 145 166 140 170"
        stroke="hsl(243 75% 55%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      {/* Fox head */}
      <path
        d="M 155 130 Q 162 122 166 118 Q 163 124 168 124 Q 164 126 162 132"
        stroke="hsl(243 75% 55%)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Fox ear left */}
      <path d="M 155 128 L 152 118 L 160 126" stroke="hsl(243 75% 55%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      {/* Fox ear right */}
      <path d="M 162 122 L 168 112 L 170 124" stroke="hsl(243 75% 55%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      {/* Fox tail — big sweeping arc to left */}
      <path
        d="M 138 170 Q 120 178 112 170 Q 104 162 112 154 Q 118 148 128 152"
        stroke="hsl(243 75% 55%)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.28"
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

  return (
    <div className="min-h-screen pb-24 bg-background">
      <nav className="py-3 px-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/feed" className="inline-flex items-center text-[10px] font-black font-mono uppercase tracking-[0.2em] border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Feed
        </Link>
        <Logo className="text-lg" />
      </nav>

      {/* Profile header — compass-rose + fox inspired background */}
      <header className="relative overflow-hidden border-b border-border">
        {/* Cream/indigo layered background */}
        <div className="absolute inset-0">
          {/* Base: soft periwinkle-cream gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                'radial-gradient(ellipse 80% 70% at 50% 50%, hsl(243 60% 96%) 0%, hsl(240 30% 92%) 60%, hsl(234 25% 88%) 100%)',
              ].join(', '),
            }}
          />
          {/* Subtle aurora wash */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                'radial-gradient(ellipse 60% 50% at 15% 20%, hsl(243 75% 55% / 0.10) 0%, transparent 60%)',
                'radial-gradient(ellipse 50% 60% at 85% 80%, hsl(260 70% 60% / 0.08) 0%, transparent 60%)',
              ].join(', '),
            }}
          />
          {/* Compass-rose + fox watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-100">
            <div className="w-full max-w-xs h-64 relative">
              <CompassFoxWatermark />
            </div>
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-20 flex flex-col items-center space-y-6 text-center">
          {/* Avatar */}
          <div className="relative">
            <div
              className="absolute -inset-1 rounded-none opacity-40"
              style={{ background: 'linear-gradient(135deg, hsl(243 75% 55%), hsl(260 70% 70%))' }}
            />
            <Avatar className="h-24 w-24 relative border-2 border-primary/30 rounded-none shadow-lg">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} className="rounded-none" />
              <AvatarFallback className="rounded-none text-2xl font-serif bg-primary/10 text-primary">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-black uppercase tracking-tight text-foreground">
              {profile.displayName}
            </h1>
            <div className="flex items-center justify-center gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span>{profile.followerCount} Followers</span>
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span>{profile.followingCount} Following</span>
            </div>
          </div>

          {!profile.isSelf && <FollowButton userId={profile.id} isFollowing={profile.isFollowing} />}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {profile.isSelf && (
          <DigestsSection
            userId={profile.id}
            digestCadenceMonths={profile.digestCadenceMonths}
            preferredDigestStyle={profile.preferredDigestStyle}
          />
        )}

        <div className="border border-border">
          <div className="relative border-b border-border px-6 py-4 flex items-baseline justify-between bg-card">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <h2 className="text-2xl font-serif font-black uppercase tracking-tight pl-2">
              {profile.isSelf ? 'Your Stories' : 'Filed Stories'}
            </h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              {profile.trips.length} {profile.trips.length === 1 ? 'Story' : 'Stories'}
            </span>
          </div>

          <div className="p-6">
            {profile.trips.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-30" />
                <h3 className="font-serif text-xl mb-1">No Stories Visible</h3>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                  {profile.isSelf
                    ? 'Submit a folder of photos to dispatch our correspondent.'
                    : 'Follow this correspondent to see their friends-only stories.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.trips.map(trip => (
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
