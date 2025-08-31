import { TTSProvider } from './base.js';

// Pas d'audio serveur => on retournera 204 pour que le client fasse Web Speech.
export class MockTTS implements TTSProvider {
  async synthesizeMP3() {
    throw new Error('NO_SERVER_TTS');
  }
}