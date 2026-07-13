import { useEffect, useRef, useState } from 'react';
import type { TripDay } from '@workspace/api-client-react';
import { Headphones, Pause } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Picks a British English voice from whatever the browser/OS exposes,
 * preferring one that reads as female by name. Browsers vary a lot in
 * which voices they ship — Chrome on most platforms includes a genuine
 * "Google UK English Female" voice, which is what this is really aiming
 * for — but there's no reliable "female" flag on SpeechSynthesisVoice
 * itself, so this is a best-effort name match, with graceful fallbacks
 * down to any English voice, then whatever the browser defaults to.
 */
function pickBritishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const british = voices.filter((v) => v.lang === 'en-GB' || v.lang === 'en_GB');
  const britishFemale = british.find((v) => /female|kate|serena|libby|hazel|sonia/i.test(v.name));
  return britishFemale ?? british[0] ?? voices.find((v) => v.lang.startsWith('en')) ?? voices[0];
}

export function DayAudioPlayer({ day }: { tripId: number; day: TripDay }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    // Stop any narration still playing if the user navigates away mid-day.
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!day.headline || !day.narrative || !isSupported) return null;

  const speak = (voices: SpeechSynthesisVoice[]) => {
    const utterance = new SpeechSynthesisUtterance(`${day.headline}. ${day.narrative}`);
    const voice = pickBritishVoice(voices);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast.error('Could not play narration.');
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleClick = () => {
    if (isPlaying) {
      // Web Speech API's pause/resume is unreliable across browsers, so
      // this stops outright rather than truly pausing — clicking Listen
      // again restarts from the beginning.
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speak(voices);
    } else {
      // Chrome in particular loads voices asynchronously on first use.
      window.speechSynthesis.onvoiceschanged = () => speak(window.speechSynthesis.getVoices());
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest border border-border px-3 py-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
    >
      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
      {isPlaying ? 'Stop' : 'Listen'}
    </button>
  );
}
