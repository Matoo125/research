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
