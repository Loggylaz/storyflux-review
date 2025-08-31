import { OpenAITTS } from './openai.js';
import { MockTTS } from './mock.js';
import type { TTSProvider } from './base.js';
import { AzureTTS } from './azure.js';

export function getTTSProvider(): TTSProvider {
  const prov = (process.env.TTS_PROVIDER || 'none').toLowerCase();
  switch (prov) {
    case 'azure':  return new AzureTTS();
    case 'openai': return new OpenAITTS();
    default:       return new MockTTS();
  }
}
