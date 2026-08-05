# TypeScript TTS Generator

A modular Text-to-Speech service written in TypeScript. It uses the Strategy Pattern to allow easy swapping of underlying TTS providers and currently defaults to a free Google TTS provider.

## Installation

Install the required dependencies using npm:

```bash
npm install
```

## Usage

You can run the script via npm. It optionally accepts the text to convert and the language code (e.g., `en`, `fr`, `es`, `de`).

```bash
# Run with default text and language (English)
npm start

# Run with custom text
npm start -- "Bonjour tout le monde"

# Run with custom text and specific language (e.g., French)
npm start -- "Bonjour tout le monde" fr
```

The output will automatically be saved to `output.mp3` in the current directory.

## Adding new providers
To add a new provider (like OpenAI or AWS):
1. Create a class that implements the `TTSProvider` interface.
2. In `tts.ts`, instantiate your new class and pass it into the `TTSService`.

## Frontend Architecture
The flashcard app (`App.jsx`, `components/`, `lib/`) is built with [Preact](https://preactjs.com/) and rendered by Vite (`@preact/preset-vite`). State (answer memory, current card, settings) lives in `App.jsx` and flows down as props; card categorization on the Overview page and score updates are derived from that state on every render rather than patched into the DOM by hand. Pure logic — spaced-repetition scoring (`lib/srs.js`), text normalization/highlighting (`lib/text.js`), audio playback (`lib/audio.js`), and `localStorage` persistence (`lib/storage.js`) — is factored out of the components so it can be tested independently of rendering.
