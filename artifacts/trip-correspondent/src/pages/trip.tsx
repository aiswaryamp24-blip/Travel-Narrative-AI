import { useState, useRef } from 'react';
import { motion, useScroll, useVelocity, useTransform, useMotionTemplate } from 'framer-motion';
import { SplitText } from '@/components/split-text';
import { FilmReel } from '@/components/film-reel';
import { useGetTrip, useDeleteTrip, useProcessTrip, useUpdateTripPrivacy, getGetTripQueryKey, exportTripPdf } from '@workspace/api-client-react';
import { TripReviews } from '@/components/trip-reviews';
import { useLocation, useParams, Link } from 'wouter';
import { format } from 'date-fns';
import { ChevronLeft, CloudRain, Wind, Mountain, Navigation, AlertTriangle, Loader2, MapPin, Map, Trash2, RefreshCw, Lock, Users, Globe, FileDown, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TripStats } from '@/components/trip-stats';
import { TripRouteMap } from '@/components/trip-route-map';
import { DayAudioPlayer } from '@/components/day-audio-player';
import { ShareCard } from '@/components/share-card';
import { RevealOnScroll } from '@/components/reveal-on-scroll';
import { Logo } from '@/components/logo';
import { StyleDecoration } from '@/components/style-decoration';
import { getTripStyle } from '@/lib/trip-styles';
import { HeroPhotoPicker } from '@/components/hero-photo-picker';
import { EditableDayNarrative } from '@/components/editable-day-narrative';
import { TripComments } from '@/components/trip-comments';
import { TripCompanions } from '@/components/trip-companions';

export default function Trip() {
  const { id } = useParams();
  const tripId = Number(id);
  const [, setLocation] = useLocation();
  const deleteTrip = useDeleteTrip();
  const processTrip = useProcessTrip();
  const updatePrivacy = useUpdateTripPrivacy();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // — Scroll velocity → title blur (feature 3) —
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const titleBlur = useTransform(scrollVelocity, [-4000, 0, 4000], [12, 0, 12]);
  const titleFilter = useMotionTemplate`blur(${titleBlur}px)`;

  // — Scroll-driven warm→cool background shift across day sections (feature 7) —
  const daysContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: daysProgress } = useScroll({
    target: daysContainerRef,
    offset: ['start 80%', 'end 20%'],
  });
  const daysBgColor = useTransform(
    daysProgress,
    [0, 0.33, 0.66, 1],
    ['hsl(40 40% 99%)', 'hsl(200 25% 98%)', 'hsl(243 25% 97%)', 'hsl(270 20% 96%)'],
  );

  const { data: trip, isLoading, isError } = useGetTrip(tripId, {
    query: {
      queryKey: getGetTripQueryKey(tripId),
      enabled: !!tripId,
      // The hook definition automatically polls if status is pending/processing
    }
  });

  if (isLoading) {
    return <TripSkeleton />;
  }

  if (isError || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 space-y-6 bg-background">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div>
          <h1 className="text-3xl font-serif mb-2">Trip Not Found</h1>
          <p className="text-muted-foreground">The story you're looking for doesn't exist or couldn't be loaded.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/')} className="rounded-none font-mono uppercase tracking-widest text-xs">
          Return to Library
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteTrip.mutateAsync({ tripId });
      toast.success("Story archived.");
      setLocation('/');
    } catch (err) {
      toast.error("Failed to delete story.");
    }
  };

  const handleRetry = async () => {
    try {
      await processTrip.mutateAsync({ tripId });
      toast.success("Retrying the assignment...");
    } catch (err) {
      toast.error("Failed to restart the assignment.");
    }
  };

  const handlePrivacyChange = async (privacy: 'private' | 'friends' | 'public') => {
    try {
      await updatePrivacy.mutateAsync({ tripId, data: { privacy } });
      toast.success("Visibility updated.");
    } catch (err) {
      toast.error("Failed to update visibility.");
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const blob = await exportTripPdf(tripId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trip!.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'trip'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
    } catch (err) {
      toast.error("Failed to export PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (trip.status === 'error') {
    return (
      <div className="min-h-screen bg-card p-6 md:p-12 flex flex-col max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ChevronLeft className="h-4 w-4 mr-1" /> The Library
        </Link>
        <div className="border border-destructive/20 bg-destructive/5 p-8 md:p-12 text-center space-y-6">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-serif text-destructive">Assignment Failed</h1>
            <p className="text-muted-foreground font-mono text-sm max-w-lg mx-auto">
              {trip.errorMessage || "Our correspondent encountered an issue while researching this trip."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button variant="outline" onClick={() => setLocation('/')} className="rounded-none">Cancel</Button>
            {trip.isOwner && (
              <Button onClick={handleRetry} className="rounded-none gap-2"><RefreshCw className="h-4 w-4" /> Retry Assignment</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (trip.status === 'pending' || trip.status === 'processing') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#f0f0f8] relative overflow-hidden p-6">
        {/* Outer rounded card — matches the GIF aesthetic */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur border border-border/40 rounded-2xl shadow-xl overflow-hidden">
          {/* Green progress stripe at top */}
          <div className="h-[3px] bg-green-400 w-full" style={{ boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />

          <div className="p-8 space-y-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">turasum</p>

            {/* GIF progress animation */}
            <div className="flex justify-center">
              <img
                src="/generating-progress.gif"
                alt="Generating story…"
                className="w-full max-w-xs"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            {/* Status text */}
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-black">Filing the Story…</h1>
              <div className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                {trip.days.length > 0 ? (
                  <p>{trip.days.length} {trip.days.length === 1 ? 'day' : 'days'} researched so far</p>
                ) : (
                  <p className="animate-pulse">Researching the first day…</p>
                )}
              </div>
              <p className="text-muted-foreground/60 text-xs font-sans">
                Longer trips take 2–4 minutes. Each day is written individually with your photos reviewed.
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-border/30" />
          <div className="px-8 py-3 flex justify-between text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
            <span>BBC Research Mode</span>
            <span>Analysing photos &amp; landmarks</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/95" data-trip-style={trip.visualStyle}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border py-4 px-6 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Library
        </Link>
        <Logo className="text-sm md:text-base" />
        
        <div className="flex items-center gap-1">
        <Link href="/feed" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-2">
          <Newspaper className="h-3.5 w-3.5" /> Feed
        </Link>
        {trip.isOwner && (
          <Select value={trip.privacy} onValueChange={handlePrivacyChange}>
            <SelectTrigger className="w-[130px] h-9 rounded-none border-border font-mono text-xs uppercase tracking-widest">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="private">
                <span className="flex items-center gap-2"><Lock className="h-3 w-3" /> Private</span>
              </SelectItem>
              <SelectItem value="friends">
                <span className="flex items-center gap-2"><Users className="h-3 w-3" /> Friends</span>
              </SelectItem>
              <SelectItem value="public">
                <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> Public</span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        <ShareCard trip={trip} />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          title="Export PDF"
        >
          {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        </Button>
        {trip.isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-none border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-2xl">Archive this story?</AlertDialogTitle>
              <AlertDialogDescription className="font-sans">
                This will permanently delete the narrative and remove all associated photos. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none font-mono text-xs uppercase tracking-widest">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none font-mono text-xs uppercase tracking-widest">Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        )}
        </div>
      </nav>

      <main>
        {/* Cover Feature */}
        <header className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 bg-secondary text-secondary-foreground border-b-8 border-primary">
          {trip.coverObjectPath && (
            <div className="absolute inset-0 z-0">
              <img 
                src={`/api/storage${trip.coverObjectPath}`} 
                alt="Cover" 
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
          )}

          <StyleDecoration pattern={getTripStyle(trip.visualStyle).pattern} />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 mt-16">
            <div className="flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-[0.2em] text-secondary-foreground/80">
              <span>{trip.startDate ? format(new Date(trip.startDate), 'MMMM yyyy') : 'Date Unknown'}</span>
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span>{trip.days.length} Days</span>
            </div>
            
            <motion.h1
              className="text-6xl md:text-8xl font-serif font-black tracking-tight uppercase leading-[0.9]"
              style={{ filter: titleFilter }}
            >
              <SplitText text={trip.title} delayPerChar={0.03} />
            </motion.h1>
            
            {trip.summary && (
              <div className="max-w-2xl mx-auto">
                <p className="text-xl md:text-3xl font-serif italic text-secondary-foreground/90 leading-snug">
                  "{trip.summary}"
                </p>
              </div>
            )}

            {trip.totalDistanceKm && (
              <div className="pt-12 flex justify-center">
                <div className="border border-secondary-foreground/20 px-6 py-3 font-mono text-sm uppercase tracking-widest backdrop-blur-sm bg-black/20">
                  Total Distance: {Math.round(trip.totalDistanceKm)} km
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Route draw — decorative SVG path connecting day locations (feature 2) */}
        {trip.days.length >= 2 && (() => {
          const stops = trip.days
            .sort((a, b) => a.dayIndex - b.dayIndex)
            .map(d => d.locationName?.split(',')[0]?.trim() || `Day ${d.dayIndex + 1}`)
            .slice(0, 7);
          const n = stops.length;
          const W = 600; const H = 70; const pad = 40;
          const stepX = (W - 2 * pad) / (n - 1);
          const pts = stops.map((_, i) => ({ x: pad + i * stepX, y: H / 2 + (i % 2 === 0 ? -16 : 16) }));
          let d = `M ${pts[0].x} ${pts[0].y}`;
          for (let i = 1; i < pts.length; i++) {
            const c1x = pts[i-1].x + stepX/2; const c1y = pts[i-1].y;
            const c2x = pts[i].x - stepX/2;   const c2y = pts[i].y;
            d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${pts[i].x} ${pts[i].y}`;
          }
          return (
            <div className="bg-card border-b border-border">
              <div className="max-w-6xl mx-auto px-6 py-6">
                <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-muted-foreground mb-3">Route</div>
                <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" fill="none" overflow="visible">
                  <motion.path d={d} stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }} transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.2 }} />
                  {pts.map((pt, i) => (
                    <motion.g key={i} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }} transition={{ delay: 0.4 + i * (1.6 / n), type: 'spring', stiffness: 280 }}>
                      <circle cx={pt.x} cy={pt.y} r="4" fill="hsl(var(--primary))" />
                      <text x={pt.x} y={pt.y + (i % 2 === 0 ? -10 : 18)} textAnchor="middle"
                        fontSize="7.5" fontFamily="monospace" fill="currentColor" className="uppercase">
                        {stops[i].slice(0, 12)}
                      </text>
                    </motion.g>
                  ))}
                </svg>
              </div>
            </div>
          );
        })()}

        {(trip.companions.length > 0 || trip.isOwner) && (
          <div className="py-8 px-6 max-w-6xl mx-auto border-b border-border">
            <TripCompanions tripId={tripId} isOwner={trip.isOwner} companions={trip.companions} />
          </div>
        )}

        <TripStats trip={trip} />
        <TripRouteMap trip={trip} />

        {/* Day by Day Sections — background shifts warm→cool as you read through (feature 7) */}
        <motion.div ref={daysContainerRef} className="divide-y divide-border border-b border-border" style={{ backgroundColor: daysBgColor }}>
          {trip.days.sort((a,b) => a.dayIndex - b.dayIndex).map((day, idx) => (
            <section key={day.id} className="py-24 md:py-32 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24">
              
              {/* Day Meta sidebar — sticky chapter marker (feature 1) */}
              <aside className="lg:col-span-3 space-y-10 lg:sticky lg:top-24 h-fit">
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="relative mb-2">
                    {/* Ghost big number behind the label */}
                    <div className="text-[6rem] font-serif leading-none text-primary/8 select-none -ml-1 -mt-2 pointer-events-none">
                      {String(day.dayIndex + 1).padStart(2, '0')}
                    </div>
                    <div className="absolute bottom-1 left-0 space-y-1">
                      <div className="w-7 h-[2px] bg-primary" />
                      <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
                        Day {day.dayIndex + 1}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {format(new Date(day.date), 'EEEE, MMM do')}
                      </div>
                      {day.locationName && (
                        <div className="font-serif text-base leading-tight pt-1">
                          {day.locationName.split(',')[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-6 font-mono text-sm">
                  {day.locationName && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Basecamp</div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{day.locationName}</span>
                      </div>
                    </div>
                  )}

                  {day.weather && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Conditions</div>
                      <div className="grid grid-cols-2 gap-4">
                        {day.weather.tempMaxC !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-serif">{Math.round(day.weather.tempMaxC!)}°</span>
                          </div>
                        )}
                        {day.weather.conditions && (
                          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                            {day.weather.conditions}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {day.distanceKm !== null && day.distanceKm > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Traveled</div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        {day.distanceKm < 1 ? '< 1' : Math.round(day.distanceKm)} km
                      </div>
                    </div>
                  )}
                </div>

                <DayAudioPlayer tripId={tripId} day={day} />

                {day.landmarks && day.landmarks.length > 0 && (

                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 border-b border-border pb-2">Waypoints</div>
                    <ul className="space-y-3 font-serif text-sm">
                      {day.landmarks.slice(0, 4).map((lm, i) => (
                        <li key={i} className="flex justify-between items-baseline gap-2">
                          <span className="italic">{lm.name}</span>
                          {lm.distanceMeters && (
                            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{(lm.distanceMeters/1000).toFixed(1)}km</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>

              {/* Day Content */}
              <div className="lg:col-span-9 space-y-12">
                
                {/* Hero Photo for Day */}
                {(() => {
                  const dayPhotos = trip.photos.filter(p => p.tripDayId === day.id);
                  const heroPhoto = trip.photos.find(p => p.id === day.heroPhotoId);

                  if (!heroPhoto) {
                    if (!trip.isOwner || dayPhotos.length === 0) return null;
                    return (
                      <RevealOnScroll className="mb-12">
                        <div className="relative aspect-[3/2] overflow-hidden bg-muted flex items-center justify-center">
                          <HeroPhotoPicker
                            tripId={tripId}
                            dayId={day.id}
                            currentHeroPhotoId={day.heroPhotoId}
                            dayPhotos={dayPhotos}
                          />
                        </div>
                      </RevealOnScroll>
                    );
                  }

                  return (
                    <RevealOnScroll className="mb-12">
                      <figure className="space-y-4">
                        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                          <img
                            src={`/api/storage${heroPhoto.objectPath}`}
                            alt="Hero photo of the day"
                            className="w-full h-full object-cover"
                          />
                          {trip.isOwner && (
                            <HeroPhotoPicker
                              tripId={tripId}
                              dayId={day.id}
                              currentHeroPhotoId={day.heroPhotoId}
                              dayPhotos={dayPhotos}
                            />
                          )}
                        </div>
                        {day.locationName && (
                          <figcaption className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-right">
                            {day.locationName}
                          </figcaption>
                        )}
                      </figure>
                    </RevealOnScroll>
                  );
                })()}

                <EditableDayNarrative tripId={tripId} day={day} isOwner={trip.isOwner} />

                {/* Film reel — scroll-driven horizontal photo strip (feature 4) */}
                {(() => {
                  const dayPhotos = trip.photos
                    .filter(p => p.tripDayId === day.id && p.id !== day.heroPhotoId)
                    .slice(0, 6);
                  if (dayPhotos.length === 0) return null;
                  return <FilmReel photos={dayPhotos} />;
                })()}

              </div>
            </section>
          ))}
        </motion.div>

        {/* Unassigned Photos (if any exist but tripDayId is null after processing) */}
        {(() => {
          const unassigned = trip.photos.filter(p => !p.tripDayId);
          if (unassigned.length === 0) return null;
          
          return (
            <section className="py-24 px-6 max-w-6xl mx-auto border-b border-border">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-serif">Outtakes</h3>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-2">Undated or unplaced frames</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {unassigned.map(photo => (
                  <div key={photo.id} className="aspect-square bg-muted">
                    <img 
                      src={`/api/storage${photo.objectPath}`} 
                      className="w-full h-full object-cover" 
                      alt="Outtake"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Reviews */}
        <TripReviews tripId={tripId} />
        <TripComments tripId={tripId} isOwner={trip.isOwner} />

        {/* End Mark */}
        <div className="py-24 flex justify-center text-primary">
          <div className="flex gap-2">
            <span className="h-2 w-2 bg-primary transform rotate-45"></span>
            <span className="h-2 w-2 bg-primary transform rotate-45"></span>
            <span className="h-2 w-2 bg-primary transform rotate-45"></span>
          </div>
        </div>
      </main>
    </div>
  );
}

function TripSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border py-4 px-6 flex justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-8" />
      </nav>
      <header className="h-[60vh] bg-secondary flex flex-col items-center justify-center p-6 space-y-6">
        <Skeleton className="h-4 w-48 bg-primary/20" />
        <Skeleton className="h-20 w-3/4 max-w-3xl bg-primary/20" />
        <Skeleton className="h-8 w-1/2 max-w-xl bg-primary/20" />
      </header>
      <main className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-12 gap-12">
        <aside className="col-span-3 space-y-8">
          <Skeleton className="h-16 w-20" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </aside>
        <div className="col-span-9 space-y-8">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-12 w-3/4" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-4 pt-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
