import { useListDigests, useGenerateDigest, useDeleteDigest, getListDigestsQueryKey, downloadDigest } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Sparkles, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function DigestsSection() {
  const queryClient = useQueryClient();
  const { data: digests, isLoading } = useListDigests();
  const generateDigest = useGenerateDigest();
  const deleteDigest = useDeleteDigest();

  const handleGenerate = async () => {
    try {
      await generateDigest.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getListDigestsQueryKey() });
      toast.success('Your wrapped digest is ready.');
    } catch (err: any) {
      toast.error(err?.data?.error ?? 'Nothing to generate yet — no completed trips since your last digest.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this wrapped digest? This cannot be undone.')) {
      return;
    }
    try {
      await deleteDigest.mutateAsync({ digestId: id });
      queryClient.invalidateQueries({ queryKey: getListDigestsQueryKey() });
      toast.success('Digest deleted.');
    } catch {
      toast.error('Failed to delete digest.');
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const blob = await downloadDigest(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trip-correspondent-wrapped-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download digest.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <h2 className="text-3xl font-serif flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Your Wrapped
        </h2>
        <Button
          size="sm"
          className="rounded-none font-mono text-xs uppercase tracking-widest"
          disabled={generateDigest.isPending}
          onClick={handleGenerate}
        >
          {generateDigest.isPending ? 'Generating…' : 'Generate Now'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-none" />
          ))}
        </div>
      ) : !digests?.length ? (
        <div className="text-center py-12 bg-accent/30 border border-border">
          <p className="text-muted-foreground font-serif italic">
            No digests yet — a recap is generated automatically every few months, or hit "Generate Now" to try it early.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {digests.map((digest) => (
            <div key={digest.id} className="border border-border bg-card p-5 space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {format(new Date(digest.periodStart), 'MMM yyyy')} – {format(new Date(digest.periodEnd), 'MMM yyyy')}
              </div>
              <div className="font-serif text-lg">
                {digest.tripCount} {digest.tripCount === 1 ? 'trip' : 'trips'} covered
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none font-mono text-xs uppercase tracking-widest gap-2 flex-1"
                  onClick={() => handleDownload(digest.id)}
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none font-mono text-xs uppercase tracking-widest text-destructive hover:text-destructive"
                  disabled={deleteDigest.isPending}
                  onClick={() => handleDelete(digest.id)}
                  aria-label="Delete digest"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
