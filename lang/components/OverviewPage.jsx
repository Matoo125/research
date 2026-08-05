import { useMemo } from 'preact/hooks';
import { Card } from './Card.jsx';
import { groupForOverview } from '../lib/srs.js';

function Section({ title, cards, memory, onAnswer, autoRead }) {
  if (cards.length === 0) return null;
  return (
    <div class="section">
      <h2 class="section-title">{title}</h2>
      <div class="section-content">
        {cards.map(card => (
          <Card
            key={card.deWord}
            card={card}
            history={memory[card.deWord] || []}
            autoRead={autoRead}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </div>
  );
}

export function OverviewPage({ cards, memory, onAnswer, autoRead }) {
  const { learning, upcoming, learned } = useMemo(
    () => groupForOverview(cards, memory),
    [cards, memory]
  );

  return (
    <>
      <Section title="Learning" cards={learning} memory={memory} onAnswer={onAnswer} autoRead={autoRead} />
      <Section title="Upcoming" cards={upcoming} memory={memory} onAnswer={onAnswer} autoRead={autoRead} />
      <Section title="Learned 🌟" cards={learned} memory={memory} onAnswer={onAnswer} autoRead={autoRead} />
    </>
  );
}
