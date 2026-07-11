import { useState, useRef } from 'react';
import { useGenerateDayNarration } from '@workspace/api-client-react';
import type { TripDay } from '@workspace/api-client-react';
import { Headphones, Loader2, Pause } from 'lucide-react';
import { toast } from 'sonner';

export function DayAudioPlayer({ tripId, day }: { tripId: number; day: TripDay }) {
  const [audioPath, setAudioPath] = useState<string | null>(day.audioObjectPath);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generateNarration = useGenerateDayNarration();

  if (!day.headline || !day.narrative) return null;

  const handleClick = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioPath) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    try {
      let path = audioPath;
      if (!path) {
        const updated = await generateNarration.mutateAsync({ tripId, dayId: day.id });
        path = updated.audioObjectPath;
        setAudioPath(path);
      }
      if (path) {
        setTimeout(() => {
          audioRef.current?.play();
          setIsPlaying(true);
        }, 0);
      }
    } catch {
      toast.error('Failed to generate narration audio.');
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={generateNarration.isPending}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest border border-border px-3 py-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors disabled:opacity-50"
      >
        {generateNarration.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Headphones className="h-3.5 w-3.5" />
        )}
        {generateNarration.isPending ? 'Narrating...' : isPlaying ? 'Pause' : 'Listen'}
      </button>
      {audioPath && (
        <audio
          ref={audioRef}
          src={`/api/storage${audioPath}`}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
