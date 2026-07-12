import { useState } from 'react';
import { useGetTrip, useDeleteTrip, useProcessTrip, useUpdateTripPrivacy, getGetTripQueryKey, exportTripPdf } from '@workspace/api-client-react';
import { useLocation, useParams, Link } from 'wouter';
import { format } from 'date-fns';
import { ChevronLeft, CloudRain, Wind, Mountain, AlertTriangle, Loader2, MapPin, Map, Trash2, RefreshCw, Lock, Users, Globe, FileDown, Newspaper } from 'lucide-react';
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
import ReactMarkdown from 'react-markdown';
import { TripStats } from '@/components/trip-stats';
import { TripRouteMap } from '@/components/trip-route-map';
import { DayAudioPlayer } from '@/components/day-audio-player';
import { ShareCard } from '@/components/share-card';

export default function Trip() {
  const { id } = useParams();
  const tripId = Number(id);
  const [, setLocation] = useLocation();
  const deleteTrip = useDeleteTrip();
  const processTrip = useProcessTrip();
  const updatePrivacy = useUpdateTripPrivacy();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
      <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-12 z-10">
          <div className="relative">
            <div className="absolute -inset-4 border border-primary/20 animate-spin-slow rounded-full border-dashed" style={{ animationDuration: '10s' }} />
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
          
          <div className="space-y-4 max-w-md">
            <h1 className="text-4xl font-serif italic">Filing the Story</h1>
            <div className="h-[1px] w-24 bg-border mx-auto" />
            <div className="text-muted-foreground font-mono text-sm uppercase tracking-widest leading-loose space-y-2">
              {trip.days.length > 0 ? (
                <p>{trip.days.length} {trip.days.length === 1 ? 'day' : 'days'} filed so far&hellip;</p>
              ) : (
                <p className="animate-pulse">Researching the first day&hellip;</p>
              )}
            </div>
            <p className="text-muted-foreground/70 text-xs normal-case tracking-normal font-sans max-w-sm mx-auto">
              Each day is researched and written individually, with your photos reviewed along the way — longer trips can take a few minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border py-4 px-6 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Library
        </Link>
        <span className="font-serif italic text-sm md:text-base">Trip Correspondent</span>
        
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
          
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 mt-16">
            <div className="flex items-center justify-center gap-4 text-xs font-mono uppercase tracking-[0.2em] text-secondary-foreground/80">
              <span>{trip.startDate ? format(new Date(trip.startDate), 'MMMM yyyy') : 'Date Unknown'}</span>
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span>{trip.days.length} Days</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tight uppercase leading-[0.9]">
              {trip.title}
            </h1>
            
            {trip.summary && (
              <div className="max-w-2xl mx-auto">
                <p className="text-xl md:text-3xl font-serif italic text-secondary-foreground/90 leading-snug">
                  "{trip.summary}"
                </p>
              </div>
            )}
          </div>
        </header>

        <TripStats trip={trip} />
        <TripRouteMap trip={trip} />

        {/* Day by Day Sections */}
        <div className="divide-y divide-border border-b border-border">
          {trip.days.sort((a,b) => a.dayIndex - b.dayIndex).map((day, idx) => (
            <section key={day.id} className="py-24 md:py-32 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24">
              
              {/* Day Meta sidebar */}
              <aside className="lg:col-span-3 space-y-10 lg:sticky lg:top-32 h-fit">
                <div>
                  <h2 className="text-5xl font-serif text-primary/20 select-none">
                    {String(day.dayIndex).padStart(2, '0')}
                  </h2>
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
                    {format(new Date(day.date), 'EEEE, MMM do')}
                  </div>
                </div>

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
                {day.heroPhotoId && (
                  <div className="mb-12">
                    {(() => {
                      const heroPhoto = trip.photos.find(p => p.id === day.heroPhotoId);
                      if (!heroPhoto) return null;
                      return (
                        <figure className="space-y-4">
                          <div className="aspect-[3/2] overflow-hidden bg-muted">
                            <img 
                              src={`/api/storage${heroPhoto.objectPath}`} 
                              alt="Hero photo of the day" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {day.locationName && (
                            <figcaption className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-right">
                              {day.locationName}
                            </figcaption>
                          )}
                        </figure>
                      );
                    })()}
                  </div>
                )}

                <div className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-p:font-sans prose-p:leading-loose prose-p:text-muted-foreground max-w-3xl">
                  {day.headline && (
                    <h3 className="text-4xl md:text-5xl font-serif mb-8 text-foreground leading-tight">
                      {day.headline}
                    </h3>
                  )}
                  
                  {day.narrative ? (
                    <div className="text-lg">
                      {/* We use a tiny hack to apply the drop-cap class to the first paragraph */}
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => {
                            // Only target the very first paragraph
                            const isFirstP = node?.position?.start?.line === 1;
                            if (isFirstP && typeof props.children === 'string' && props.children.length > 0) {
                              const firstChar = props.children.charAt(0);
                              const rest = props.children.slice(1);
                              return (
                                <p className="mb-6 clear-left">
                                  <span className="drop-cap">{firstChar}</span>
                                  {rest}
                                </p>
                              );
                            }
                            // Also handle arrays of children where the first might be a string
                            if (isFirstP && Array.isArray(props.children) && typeof props.children[0] === 'string' && props.children[0].length > 0) {
                               const firstChar = props.children[0].charAt(0);
                               const restFirstString = props.children[0].slice(1);
                               return (
                                 <p className="mb-6 clear-left">
                                   <span className="drop-cap">{firstChar}</span>
                                   {restFirstString}
                                   {props.children.slice(1)}
                                 </p>
                               );
                            }
                            return <p className="mb-6 clear-left" {...props} />;
                          }
                        }}
                      >
                        {day.narrative}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="italic text-muted-foreground opacity-50">No narrative filed for this day.</p>
                  )}
                </div>

                {/* Day Photo Grid */}
                {(() => {
                  const dayPhotos = trip.photos.filter(p => p.tripDayId === day.id && p.id !== day.heroPhotoId);
                  if (dayPhotos.length === 0) return null;
                  
                  return (
                    <div className="mt-16 pt-16 border-t border-border">
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8 text-center">
                        Selected Frames
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dayPhotos.map((photo, i) => (
                          <div 
                            key={photo.id} 
                            className={`bg-muted overflow-hidden ${i % 3 === 0 ? 'sm:col-span-2 aspect-[2/1]' : 'aspect-square'}`}
                          >
                            <img 
                              src={`/api/storage${photo.objectPath}`} 
                              alt="Trip photograph" 
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </section>
          ))}
        </div>

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
