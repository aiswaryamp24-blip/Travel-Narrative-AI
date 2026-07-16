import { useState } from 'react';
import type { DigestStyle } from '@workspace/api-client-react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRIP_STYLES } from '@/lib/trip-styles';

/**
 * Full-screen step in the trip-creation flow where the traveler picks one
 * of six visual styles for their story page — modeled on digests-section.tsx's
 * StylePickerModal, but adapted for creation (no preselected "current" style,
 * a Continue button that just hands the choice back to the caller rather
 * than firing a mutation itself).
 */
export function TripStyleStep({
  onConfirm,
  onBack,
}: {
  onConfirm: (style: DigestStyle) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<DigestStyle | null>(null);
  const selectedDef = TRIP_STYLES.find((s) => s.id === selected);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl">Choose your story's style</h2>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
          This shapes how your trip's story page looks
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TRIP_STYLES.map((style) => {
          const isSelected = selected === style.id;
          const bg = `hsl(${style.colors.background})`;
          const fg = `hsl(${style.colors.foreground})`;
          const card = `hsl(${style.colors.card})`;
          const primary = `hsl(${style.colors.primary})`;
          const muted = `hsl(${style.colors.mutedForeground})`;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => setSelected(style.id)}
              className={`relative text-left border-2 transition-all focus:outline-none ${
                isSelected
                  ? 'border-primary shadow-lg scale-[1.02]'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              {/* Preview swatch */}
              <div className="relative h-28 overflow-hidden" style={{ backgroundColor: bg }}>
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <div>
                    <div
                      className="text-[13px] leading-none mb-1.5"
                      style={{ color: primary, fontFamily: style.fonts.display, fontWeight: 700 }}
                    >
                      Aa
                    </div>
                    <div
                      className="text-[9px] leading-none"
                      style={{ color: fg, fontFamily: style.fonts.body, opacity: 0.8 }}
                    >
                      The road so far
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[0, 1].map((i) => (
                      <div key={i} className="p-1.5" style={{ backgroundColor: card, opacity: 0.9 }}>
                        <div className="h-1 w-6 mb-1" style={{ backgroundColor: muted, opacity: 0.5 }} />
                        <div className="h-2 w-8" style={{ backgroundColor: primary }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: primary }} />
              </div>

              {/* Label */}
              <div className="p-2.5 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest font-bold">
                    {style.name}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {style.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 mt-6">
        <Button
          variant="outline"
          size="sm"
          className="rounded-none font-mono text-xs uppercase tracking-widest"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          size="sm"
          className="rounded-none font-mono text-xs uppercase tracking-widest"
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
        >
          {selectedDef ? `Continue with ${selectedDef.name}` : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
