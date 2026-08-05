import { useEffect, useRef, useState } from 'preact/hooks';
import { normalizeGermanText, splitHighlight } from '../lib/text.js';
import { playCardAudio } from '../lib/audio.js';
import { computeSrsStatus } from '../lib/srs.js';

const FEEDBACK_COLORS = {
  correct: '#d4edda',
  incorrect: '#f8d7da',
};

// After a correct answer, waits for the sentence audio to finish (or a safety
// timeout) before calling onAdvance, so the card stays on screen while it reads.
function playSentenceThenAdvance(deWord, onAdvance) {
  const audio = playCardAudio(deWord, true);
  let advanced = false;
  const advanceOnce = () => {
    if (advanced) return;
    advanced = true;
    onAdvance();
  };
  audio.addEventListener('ended', advanceOnce, { once: true });
  audio.addEventListener('error', advanceOnce, { once: true });
  setTimeout(advanceOnce, 8000); // in case playback stalls or is blocked
}

export function Card({ card, history, autoRead, onAnswer, onAdvance, autoFocus }) {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
  const [helpOpen, setHelpOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef(null);

  const { isLearned, correctCount, totalCount } = computeSrsStatus(history);
  const greenOpacity = Math.min(correctCount * 0.15, 0.7);
  const cardStyle = correctCount > 0 ? { backgroundColor: `rgba(144, 238, 144, ${greenOpacity})` } : undefined;
  const sentenceWithPlaceholder = card.deSentence.replace(card.deWord, '______');
  const { before, match, after } = splitHighlight(card.enSentence, card.enWord);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [card.deWord, autoFocus]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(false), 1100);
    return () => clearTimeout(timer);
  }, [flash]);

  function handleSubmit() {
    const trimmed = inputValue.trim();
    const isCorrect = normalizeGermanText(trimmed) === normalizeGermanText(card.deWord);
    onAnswer(card.deWord, trimmed, isCorrect);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      if (autoRead) {
        if (onAdvance) playSentenceThenAdvance(card.deWord, onAdvance);
        else playCardAudio(card.deWord, true);
      } else if (onAdvance) {
        setTimeout(onAdvance, 1000);
      }
    } else {
      if (autoRead) playCardAudio(card.deWord, false);
      setHelpOpen(true);
      setFlash(true);
    }
  }

  return (
    <div class={`card${helpOpen ? ' help-open' : ''}`} style={cardStyle}>
      <div class="score-display">[{correctCount}/{totalCount}]</div>
      <div class="sentence">{sentenceWithPlaceholder}</div>
      <div class="sentence-translated">
        {before}
        {match && <span class="highlighted-word">{match}</span>}
        {after}
      </div>
      <div class="translation">{card.enWord}</div>
      <div class="word">
        {card.deWord}
        {isLearned && <span class="learned-badge" title="Learned">🌟</span>}
      </div>
      <input
        ref={inputRef}
        type="text"
        class="answer"
        value={inputValue}
        onInput={e => setInputValue(e.currentTarget.value)}
        onKeyPress={e => { if (e.key === 'Enter') handleSubmit(); }}
        style={feedback ? { backgroundColor: FEEDBACK_COLORS[feedback] } : undefined}
      />
      <div class="card-actions">
        <button onClick={handleSubmit}>Submit</button>
        <button class="help" onClick={() => setHelpOpen(open => !open)}>Help</button>
        <button onClick={() => playCardAudio(card.deWord, false)}>🔊 Word</button>
        <button onClick={() => playCardAudio(card.deWord, true)}>🔊 Sentence</button>
        <button onClick={() => alert('please email to vrzala.matej@gmail.com with any feedback.')}>Report</button>
      </div>
      <div class={`help-panel${flash ? ' flash' : ''}`}>
        <div class="help-panel-title">Answer History</div>
        {history.length === 0 ? (
          <p class="help-history-empty">No previous answers yet.</p>
        ) : (
          <ul class="help-history-list">
            {history.map((entry, idx) => (
              <li key={idx}>
                {entry.correct ? '✅' : '❌'} "{entry.input}"{' '}
                <span class="help-history-date">{new Date(entry.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
