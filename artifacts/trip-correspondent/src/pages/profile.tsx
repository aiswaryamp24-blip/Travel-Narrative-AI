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
    <div className="min-h-screen pb-24" style={{ background: 'hsl(var(--background))' }}>
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/feed" className="inline-flex items-center text-sm font-bold font-mono uppercase tracking-widest border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
          <ChevronLeft className="h-4 w-4 mr-1" /> Feed
        </Link>
        <Logo className="text-lg" />
      </nav>

      {/* Aurora-inspired profile header */}
      <header className="relative py-20 px-6 border-b border-border overflow-hidden">
        {/* Aurora gradient background */}
        <div className="absolute inset-0">
          {/* Aurora color layers */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(160deg, rgba(216,180,254,0.28) 0%, rgba(147,197,253,0.22) 30%, rgba(196,181,253,0.18) 55%, rgba(255,255,255,0) 80%)'
          }} />
          <div className="absolute top-0 left-0 right-0 h-32" style={{
            background: 'linear-gradient(180deg, rgba(216,180,254,0.2) 0%, transparent 100%)'
          }} />
          {/* Fox + world map SVG watermark */}
          <svg className="absolute right-0 top-0 h-full w-auto opacity-[0.055] pointer-events-none" viewBox="0 0 500 600" fill="none" preserveAspectRatio="xMaxYMid meet">
            {/* Simplified world map outline */}
            <path d="M60 300 Q90 250 130 260 Q160 270 180 250 Q210 230 240 240 Q260 245 280 230 Q310 215 340 225 Q370 235 390 220 Q420 205 440 215" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
            <path d="M70 320 Q100 310 130 320 Q160 330 190 315 Q220 300 250 310 Q280 320 310 305 Q340 290 370 300 Q400 310 430 295" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
            <path d="M90 340 Q120 350 150 340 Q180 330 210 345 Q240 360 270 345 Q300 330 330 345 Q360 360 390 345 Q420 330 450 340" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
            {/* Fox head simplified */}
            <path d="M230 100 L210 60 L230 80" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
            <path d="M270 80 L290 60 L270 100" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
            <path d="M230 100 C220 115 218 130 225 142 C230 150 250 155 270 148 C282 140 285 125 278 110 L270 100" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M240 115 Q248 111 256 115" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M248 128 L250 132 L252 128" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Airplane contrail */}
            <path d="M120 140 Q200 100 300 120" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 6" />
            <g transform="translate(300, 118) rotate(-10)">
              <path d="M0 0 L-6 3 L-4 0 L-6 -3 Z" fill="hsl(var(--primary))" />
            </g>
          </svg>
        </div>

        <div className="relative max-w-3xl mx-auto flex flex-col items-center space-y-6 text-center">
          <Avatar className="h-24 w-24 border-2 border-primary/30 rounded-none shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} className="rounded-none" />
            <AvatarFallback className="rounded-none text-2xl font-serif bg-primary/10 text-primary">
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
          <DigestsSection
            userId={profile.id}
            digestCadenceMonths={profile.digestCadenceMonths}
            preferredDigestStyle={profile.preferredDigestStyle}
          />
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
      <div className="py-16 px-6 border-b border-border">
        <div className="max-w-3xl mx-auto flex flex-col items-center space-y-6">
          <Skeleton className="h-24 w-24 rounded-none" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Skeleton className="h-8 w-48 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-none" />)}
        </div>
      </div>
    </div>
  );
}
