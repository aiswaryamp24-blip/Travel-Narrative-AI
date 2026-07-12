import { useRef, useState, type SVGProps } from 'react';
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
import { Share2, Download, Loader2, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';

/** Minimal inline mark for X (formerly Twitter) — lucide-react doesn't ship
 * the current X logo, only the legacy bird icon. */
function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.1-9.3L1.5 2h6.9l4.7 6.2L18.9 2Zm-1.2 18h1.7L7.3 4H5.5l12.2 16Z" />
    </svg>
  );
}

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
          text: trip.summary ?? `${trip.title} — a Turasum story`,
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

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = trip.summary ?? `${trip.title} — a Turasum story`;
  const isPublic = trip.privacy === 'public';

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const handleXShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  // Instagram has no web share-intent API — the only real path in from a
  // website is the OS-level share sheet (which registers Instagram as a
  // target on mobile). On desktop, or if that's unsupported, fall back to
  // downloading the image so it can be posted manually from the phone.
  const handleInstagramShare = async () => {
    const blob = await generatePng();
    if (!blob) return;
    const file = new File([blob], `${trip.title.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: trip.title });
        return;
      } catch {
        return;
      }
    }
    toast.info("Instagram doesn't support sharing directly from a website — downloading the image so you can post it from your phone.");
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
                Turasum
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

        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFacebookShare}
              disabled={!isPublic}
              title={isPublic ? 'Share to Facebook' : 'Make this trip public to share to Facebook'}
              className="rounded-none"
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleXShare}
              disabled={!isPublic}
              title={isPublic ? 'Share to X' : 'Make this trip public to share to X'}
              className="rounded-none"
            >
              <XIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleInstagramShare}
              disabled={isGenerating}
              title="Share to Instagram"
              className="rounded-none"
            >
              <Instagram className="h-4 w-4" />
            </Button>
          </div>
          {!isPublic && (
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Facebook and X need this trip set to Public so the link resolves for other people.
            </p>
          )}
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
