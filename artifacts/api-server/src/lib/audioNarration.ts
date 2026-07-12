import { textToSpeech } from '@workspace/integrations-openai-ai-server/audio';
import { ObjectStorageService } from './objectStorage';

const objectStorageService = new ObjectStorageService();

/**
 * Synthesizes a day's headline + narrative into spoken-word audio and
 * stores it in object storage. Used for the "listen to this issue" feature
 * so travelers can hear the story read aloud instead of reading it.
 *
 * Voice is one of a fixed set of presets (alloy/echo/fable/onyx/nova/shimmer)
 * — the API has no accent or age controls, so "British female" isn't
 * directly selectable. `nova` is the closest available match (documented as
 * a warmer, feminine-leaning voice); `fable` is the alternative worth trying
 * if you want more of a storyteller/narrator quality instead.
 */
export async function synthesizeDayNarration(
  headline: string,
  narrative: string,
): Promise<string> {
  const text = `${headline}. ${narrative}`;
  const audioBuffer = await textToSpeech(text, 'nova', 'mp3');
  return objectStorageService.uploadBufferAsObject(audioBuffer, 'audio/mpeg');
}
