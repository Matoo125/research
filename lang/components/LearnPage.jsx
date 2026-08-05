import { Card } from './Card.jsx';

export function LearnPage({ card, memory, onAnswer, onAdvance, onPrev, onNext, autoRead }) {
  if (!card) {
    return <p class="empty-state">Loading cards…</p>;
  }

  const history = memory[card.deWord] || [];

  return (
    <>
      <Card
        key={card.deWord}
        card={card}
        history={history}
        autoRead={autoRead}
        onAnswer={onAnswer}
        onAdvance={onAdvance}
        autoFocus
      />
      <div class="learn-nav">
        <button onClick={onPrev}>&laquo; Prev</button>
        <button onClick={onNext}>Next &raquo;</button>
      </div>
    </>
  );
}
