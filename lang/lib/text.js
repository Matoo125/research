// Helper to forgive special German characters (e.g., ö -> o, ä -> a, ß -> ss)
export function normalizeGermanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD') // Decomposes accents (ö -> o + ¨)
    .replace(/[̀-ͯ]/g, ''); // Removes the accent marks
}

// Splits `sentence` around the first case-insensitive, word-boundary match of `word`,
// so the caller can render the match with its own highlighting. `match` is null
// when the translation doesn't literally appear in the sentence (e.g. conjugated forms).
export function splitHighlight(sentence, word) {
  if (!word) return { before: sentence, match: null, after: '' };

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
  const result = regex.exec(sentence);
  if (!result) return { before: sentence, match: null, after: '' };

  return {
    before: sentence.slice(0, result.index),
    match: result[0],
    after: sentence.slice(result.index + result[0].length),
  };
}
