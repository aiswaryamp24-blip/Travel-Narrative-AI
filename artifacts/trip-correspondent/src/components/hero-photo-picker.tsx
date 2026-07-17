import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateDayHeroPhoto, getGetTripQueryKey, type Photo } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Lets the trip owner pick which of a day's own photos represents it,
 * instead of the pipeline's default (the first chronological shot). Reads
 * from `trip.photos` already in memory — GET /trips/:tripId already returns
 * the full, unsliced set, so no extra fetch is needed here.
 */
export function HeroPhotoPicker({
  tripId,
  dayId,
  currentHeroPhotoId,
  dayPhotos,
}: {
  tripId: number;
  dayId: number;
  currentHeroPhotoId: number | null;
  dayPhotos: Photo[];
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const updateHeroPhoto = useUpdateDayHeroPhoto();

  const handlePick = async (photoId: number) => {
    try {
      await updateHeroPhoto.mutateAsync({ tripId, dayId, data: { heroPhotoId: photoId } });
      queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
      toast.success('Cover photo updated.');
      setOpen(false);
    } catch {
      toast.error('Failed to update cover photo.');
    }
  };

  if (dayPhotos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute bottom-4 right-4 z-10 rounded-none font-mono text-[10px] uppercase tracking-widest gap-2 bg-background/90 backdrop-blur-sm"
        onClick={() => setOpen(true)}
      >
        <ImagePlus className="h-3.5 w-3.5" /> Change Cover
      </Button>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif">Choose the cover photo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
          {dayPhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => handlePick(photo.id)}
              disabled={updateHeroPhoto.isPending}
              className={`relative aspect-square overflow-hidden bg-muted transition-opacity disabled:opacity-50 ${
                photo.id === currentHeroPhotoId ? 'ring-2 ring-primary' : 'hover:opacity-80'
              }`}
            >
              <img
                src={`/api/storage${photo.objectPath}`}
                alt="Day photograph"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
