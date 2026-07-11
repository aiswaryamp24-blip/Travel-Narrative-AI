import { textToSpeech } from '@workspace/integrations-openai-ai-server/audio';
import { ObjectStorageService } from './objectStorage';

const objectStorageService = new ObjectStorageService();

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
  const audioBuffer = await textToSpeech(text, 'onyx', 'mp3');
  return objectStorageService.uploadBufferAsObject(audioBuffer, 'audio/mpeg');
}
