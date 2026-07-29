import fs from 'fs';
import * as googleTTS from 'google-tts-api';
// @ts-ignore
import { parseCSV } from './utils.js';

/**
 * 1. The core interface that all TTS providers must follow.
 */
export interface TTSProvider {
  /**
   * Generates audio from text.
   * @param text The text to convert to speech.
   * @returns A promise that resolves to a Buffer containing the MP3 data.
   */
  generateAudio(text: string): Promise<Buffer>;
}

/**
 * 2. An implementation of the interface using a free API.
 */
export class GoogleFreeTTSProvider implements TTSProvider {
  private language: string;

  constructor(language: string = 'en') {
    this.language = language;
  }

  async generateAudio(text: string): Promise<Buffer> {
    try {
      // Note: The free Google API has a ~200 character limit per request. 
      // For longer texts, the 'google-tts-api' package offers 'getAllAudioBase64',
      // but for this example we are using 'getAudioBase64' for standard sentences.
      const audioBase64 = await googleTTS.getAudioBase64(text, {
        lang: this.language,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
      });

      // Convert the base64 string back into binary MP3 data
      return Buffer.from(audioBase64, 'base64');
    } catch (error) {
      throw new Error(`Google TTS failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * 3. The main service that handles saving files, agnostic to which provider is used.
 */
export class TTSService {
  private provider: TTSProvider;

  constructor(provider: TTSProvider) {
    this.provider = provider;
  }

  /**
   * Allows swapping providers dynamically at runtime.
   */
  setProvider(provider: TTSProvider): void {
    this.provider = provider;
  }

  /**
   * Converts text to speech and saves it as an MP3 file.
   * @param text Text to convert.
   * @param outputPath Path to save the MP3 file.
   */
  async saveToFile(text: string, outputPath: string): Promise<void> {
    try {
      const audioBuffer = await this.provider.generateAudio(text);
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`Successfully saved MP3 to ${outputPath}`);
    } catch (error) {
      console.error('Failed to save MP3:', error);
      throw error;
    }
  }
}

// ==========================================
// Main Script
// ==========================================
async function main() {
  const audioDir = './audio';
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir);
  }

  const csvText = fs.readFileSync('data.csv', 'utf-8');
  // @ts-ignore
  const data = parseCSV(csvText);

  const freeProvider = new GoogleFreeTTSProvider('de');
  const ttsService = new TTSService(freeProvider);

  for (const row of data) {
    const deWord = row.deWord.trim();
    const deSentence = row.deSentence.trim();

    // Create a safe filename (avoid slashes etc.)
    const safeFilename = deWord.replace(/[\/\\?%*:|"<>]/g, '-').toLowerCase();
    const wordPath = `${audioDir}/${safeFilename}.mp3`;
    const sentencePath = `${audioDir}/${safeFilename}-sentence.mp3`;

    if (!fs.existsSync(wordPath)) {
      console.log(`Generating: ${wordPath}`);
      await ttsService.saveToFile(deWord, wordPath);
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.log(`Skipping: ${wordPath} (already exists)`);
    }

    if (!fs.existsSync(sentencePath)) {
      console.log(`Generating: ${sentencePath}`);
      await ttsService.saveToFile(deSentence, sentencePath);
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.log(`Skipping: ${sentencePath} (already exists)`);
    }
  }
}

// Execute the test
main();
