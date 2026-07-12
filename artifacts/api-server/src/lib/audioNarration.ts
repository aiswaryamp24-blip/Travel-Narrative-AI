import { textToSpeech } from '@workspace/integrations-openai-ai-server/audio';
import { ObjectStorageService } from './objectStorage';

const objectStorageService = new ObjectStorageService();

// 'nova' is the female-leaning voice in the available preset set; the
// accent/age persona itself is steered via free-text instructions passed to
// the model, since the underlying voices don't expose an accent parameter
// directly.
const NARRATOR_VOICE = 'nova';
const NARRATOR_INSTRUCTIONS =
  'Speak as a woman in her mid-twenties with a natural British English accent (Received Pronunciation-leaning, not overdone) — warm, articulate, and engaging, like a young magazine correspondent narrating her own travel feature aloud.';

/**
 * Synthesizes a day's headline + narrative into spoken-word audio and
 * stores it in object storage. Used for the "listen to this issue" feature
 * so travelers can hear the story read aloud instead of reading it.
 */
export async function synthesizeDayNarration(
  headline: string,
  narrative: string,
): Promise<string> {
  const text = `${headline}. ${narrative}`;
  const audioBuffer = await textToSpeech(text, NARRATOR_VOICE, 'mp3', NARRATOR_INSTRUCTIONS);
  return objectStorageService.uploadBufferAsObject(audioBuffer, 'audio/mpeg');
}
