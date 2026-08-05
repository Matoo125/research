const MEMORY_KEY = 'flashcard_memory';
export const AUTO_READ_KEY = 'autoReadAudio';
export const TRANSLATION_MODE_KEY = 'translationMode'; // 'sentence' (default) or 'word'

export function loadMemory() {
  return JSON.parse(localStorage.getItem(MEMORY_KEY) || '{}');
}

// Returns a new memory object with the answer appended; does not mutate `memory`.
export function saveMemoryEntry(memory, deWord, input, correct) {
  const entry = { timestamp: Date.now(), input, correct };
  const next = { ...memory, [deWord]: [...(memory[deWord] || []), entry] };
  localStorage.setItem(MEMORY_KEY, JSON.stringify(next));
  return next;
}

export function loadAutoRead() {
  return localStorage.getItem(AUTO_READ_KEY) === 'true';
}

export function saveAutoRead(value) {
  localStorage.setItem(AUTO_READ_KEY, value ? 'true' : 'false');
}

export function loadTranslationMode() {
  return localStorage.getItem(TRANSLATION_MODE_KEY) === 'word' ? 'word' : 'sentence';
}

export function saveTranslationMode(mode) {
  localStorage.setItem(TRANSLATION_MODE_KEY, mode);
}
