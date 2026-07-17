import {
  useListDigests,
  useGenerateDigest,
  useDeleteDigest,
  useRestyleDigest,
  useUpdateUserSettings,
  getListDigestsQueryKey,
  getGetUserProfileQueryKey,
  downloadDigest,
} from '@workspace/api-client-react';
import type { Digest, DigestCadenceMonths, DigestStyle } from '@workspace/api-client-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Sparkles, Download, Trash2, X, Check, Palette } from 'lucide-react';
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
  accentFg: string;
  fg: string;
  muted: string;
  headlineFg: string;
  subtitleFg: string;
  darkCover: boolean;
  description: string;
};

const STYLE_DEFS: StyleDef[] = [
  {
    id: 'pop-art',
    name: 'Pop Art',
    bg: '#FFEC00',
    surface: '#FFFFFF',
    accent: '#E8112D',
    accentFg: '#FFFFFF',
    fg: '#0D0D0D',
    muted: '#3D3D3D',
    headlineFg: '#0D0D0D',
    subtitleFg: '#E8112D',
    darkCover: false,
    description: 'Bold primaries, thick borders, Ben-day energy',
  },
  {
    id: 'supermarket',
    name: 'Supermarket',
    bg: '#F5F5F0',
    surface: '#FFFFFF',
    accent: '#CC0000',
    accentFg: '#FFFFFF',
    fg: '#111111',
    muted: '#555555',
    headlineFg: '#111111',
    subtitleFg: '#555555',
    darkCover: false,
    description: 'Receipt paper white, barcode accents',
  },
  {
    id: 'camera-interface',
    name: 'Viewfinder Interface',
    bg: '#0A0A0A',
    surface: '#1A1A1A',
    accent: '#00FF41',
    accentFg: '#0A0A0A',
    fg: '#E8E8E8',
    muted: '#6B6B6B',
    headlineFg: '#FFFFFF',
    subtitleFg: '#6B6B6B',
    darkCover: true,
    description: 'Black EVF, green CRT readouts',
  },
  {
    id: 'canon-camera',
    name: 'Canon Camera',
    bg: '#1A1A1A',
    surface: '#2A2A2A',
    accent: '#E0051E',
    accentFg: '#FFFFFF',
    fg: '#F0F0F0',
    muted: '#8A8A8A',
    headlineFg: '#FFFFFF',
    subtitleFg: '#8A8A8A',
    darkCover: true,
    description: 'Classic body black, signature red',
  },
  {
    id: 'ios-core',
    name: 'iOS Core',
    bg: '#F2F2F7',
    surface: '#FFFFFF',
    accent: '#007AFF',
    accentFg: '#FFFFFF',
    fg: '#1C1C1E',
    muted: '#8E8E93',
    headlineFg: '#1C1C1E',
    subtitleFg: '#8E8E93',
    darkCover: false,
    description: 'Light grouped backgrounds, system blue',
  },
  {
    id: 'android-core',
    name: 'Android Core',
    bg: '#1C1B1F',
    surface: '#2B2930',
    accent: '#D0BCFF',
    accentFg: '#381E72',
    fg: '#E6E1E5',
    muted: '#938F99',
    headlineFg: '#FFFFFF',
    subtitleFg: '#938F99',
    darkCover: true,
    description: 'Material dark surface, tertiary purple',
  },
];

// --- Large PDF page preview ---

const SAMPLE_STATS = [
  { label: 'Destinations', value: '12' },
  { label: 'Photos taken', value: '847' },
  { label: 'Days abroad', value: '143' },
  { label: 'Trips covered', value: '8' },
  { label: 'Countries', value: '9' },
  { label: 'Cities visited', value: '31' },
];

function DigestPagePreview({ style }: { style: StyleDef }) {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* Cover page mock — A4 ratio ~0.707 */}
      <div
        className="w-full relative overflow-hidden"
        style={{ backgroundColor: style.bg, aspectRatio: '1 / 1.414' }}
      >
        {/* Top accent stripe */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: '6px', backgroundColor: style.accent }}
        />

        {/* Cover content */}
        <div className="absolute inset-0 flex flex-col justify-between p-[8%]">
          {/* Top section */}
          <div>
            {/* Kicker label */}
            <div
              className="text-[9px] font-mono uppercase tracking-widest mb-3"
              style={{ color: style.accent }}
            >
              ✦ Trip Correspondent
            </div>
            {/* Main headline */}
            <div
              className="font-serif leading-tight mb-2"
              style={{ color: style.headlineFg, fontSize: 'clamp(18px, 5cqw, 28px)' }}
            >
              Your Travel<br />Year in Review
            </div>
            {/* Subtitle / year */}
            <div
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: style.subtitleFg }}
            >
              Wrapped · 2025
            </div>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-2 my-auto">
            <div className="flex-1 h-px" style={{ backgroundColor: style.muted, opacity: 0.4 }} />
            <div
              className="text-[8px] font-mono uppercase tracking-widest px-2"
              style={{ color: style.muted }}
            >
              ◈
            </div>
            <div className="flex-1 h-px" style={{ backgroundColor: style.muted, opacity: 0.4 }} />
          </div>

          {/* Bottom stats teaser */}
          <div>
            <div
              className="text-[8px] font-mono uppercase tracking-widest mb-2"
              style={{ color: style.muted }}
            >
              Highlights inside
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SAMPLE_STATS.slice(0, 3).map((stat) => (
                <div
                  key={stat.label}
                  className="p-2"
                  style={{ backgroundColor: style.surface }}
                >
                  <div
                    className="text-[7px] font-mono uppercase tracking-wide leading-tight mb-1"
                    style={{ color: style.muted }}
                  >
                    {stat.label}
                  </div>
                  <div
                    className="font-mono font-bold"
                    style={{ color: style.accent, fontSize: 'clamp(11px, 2.5cqw, 16px)' }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: '6px', backgroundColor: style.accent }}
        />
      </div>

      {/* Stats page mock */}
      <div
        className="w-full relative overflow-hidden"
        style={{ backgroundColor: style.surface, aspectRatio: '1 / 1.414' }}
      >
        <div className="absolute inset-0 flex flex-col p-[8%]">
          {/* Page header */}
          <div className="mb-4">
            <div
              className="text-[8px] font-mono uppercase tracking-widest mb-1"
              style={{ color: style.accent }}
            >
              ✦ Your Stats
            </div>
            <div
              className="font-serif"
              style={{ color: style.fg, fontSize: 'clamp(14px, 4cqw, 20px)' }}
            >
              By the Numbers
            </div>
            <div
              className="h-px mt-2"
              style={{ backgroundColor: style.muted, opacity: 0.3 }}
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {SAMPLE_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col justify-between p-3"
                style={{ backgroundColor: style.bg }}
              >
                <div
                  className="text-[7px] font-mono uppercase tracking-wide leading-tight"
                  style={{ color: style.muted }}
                >
                  {stat.label}
                </div>
                <div
                  className="font-mono font-bold mt-1"
                  style={{ color: style.accent, fontSize: 'clamp(16px, 4cqw, 24px)' }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Footer rule */}
          <div className="mt-auto pt-3">
            <div
              className="h-px mb-2"
              style={{ backgroundColor: style.muted, opacity: 0.3 }}
            />
            <div
              className="text-[7px] font-mono uppercase tracking-widest text-center"
              style={{ color: style.muted }}
            >
              Trip Correspondent · Wrapped 2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Style Picker Modal ---

type StylePickerMode = 'generate' | 'restyle';

function StylePickerModal({
  current,
  onSelect,
  onClose,
  isPending,
  mode,
}: {
  current: DigestStyle;
  onSelect: (style: DigestStyle) => void;
  onClose: () => void;
  isPending: boolean;
  mode: StylePickerMode;
}) {
  const [selected, setSelected] = useState<DigestStyle>(current);
  const selectedStyle = STYLE_DEFS.find((s) => s.id === selected)!;

  const isRestyle = mode === 'restyle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-background border border-border w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h3 className="font-serif text-xl">
              {isRestyle ? 'Change Digest Style' : 'Choose Your Wrapped Style'}
            </h3>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
              {isRestyle
                ? 'Re-renders this digest PDF · same period, new look'
                : 'Select a style to see a full preview · your choice is saved'}
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

        {/* Body: two-panel layout */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left: style selector */}
          <div className="md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-0">
              {STYLE_DEFS.map((style) => {
                const isSelected = selected === style.id;
                const isCurrent = isRestyle && style.id === current;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSelected(style.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-left border-b border-border transition-all focus:outline-none ${
                      isSelected
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    {/* Colour chip */}
                    <div
                      className="flex-shrink-0 w-10 h-10 border border-border/50 relative overflow-hidden"
                      style={{ backgroundColor: style.bg }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ backgroundColor: style.accent }}
                      />
                      <div className="absolute inset-0 p-1.5 flex flex-col gap-0.5">
                        <div
                          className="h-0.5 w-4 rounded-none"
                          style={{ backgroundColor: style.headlineFg, opacity: 0.7 }}
                        />
                        <div
                          className="h-0.5 w-3 rounded-none"
                          style={{ backgroundColor: style.muted, opacity: 0.5 }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono uppercase tracking-widest font-bold truncate">
                          {style.name}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isCurrent && (
                            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                              current
                            </span>
                          )}
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight truncate">
                        {style.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: full-bleed preview */}
          <div className="flex-1 overflow-y-auto bg-muted/30">
            <div className="p-4 md:p-6">
              {/* Preview label */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-px flex-1"
                  style={{ backgroundColor: selectedStyle.accent, opacity: 0.6 }}
                />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {selectedStyle.name} · Cover &amp; Stats Preview
                </span>
                <div
                  className="h-px flex-1"
                  style={{ backgroundColor: selectedStyle.accent, opacity: 0.6 }}
                />
              </div>

              <div className="max-w-xs mx-auto">
                <DigestPagePreview style={selectedStyle} />
              </div>

              <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-4">
                Sample data shown · your real trips &amp; stats will appear in the PDF
              </p>
            </div>
          </div>
        </div>

        {/* Footer — always visible */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none font-mono text-xs uppercase tracking-widest"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-none font-mono text-xs uppercase tracking-widest gap-2"
            onClick={() => onSelect(selected)}
            disabled={isPending}
          >
            {isPending ? (
              isRestyle ? 'Restyling…' : 'Generating…'
            ) : isRestyle ? (
              <>
                <Palette className="h-3.5 w-3.5" />
                Apply {selectedStyle.name}
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate with {selectedStyle.name}
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
  digestEmailEnabled,
}: {
  userId: string;
  digestCadenceMonths: number;
  preferredDigestStyle: DigestStyle;
  digestEmailEnabled: boolean;
}) {
  const queryClient = useQueryClient();
  const { data: digests, isLoading } = useListDigests();
  const generateDigest = useGenerateDigest();
  const deleteDigest = useDeleteDigest();
  const updateSettings = useUpdateUserSettings();

  const restyleDigest = useRestyleDigest();

  const [showStylePicker, setShowStylePicker] = useState(false);
  // When set, we're restyling an existing digest rather than generating a new one.
  const [restyleTarget, setRestyleTarget] = useState<Digest | null>(null);

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

  const handleEmailToggle = async (enabled: boolean) => {
    try {
      await updateSettings.mutateAsync({
        userId,
        data: { digestCadenceMonths: digestCadenceMonths as DigestCadenceMonths, digestEmailEnabled: enabled },
      });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
      toast.success(enabled ? 'Email notifications turned on.' : 'Email notifications turned off.');
    } catch {
      toast.error('Failed to update email preference.');
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

  const handleRestyleWithStyle = async (style: DigestStyle) => {
    if (!restyleTarget) return;
    try {
      await restyleDigest.mutateAsync({ digestId: restyleTarget.id, data: { style } });
      queryClient.invalidateQueries({ queryKey: getListDigestsQueryKey() });
      setRestyleTarget(null);
      toast.success('Digest re-rendered in the new style.');
    } catch (err: any) {
      toast.error(err?.data?.error ?? 'Failed to restyle digest.');
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
          isPending={generateDigest.isPending}
          mode="generate"
        />
      )}
      {restyleTarget && (
        <StylePickerModal
          current={restyleTarget.style}
          onSelect={handleRestyleWithStyle}
          onClose={() => setRestyleTarget(null)}
          isPending={restyleDigest.isPending}
          mode="restyle"
        />
      )}

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <h2 className="text-3xl font-serif flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Your Wrapped
          </h2>
          <div className="flex flex-wrap items-center gap-3">
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
            <div className="flex items-center gap-2">
              <Switch
                id="digest-email-toggle"
                checked={digestEmailEnabled}
                onCheckedChange={handleEmailToggle}
                disabled={updateSettings.isPending}
              />
              <Label
                htmlFor="digest-email-toggle"
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground cursor-pointer"
              >
                Email me
              </Label>
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
            {digests.map((digest) => {
              const styleDef = STYLE_DEFS.find((s) => s.id === digest.style);
              return (
                <div key={digest.id} className="border border-border bg-card p-5 space-y-3">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {format(new Date(digest.periodStart), 'MMM yyyy')} – {format(new Date(digest.periodEnd), 'MMM yyyy')}
                  </div>
                  <div className="font-serif text-lg">
                    {digest.tripCount} {digest.tripCount === 1 ? 'trip' : 'trips'} covered
                  </div>
                  {styleDef && (
                    <div className="flex items-center gap-1.5">
                      {/* Style colour chip */}
                      <div
                        className="w-3 h-3 flex-shrink-0 border border-border/50"
                        style={{ backgroundColor: styleDef.accent }}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {styleDef.name}
                      </span>
                    </div>
                  )}
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
                      className="rounded-none font-mono text-xs uppercase tracking-widest gap-1.5"
                      disabled={restyleDigest.isPending}
                      onClick={() => setRestyleTarget(digest)}
                      aria-label="Change style"
                      title="Change style"
                    >
                      <Palette className="h-3.5 w-3.5" />
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
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
