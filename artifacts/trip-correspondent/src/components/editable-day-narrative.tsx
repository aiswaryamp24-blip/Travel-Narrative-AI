import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateTripDayNarrative, getGetTripQueryKey, type TripDay } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Pencil, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RevealOnScroll } from '@/components/reveal-on-scroll';

/**
 * Renders a day's headline/narrative, with an owner-only edit mode. Editing
 * operates on raw markdown text (a plain textarea, not WYSIWYG) so a saved
 * edit round-trips through the same ReactMarkdown renderer below without
 * disturbing the drop-cap hack, which keys off the first paragraph being
 * literally the first line of the markdown string.
 */
export function EditableDayNarrative({
  tripId,
  day,
  isOwner,
}: {
  tripId: number;
  day: TripDay;
  isOwner: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftHeadline, setDraftHeadline] = useState(day.headline ?? '');
  const [draftNarrative, setDraftNarrative] = useState(day.narrative ?? '');
  const queryClient = useQueryClient();
  const updateNarrative = useUpdateTripDayNarrative();

  const startEditing = () => {
    setDraftHeadline(day.headline ?? '');
    setDraftNarrative(day.narrative ?? '');
    setIsEditing(true);
  };

  const resetToAiOriginal = () => {
    setDraftHeadline(day.aiOriginalHeadline ?? '');
    setDraftNarrative(day.aiOriginalNarrative ?? '');
  };

  const handleSave = async () => {
    if (!draftHeadline.trim() || !draftNarrative.trim()) {
      toast.error('Headline and narrative can\'t be empty.');
      return;
    }
    try {
      await updateNarrative.mutateAsync({
        tripId,
        dayId: day.id,
        data: { headline: draftHeadline.trim(), narrative: draftNarrative.trim() },
      });
      queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
      toast.success('Story updated.');
      setIsEditing(false);
    } catch {
      toast.error('Failed to save changes.');
    }
  };

  const hasAiOriginal = !!(day.aiOriginalHeadline || day.aiOriginalNarrative);

  if (isEditing) {
    return (
      <div className="max-w-3xl space-y-6">
        <Input
          value={draftHeadline}
          onChange={(e) => setDraftHeadline(e.target.value)}
          placeholder="Headline"
          className="rounded-none font-serif text-2xl md:text-3xl h-auto py-3"
        />
        <Textarea
          value={draftNarrative}
          onChange={(e) => setDraftNarrative(e.target.value)}
          rows={12}
          placeholder="Narrative"
          className="rounded-none font-sans text-base leading-relaxed"
        />
        <div className="flex items-center justify-between gap-4">
          {hasAiOriginal ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetToAiOriginal} className="rounded-none font-mono text-[10px] uppercase tracking-widest gap-2">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to AI version
            </Button>
          ) : <span />}
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-none font-mono text-[10px] uppercase tracking-widest">
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={updateNarrative.isPending} className="rounded-none font-mono text-[10px] uppercase tracking-widest">
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RevealOnScroll delayMs={100} className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-p:font-sans prose-p:leading-loose prose-p:text-muted-foreground max-w-3xl relative group">
      {isOwner && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startEditing}
          className="absolute -top-2 right-0 rounded-none font-mono text-[10px] uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-opacity not-prose"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      )}

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
              p: ({ node, ...props }) => {
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
              },
            }}
          >
            {day.narrative}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="italic text-muted-foreground opacity-50">No narrative filed for this day.</p>
      )}
    </RevealOnScroll>
  );
}
