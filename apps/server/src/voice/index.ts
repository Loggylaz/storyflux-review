import { OpenAITTS } from './openai.js';
import { MockTTS } from './mock.js';
import type { TTSProvider } from './base.js';

export function getTTSProvider(): TTSProvider {
  switch ((process.env.TTS_PROVIDER || 'none').toLowerCase()) {
    case 'openai': return new OpenAITTS();
    default:       return new MockTTS();
  }
}
