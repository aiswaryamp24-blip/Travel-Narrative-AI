import { useState, useCallback } from 'react';
import type { DigestStyle } from '@workspace/api-client-react';
import { useUploadFlow } from '@/hooks/use-upload-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, Image as ImageIcon, MapPin, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type CoverStyle = {
  id: DigestStyle;
  name: string;
  bg: string;
  accent: string;
  fg: string;
  muted: string;
};

const COVER_STYLES: CoverStyle[] = [
  { id: 'pop-art',          name: 'Pop Art',              bg: '#FFEC00', accent: '#E8112D', fg: '#0D0D0D', muted: '#3D3D3D' },
  { id: 'supermarket',      name: 'Supermarket',          bg: '#F5F5F0', accent: '#CC0000', fg: '#111111', muted: '#555555' },
  { id: 'camera-interface', name: 'Viewfinder Interface', bg: '#0A0A0A', accent: '#00FF41', fg: '#E8E8E8', muted: '#6B6B6B' },
  { id: 'canon-camera',     name: 'Canon Camera',         bg: '#1A1A1A', accent: '#E0051E', fg: '#F0F0F0', muted: '#8A8A8A' },
  { id: 'ios-core',         name: 'iOS Core',             bg: '#F2F2F7', accent: '#007AFF', fg: '#1C1C1E', muted: '#8E8E93' },
  { id: 'android-core',     name: 'Android Core',         bg: '#1C1B1F', accent: '#D0BCFF', fg: '#E6E1E5', muted: '#938F99' },
];

export function UploadFlow() {
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DigestStyle | null>(null);

  const { progress, startUpload } = useUploadFlow();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))]);
    }
  }, []);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!).filter(f => f.type.startsWith('image/'))]);
    }
  }, []);

  const handleDispatch = () => {
    if (!title.trim() || !files.length || !selectedStyle) return;
    startUpload(title, files, selectedStyle);
  };

  const isUploading = progress.status !== 'idle' && progress.status !== 'error' && progress.status !== 'done';
  const progressPercent = progress.totalPhotos > 0
    ? Math.round((progress.uploadedPhotos / progress.totalPhotos) * 100)
    : 0;

  if (isUploading) {
    return (
      <div className="border border-border p-8 md:p-12 max-w-2xl mx-auto text-center space-y-8 animate-in fade-in duration-500">
        <div className="space-y-4">
          <h2 className="text-3xl font-serif">Dispatching Correspondent</h2>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
            {progress.status === 'creating' && 'Opening a new assignment…'}
            {progress.status === 'uploading' && `Developing the evidence… ${progress.uploadedPhotos} of ${progress.totalPhotos}`}
            {progress.status === 'processing' && 'Reviewing your itinerary, mapping coordinates, writing the story…'}
          </p>
        </div>
        <div className="space-y-2">
          <Progress value={progress.status === 'processing' ? 100 : progressPercent} className="h-[2px] rounded-none" />
          {progress.status === 'uploading' && (
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{progressPercent}%</p>
          )}
        </div>
        {progress.status === 'processing' && (
          <div className="flex items-center justify-center text-primary gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-xs tracking-widest uppercase">Researching locations</span>
          </div>
        )}
      </div>
    );
  }

  const canDispatch = !!title.trim() && files.length > 0 && !!selectedStyle;

  return (
    <div className="border border-border max-w-3xl mx-auto">
      {/* Header bar — editorial masthead style */}
      <div className="border-b border-border px-6 py-5 flex items-baseline justify-between bg-card">
        <h2 className="text-2xl font-serif font-black uppercase tracking-tight">New Assignment</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Submit a story</span>
      </div>

      <div className="p-6 md:p-8 space-y-8 bg-background">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">The Assignment</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. A Weekend in Kyoto, Autumn in the Dolomites…"
            className="text-lg py-6 font-serif placeholder:font-sans bg-background/50 border-border focus-visible:ring-primary rounded-none"
          />
        </div>

        {/* Evidence / photo upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground flex justify-between">
            <span>The Evidence</span>
            {files.length > 0 && <span className="text-foreground">{files.length} selected</span>}
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed p-10 text-center transition-colors duration-200 group relative',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30',
              files.length > 0 ? 'bg-accent/20' : '',
            )}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <UploadCloud className={cn('h-8 w-8 transition-colors', files.length > 0 ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <p className="font-medium font-serif">
                  {files.length > 0 ? `${files.length} photo${files.length === 1 ? '' : 's'} ready` : 'Tap to select photos'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {files.length > 0 ? 'Click or drop to add more' : 'or drag and drop your travel photos here'}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> JPG · PNG · HEIC</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> EXIF required for maps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cover edition selection — inline, not a separate step */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Special Edition Cover
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {COVER_STYLES.map(style => {
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    'relative text-left border transition-all focus:outline-none group',
                    isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40',
                  )}
                >
                  {/* Mini cover swatch */}
                  <div className="h-16 relative overflow-hidden" style={{ backgroundColor: style.bg }}>
                    <div className="absolute inset-0 p-2 flex flex-col justify-between">
                      <div className="h-1 w-5 rounded-none" style={{ backgroundColor: style.accent }} />
                      <div className="h-2.5 w-full rounded-none opacity-30" style={{ backgroundColor: style.fg }} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: style.accent }} />
                    {isSelected && (
                      <div className="absolute top-1 right-1 h-3.5 w-3.5 bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="px-1.5 py-1 bg-card">
                    <span className="text-[9px] font-mono uppercase tracking-wide text-foreground leading-tight block truncate">
                      {style.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {!selectedStyle && (
            <p className="text-[10px] font-mono text-muted-foreground">Select a cover edition to unlock Dispatch Correspondent</p>
          )}
        </div>

        {/* Dispatch button */}
        <div className="pt-2 flex items-center justify-between gap-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono hidden sm:block">
            {!canDispatch ? 'Complete all fields above' : `Ready: "${title}" · ${files.length} photos · ${COVER_STYLES.find(s => s.id === selectedStyle)?.name}`}
          </p>
          <Button
            size="lg"
            onClick={handleDispatch}
            disabled={!canDispatch}
            className="font-mono text-xs uppercase tracking-widest rounded-none shrink-0 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_32px_-4px_hsl(var(--primary)/0.7)] disabled:shadow-none transition-shadow"
          >
            Dispatch Correspondent
          </Button>
        </div>
      </div>
    </div>
  );
}
