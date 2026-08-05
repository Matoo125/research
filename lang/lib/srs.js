// A card is "learned" once it's on a streak: either every attempt so far has been
// correct, or the last 3 in a row were correct.
export function computeSrsStatus(history) {
  const totalCount = history.length;
  const correctCount = history.filter(e => e.correct).length;

  let consecutiveCorrect = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].correct) consecutiveCorrect++;
    else break;
  }

  let isLearned = false;
  if (history.length > 0) {
    if (history[0].correct && history.length === consecutiveCorrect) isLearned = true;
    else if (consecutiveCorrect >= 3) isLearned = true;
  }

  return { isLearned, consecutiveCorrect, correctCount, totalCount };
}

const REVIEW_DELAYS_HOURS = [0, 1, 4, 24, 72, 168];

function computeDueTime(history, status) {
  if (!status.isLearned || history.length === 0) return 0;
  const delayIndex = Math.min(status.consecutiveCorrect, REVIEW_DELAYS_HOURS.length - 1);
  const delayMs = REVIEW_DELAYS_HOURS[delayIndex] * 60 * 60 * 1000;
  return history[history.length - 1].timestamp + delayMs;
}

// Orders cards for the /learn queue: not-yet-learned cards first (in their original
// relative order), then learned cards ordered by when they're next due for review.
export function sortForLearnQueue(cards, memory) {
  return cards
    .map(card => {
      const history = memory[card.deWord] || [];
      const status = computeSrsStatus(history);
      return { card, isLearned: status.isLearned, dueTime: computeDueTime(history, status) };
    })
    .sort((a, b) => {
      if (a.isLearned !== b.isLearned) return a.isLearned ? 1 : -1;
      return a.dueTime - b.dueTime;
    })
    .map(entry => entry.card);
}

// Groups cards for the Overview page: each bucket keeps the cards sorted by
// correct-answer count, descending.
export function groupForOverview(cards, memory) {
  const sorted = [...cards].sort((a, b) => {
    const correctA = (memory[a.deWord] || []).filter(e => e.correct).length;
    const correctB = (memory[b.deWord] || []).filter(e => e.correct).length;
    return correctB - correctA;
  });

  const learning = [];
  const upcoming = [];
  const learned = [];

  for (const card of sorted) {
    const history = memory[card.deWord] || [];
    const { isLearned } = computeSrsStatus(history);
    if (isLearned) learned.push(card);
    else if (history.length > 0) learning.push(card);
    else upcoming.push(card);
  }

  return { learning, upcoming, learned };
}
