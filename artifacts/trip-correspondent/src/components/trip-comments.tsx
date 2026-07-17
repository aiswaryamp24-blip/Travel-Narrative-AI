import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import {
  useListTripComments,
  useCreateTripComment,
  useDeleteTripComment,
  getListTripCommentsQueryKey,
} from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Send, MessageSquare, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Real, server-backed comments — visible to anyone who can view the trip
 * (same rule as the trip itself), unlike the old "Leave a note" box in
 * trip-reviews.tsx which only ever wrote to the current browser's
 * localStorage and nobody else could ever see it.
 */
export function TripComments({ tripId, isOwner }: { tripId: number; isOwner: boolean }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: comments, isLoading } = useListTripComments(tripId, {
    query: { queryKey: getListTripCommentsQueryKey(tripId), enabled: !!tripId },
  });

  const createComment = useCreateTripComment();
  const deleteComment = useDeleteTripComment();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListTripCommentsQueryKey(tripId) });

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await createComment.mutateAsync({ tripId, data: { body: trimmed } });
      setDraft('');
      invalidate();
    } catch {
      toast.error('Failed to post comment.');
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment.mutateAsync({ tripId, commentId });
      invalidate();
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  return (
    <section className="py-20 px-6 max-w-3xl mx-auto text-left">
      <div className="border border-border bg-card p-10 space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Comments
          </span>
        </div>

        {user && (
          <div className="relative">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder="Say something about this story…"
              rows={3}
              maxLength={2000}
              className="w-full resize-none border border-border bg-background text-foreground text-sm font-sans placeholder:text-muted-foreground/50 px-4 py-3 focus:outline-none focus:border-primary transition-colors rounded-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-[9px] text-muted-foreground/40 uppercase tracking-wider hidden sm:block">
                ⌘ + Enter to send
              </span>
              <button
                type="button"
                disabled={!draft.trim() || createComment.isPending}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-3 w-3" /> Post
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="h-px bg-border/50" />
            {comments.map((comment) => {
              const canDelete = user?.id === comment.userId || isOwner;
              return (
                <div key={comment.id} className="group relative bg-muted/40 border border-border/60 px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/80">
                      {comment.author.displayName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-wider">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Delete comment"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-sans text-foreground leading-relaxed whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No comments yet.</p>
        )}
      </div>
    </section>
  );
}
