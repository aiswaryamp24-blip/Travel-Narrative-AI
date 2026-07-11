import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { Trip } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Share2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ShareCard({ trip }: { trip: Trip }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const heroPhoto = trip.photos[0];
  const heroSrc = trip.coverObjectPath
    ? `/api/storage${trip.coverObjectPath}`
    : heroPhoto
      ? `/api/storage${heroPhoto.objectPath}`
      : null;

  const generatePng = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch {
      toast.error('Failed to generate share image.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const blob = await generatePng();
    if (!blob) return;
    const file = new File([blob], `${trip.title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: trip.title,
          text: trip.summary ?? `${trip.title} — a Trip Correspondent story`,
        });
        return;
      } catch {
        // user cancelled or share unsupported mid-flight; fall through to download
      }
    }
    downloadBlob(blob, `${trip.title.replace(/\s+/g, '-')}.png`);
  };

  const handleDownload = async () => {
    const blob = await generatePng();
    if (!blob) return;
    downloadBlob(blob, `${trip.title.replace(/\s+/g, '-')}.png`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Share this story</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div
            ref={cardRef}
            className="relative w-[300px] h-[534px] bg-secondary text-secondary-foreground overflow-hidden flex flex-col justify-end p-6"
          >
            {heroSrc && (
              <>
                <img src={heroSrc} className="absolute inset-0 w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </>
            )}
            <div className="relative z-10 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
                Trip Correspondent
              </div>
              <h2 className="text-3xl font-serif font-black uppercase leading-tight text-white">
                {trip.title}
              </h2>
              {trip.summary && (
                <p className="text-sm font-serif italic text-white/90 leading-snug line-clamp-3">
                  "{trip.summary}"
                </p>
              )}
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-white/70 pt-1">
                <span>{trip.days.length} Days</span>
                {trip.totalDistanceKm && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    <span>{Math.round(trip.totalDistanceKm)} km</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleDownload} disabled={isGenerating} className="rounded-none gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download
          </Button>
          <Button onClick={handleShare} disabled={isGenerating} className="rounded-none gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
