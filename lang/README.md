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

## Technical Debt
### Frontend Architecture (Vanilla JS DOM Manipulation)
The application currently uses vanilla JavaScript to render the UI by dynamically constructing HTML strings and modifying `innerHTML`, or by physically manipulating DOM nodes (`appendChild`, updating text nodes). 
- **Issue**: This "throwaway DOM" and targeted mutation approach is brittle and scales poorly as application state becomes more complex. For instance, correctly moving flashcards between "Learning" and "Learned" sections on the Overview page requires highly specific, manual DOM traversal and element mutation.
- **Recommendation**: To satisfy modern engineering standards, the frontend should be migrated to a declarative, component-based UI library (such as React, Preact, Vue, or Svelte). This would allow state-driven rendering (via a Virtual DOM), naturally solving UI categorization, score updates, and preserving user interaction state without manual node manipulation.
