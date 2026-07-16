import {
  useListDigests,
  useGenerateDigest,
  useDeleteDigest,
  useUpdateUserSettings,
  getListDigestsQueryKey,
  getGetUserProfileQueryKey,
  downloadDigest,
} from '@workspace/api-client-react';
import type { DigestCadenceMonths, DigestStyle } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Sparkles, Download, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useState } from 'react';

const CADENCE_OPTIONS = [
  { value: 3, label: 'Every 3 months' },
  { value: 4, label: 'Every 4 months' },
  { value: 6, label: 'Every 6 months' },
];

// --- Style definitions (mirrored from server) ---

type StyleDef = {
  id: DigestStyle;
  name: string;
  bg: string;
  surface: string;
  accent: string;
  fg: string;
  muted: string;
  description: string;
};

const STYLE_DEFS: StyleDef[] = [
  {
    id: 'pop-art',
    name: 'Pop Art',
    bg: '#FFEC00',
    surface: '#FFFFFF',
    accent: '#E8112D',
    fg: '#0D0D0D',
    muted: '#3D3D3D',
    description: 'Bold primaries, thick borders, Ben-day energy',
  },
  {
    id: 'supermarket',
    name: 'Supermarket',
    bg: '#F5F5F0',
    surface: '#FFFFFF',
    accent: '#CC0000',
    fg: '#111111',
    muted: '#555555',
    description: 'Receipt paper white, barcode accents',
  },
  {
    id: 'camera-interface',
    name: 'Camera Interface',
    bg: '#0A0A0A',
    surface: '#1A1A1A',
    accent: '#00FF41',
    fg: '#E8E8E8',
    muted: '#6B6B6B',
    description: 'Black EVF, green CRT readouts',
  },
  {
    id: 'canon-camera',
    name: 'Canon Camera',
    bg: '#1A1A1A',
    surface: '#2A2A2A',
    accent: '#E0051E',
    fg: '#F0F0F0',
    muted: '#8A8A8A',
    description: 'Classic body black, signature red',
  },
  {
    id: 'ios-core',
    name: 'iOS Core',
    bg: '#F2F2F7',
    surface: '#FFFFFF',
    accent: '#007AFF',
    fg: '#1C1C1E',
    muted: '#8E8E93',
    description: 'Light grouped backgrounds, system blue',
  },
  {
    id: 'android-core',
    name: 'Android Core',
    bg: '#1C1B1F',
    surface: '#2B2930',
    accent: '#D0BCFF',
    fg: '#E6E1E5',
    muted: '#938F99',
    description: 'Material dark surface, tertiary purple',
  },
];

// --- Style Picker Modal ---

function StylePickerModal({
  current,
  onSelect,
  onClose,
  isGenerating,
}: {
  current: DigestStyle;
  onSelect: (style: DigestStyle) => void;
  onClose: () => void;
  isGenerating: boolean;
}) {
  const [selected, setSelected] = useState<DigestStyle>(current);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-background border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-serif text-xl">Choose Your Wrapped Style</h3>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
              Your choice is saved for future digests
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Style grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-6">
          {STYLE_DEFS.map((style) => {
            const isSelected = selected === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelected(style.id)}
                className={`relative text-left border-2 transition-all focus:outline-none ${
                  isSelected
                    ? 'border-primary shadow-lg scale-[1.02]'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                {/* Preview swatch */}
                <div
                  className="relative h-28 overflow-hidden"
                  style={{ backgroundColor: style.bg }}
                >
                  {/* Mini cover page simulation */}
                  <div className="absolute inset-0 p-3 flex flex-col justify-between">
                    <div>
                      <div
                        className="h-1.5 w-8 mb-1.5 rounded-none"
                        style={{ backgroundColor: style.accent }}
                      />
                      <div
                        className="h-2 w-16 rounded-none opacity-80"
                        style={{ backgroundColor: style.fg }}
                      />
                      <div
                        className="h-1.5 w-12 mt-1 rounded-none"
                        style={{ backgroundColor: style.muted, opacity: 0.5 }}
                      />
                    </div>
                    {/* Stats grid mini */}
                    <div className="grid grid-cols-2 gap-1">
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className="p-1.5"
                          style={{ backgroundColor: style.surface, opacity: 0.9 }}
                        >
                          <div
                            className="h-1 w-6 mb-1 rounded-none"
                            style={{ backgroundColor: style.muted, opacity: 0.5 }}
                          />
                          <div
                            className="h-2 w-8 rounded-none"
                            style={{ backgroundColor: style.accent }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bottom accent bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: style.accent }}
                  />
                </div>

                {/* Label */}
                <div className="p-2.5" style={{ backgroundColor: 'hsl(var(--card))' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest font-bold">
                      {style.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {style.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none font-mono text-xs uppercase tracking-widest"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-none font-mono text-xs uppercase tracking-widest gap-2"
            onClick={() => onSelect(selected)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              'Generating…'
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate with {STYLE_DEFS.find((s) => s.id === selected)?.name}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main section ---

export function DigestsSection({
  userId,
  digestCadenceMonths,
  preferredDigestStyle,
}: {
  userId: string;
  digestCadenceMonths: number;
  preferredDigestStyle: DigestStyle;
}) {
  const queryClient = useQueryClient();
  const { data: digests, isLoading } = useListDigests();
  const generateDigest = useGenerateDigest();
  const deleteDigest = useDeleteDigest();
  const updateSettings = useUpdateUserSettings();

  const [showStylePicker, setShowStylePicker] = useState(false);

  const handleCadenceChange = async (value: string) => {
    try {
      await updateSettings.mutateAsync({
        userId,
        data: { digestCadenceMonths: Number(value) as DigestCadenceMonths },
      });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
      toast.success('Digest cadence updated.');
    } catch {
      toast.error('Failed to update digest cadence.');
    }
  };

  const handleGenerateWithStyle = async (style: DigestStyle) => {
    try {
      await generateDigest.mutateAsync({ data: { style } });
      queryClient.invalidateQueries({ queryKey: getListDigestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
      setShowStylePicker(false);
      toast.success('Your wrapped digest is ready.');
    } catch (err: any) {
      toast.error(
        err?.data?.error ??
          'Nothing to generate yet — no completed trips since your last digest.',
      );
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
    <>
      {showStylePicker && (
        <StylePickerModal
          current={preferredDigestStyle}
          onSelect={handleGenerateWithStyle}
          onClose={() => setShowStylePicker(false)}
          isGenerating={generateDigest.isPending}
        />
      )}

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <h2 className="text-3xl font-serif flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Your Wrapped
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Recap Frequency
              </span>
              <Select
                value={String(digestCadenceMonths)}
                onValueChange={handleCadenceChange}
                disabled={updateSettings.isPending}
              >
                <SelectTrigger className="w-[160px] rounded-none font-mono text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="rounded-none font-mono text-xs uppercase tracking-widest"
              disabled={generateDigest.isPending}
              onClick={() => setShowStylePicker(true)}
            >
              {generateDigest.isPending ? 'Generating…' : 'Generate Now'}
            </Button>
          </div>
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
    </>
  );
}
