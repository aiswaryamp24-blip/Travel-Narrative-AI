import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import {
  useListFollowing,
  useTagTripCompanion,
  useUntagTripCompanion,
  getGetTripQueryKey,
  getGetUserProfileQueryKey,
  getListFollowingQueryKey,
  type TripCompanion,
} from '@workspace/api-client-react';
import { toast } from 'sonner';
import { UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Avatar row of who traveled on this trip. Tagging is owner-only and
 * scoped to people the owner already follows (there's no user-search
 * feature in the app), and every tag starts pending until the tagged
 * person confirms it — so it never surprises someone by appearing on
 * their profile without their say-so.
 */
export function TripCompanions({
  tripId,
  isOwner,
  companions,
}: {
  tripId: number;
  isOwner: boolean;
  companions: TripCompanion[];
}) {
  const { user } = useUser();
  const [pickerOpen, setPickerOpen] = useState(false);
  const queryClient = useQueryClient();

  const tagCompanion = useTagTripCompanion();
  const untagCompanion = useUntagTripCompanion();

  // When isOwner is true, the current viewer IS the trip owner, so their
  // own Clerk id is exactly whose follow-list the picker needs — no
  // separate "trip owner's user id" field has to be exposed by the API.
  const { data: following } = useListFollowing(user?.id ?? '', {
    query: { queryKey: getListFollowingQueryKey(user?.id ?? ''), enabled: pickerOpen && isOwner && !!user?.id },
  });

  const invalidate = (taggedUserId?: string) => {
    queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
    if (taggedUserId) {
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(taggedUserId) });
    }
  };

  const handleTag = async (userId: string) => {
    try {
      await tagCompanion.mutateAsync({ tripId, data: { userId } });
      invalidate(userId);
      toast.success('Companion tagged — waiting on their confirmation.');
    } catch {
      toast.error('Failed to tag companion.');
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await untagCompanion.mutateAsync({ tripId, userId });
      invalidate(userId);
    } catch {
      toast.error('Failed to remove companion.');
    }
  };

  const alreadyTaggedIds = new Set(companions.map((c) => c.user.id));
  const pickableFollows = Array.isArray(following)
    ? following.filter((u) => !alreadyTaggedIds.has(u.id))
    : [];

  if (companions.length === 0 && !isOwner) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {companions.length > 0 && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Traveling with
        </span>
      )}
      {companions.map((c) => {
        const canRemove = isOwner || user?.id === c.user.id;
        return (
          <div key={c.user.id} className="relative group">
            <Avatar className={`h-8 w-8 rounded-none border border-border ${c.status === 'pending' ? 'opacity-40' : ''}`}>
              <AvatarImage src={c.user.avatarUrl ?? undefined} alt={c.user.displayName} className="rounded-none" />
              <AvatarFallback className="rounded-none text-xs font-serif bg-primary/10 text-primary">
                {c.user.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {c.status === 'pending' && (
              <span className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full px-1 text-[7px] font-mono uppercase text-muted-foreground">
                Invited
              </span>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={() => handleRemove(c.user.id)}
                className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove companion"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}

      {isOwner && (
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none font-mono text-[10px] uppercase tracking-widest gap-2"
            onClick={() => setPickerOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" /> Tag Companion
          </Button>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle className="font-serif">Tag a companion</DialogTitle>
            </DialogHeader>
            {pickableFollows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {alreadyTaggedIds.size > 0
                  ? 'Everyone you follow is already tagged.'
                  : "You haven't followed anyone yet — follow someone first to tag them here."}
              </p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {pickableFollows.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleTag(u.id)}
                    disabled={tagCompanion.isPending}
                    className="w-full flex items-center gap-3 p-2 hover:bg-accent transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar className="h-8 w-8 rounded-none">
                      <AvatarImage src={u.avatarUrl ?? undefined} alt={u.displayName} className="rounded-none" />
                      <AvatarFallback className="rounded-none text-xs font-serif bg-primary/10 text-primary">
                        {u.displayName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{u.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
