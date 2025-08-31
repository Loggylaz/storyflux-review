import type { TTSProvider, TTSOptions } from './base.js';

/** Fallback sans audio serveur : on signale au client d'utiliser Web Speech. */
export class MockTTS implements TTSProvider {
  async synthesizeMP3(
    _voiceKey: string,
    _text: string,
    _opt?: TTSOptions
  ): Promise<ReadableStream<Uint8Array> | NodeJS.ReadableStream> {
    // On ne renvoie jamais de stream ici : on force le fallback côté client
    throw new Error('NO_SERVER_TTS');
  }
}
