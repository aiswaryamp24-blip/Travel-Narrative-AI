import { useState, useRef } from 'react';
import { Share2, Download, X, Instagram, Facebook } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type FeedTripSummary = { id: number; title: string; summary?: string | null; coverObjectPath?: string | null; createdAt: string };
type Format = { id: string; label: string; platform: string; ratio: [number, number]; icon: React.ReactNode; shareUrl?: (url: string) => string };

const FORMATS: Format[] = [
  {
    id: 'ig-story',
    label: 'Instagram Story',
    platform: 'instagram',
    ratio: [9, 16],
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    id: 'tiktok',
    label: 'TikTok Post',
    platform: 'tiktok',
    ratio: [9, 16],
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.12 8.12 0 0 0 4.74 1.5V6.73a4.85 4.85 0 0 1-.97-.04z"/>
      </svg>
    ),
  },
  {
    id: 'ig-post',
    label: 'Instagram Post',
    platform: 'instagram',
    ratio: [1, 1],
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    id: 'facebook',
    label: 'Facebook Post',
    platform: 'facebook',
    ratio: [16, 9],
    icon: <Facebook className="h-4 w-4" />,
    shareUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

function SharePreviewCard({
  trip,
  format,
  previewRef,
}: {
  trip: FeedTripSummary;
  format: Format;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [w, h] = format.ratio;
  const isPortrait = h > w;
  const isSquare = w === h;

  return (
    <div
      ref={previewRef}
      className="relative overflow-hidden flex flex-col justify-end bg-black text-white"
      style={{
        aspectRatio: `${w}/${h}`,
        maxWidth: isPortrait ? '200px' : isSquare ? '260px' : '360px',
        maxHeight: isPortrait ? '360px' : '220px',
        width: '100%',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* Cover photo */}
      {trip.coverObjectPath ? (
        <>
          <img
            src={`/api/storage${trip.coverObjectPath}`}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
      )}

      {/* Content */}
      <div className="relative p-4 space-y-2">
        <div
          className="h-[2px] w-8 mb-3"
          style={{ backgroundColor: 'hsl(243 75% 65%)' }}
        />
        <h3
          className="font-black leading-tight"
          style={{ fontSize: isPortrait ? '1.1rem' : isSquare ? '0.9rem' : '0.85rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}
        >
          {trip.title}
        </h3>
        {trip.summary && !isPortrait && (
          <p className="font-sans text-white/70 leading-snug" style={{ fontSize: '0.65rem' }}>
            "{trip.summary.slice(0, 60)}…"
          </p>
        )}
        {trip.summary && isPortrait && (
          <p className="font-sans text-white/70 leading-snug" style={{ fontSize: '0.7rem' }}>
            "{trip.summary.slice(0, 90)}…"
          </p>
        )}
        {/* Branding */}
        <div className="flex items-center gap-1.5 pt-2">
          <img src="/fox-logo.png" alt="" className="h-4 w-4 object-contain" style={{ filter: 'drop-shadow(0 0 3px rgba(99,102,241,0.8))' }} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', opacity: 0.7, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            turasum
          </span>
        </div>
      </div>

      {/* Dimension watermark */}
      <div
        className="absolute top-2 right-2"
        style={{ fontFamily: 'monospace', fontSize: '0.5rem', opacity: 0.4, letterSpacing: '0.1em' }}
      >
        {format.id.toUpperCase()}
      </div>
    </div>
  );
}

export function SocialShareModal({ trip }: { trip: FeedTripSummary }) {
  const [selected, setSelected] = useState<string>('ig-story');
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const fmt = FORMATS.find(f => f.id === selected) ?? FORMATS[0];

  const downloadImage = async () => {
    const node = previewRef.current;
    if (!node) return;
    setDownloading(true);
    try {
      const [w, h] = fmt.ratio;
      const EXPORT_PX = 1080;
      const exportH = Math.round((h / w) * EXPORT_PX);
      const png = await toPng(node, { width: EXPORT_PX, height: exportH, pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = png;
      a.download = `${trip.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${fmt.id}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const tripUrl = `${window.location.origin}${import.meta.env.BASE_URL}trips/${trip.id}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          title="Share to social"
          className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-primary transition-colors rounded-none"
          onClick={e => e.preventDefault()}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-border max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Share to Social</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format picker */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Choose format</p>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelected(f.id)}
                  className={`flex items-center gap-2 px-3 py-2 border text-sm font-mono text-left transition-all ${
                    selected === f.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {f.icon}
                  <span className="text-xs">{f.label}</span>
                  <span className="ml-auto text-[9px] opacity-50">{f.ratio[0]}:{f.ratio[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Preview</p>
            <div className="flex justify-center">
              <SharePreviewCard trip={trip} format={fmt} previewRef={previewRef} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={downloadImage}
              disabled={downloading}
              className="rounded-none font-mono text-[10px] uppercase tracking-widest flex-1 gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? 'Exporting…' : `Download ${fmt.ratio[0]}:${fmt.ratio[1]}`}
            </Button>
            {fmt.shareUrl && (
              <Button
                variant="outline"
                className="rounded-none font-mono text-[10px] uppercase tracking-widest gap-2"
                onClick={() => window.open(fmt.shareUrl!(tripUrl), '_blank')}
              >
                {fmt.icon} Share
              </Button>
            )}
            <Button
              variant="ghost"
              className="rounded-none font-mono text-[10px] uppercase tracking-widest gap-2"
              onClick={() => navigator.clipboard.writeText(tripUrl)}
            >
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
