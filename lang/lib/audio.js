export function audioSafeName(word) {
  return word.replace(/[\/\\?%*:|"<>]/g, '-').toLowerCase();
}

// Returns the Audio element so callers can react to playback finishing (e.g. 'ended').
export function playAudioFile(audioName) {
  const audio = new Audio(`audio/${audioName}.mp3`);
  audio.play();
  return audio;
}

export function playCardAudio(word, isSentence) {
  const safeName = audioSafeName(word);
  return playAudioFile(isSentence ? `${safeName}-sentence` : safeName);
}
