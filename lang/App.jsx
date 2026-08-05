import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { parseCSV } from './utils.js';
import { Nav } from './components/Nav.jsx';
import { LearnPage } from './components/LearnPage.jsx';
import { OverviewPage } from './components/OverviewPage.jsx';
import { sortForLearnQueue } from './lib/srs.js';
import {
  loadMemory, saveMemoryEntry,
  loadAutoRead, saveAutoRead,
  loadTranslationMode, saveTranslationMode,
} from './lib/storage.js';

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [appData, setAppData] = useState([]);
  const [memory, setMemory] = useState(loadMemory);
  const [autoRead, setAutoReadState] = useState(loadAutoRead);
  const [translationMode, setTranslationModeState] = useState(loadTranslationMode);
  // Tracked by identity (deWord), not by index into the queue: the queue re-sorts
  // live as `memory` changes (e.g. the instant a correct answer is recorded), but
  // the card on screen must stay put until we explicitly step to the next one —
  // otherwise it can flip to a different card mid-way through reading it aloud.
  const [currentCardWord, setCurrentCardWord] = useState(null);

  useEffect(() => {
    fetch('data.csv')
      .then(response => response.text())
      .then(csvText => setAppData(parseCSV(csvText)))
      .catch(error => console.error('Failed to load data.csv', error));
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('word-only-translation', translationMode === 'word');
  }, [translationMode]);

  function navigate(to) {
    window.history.pushState(null, '', to);
    setPath(to);
  }

  function setAutoRead(value) {
    saveAutoRead(value);
    setAutoReadState(value);
  }

  function setTranslationMode(mode) {
    saveTranslationMode(mode);
    setTranslationModeState(mode);
  }

  function recordAnswer(deWord, input, correct) {
    setMemory(prev => saveMemoryEntry(prev, deWord, input, correct));
  }

  const learnQueue = useMemo(() => sortForLearnQueue(appData, memory), [appData, memory]);

  // Read via a ref (not the closed-over `learnQueue`) so that a step deferred until
  // after audio finishes still sees the queue as re-sorted by the answer that triggered it.
  const learnQueueRef = useRef(learnQueue);
  useEffect(() => { learnQueueRef.current = learnQueue; }, [learnQueue]);

  useEffect(() => {
    if (currentCardWord === null && learnQueue.length > 0) {
      setCurrentCardWord(learnQueue[0].deWord);
    }
  }, [learnQueue, currentCardWord]);

  function stepLearnQueue(delta) {
    const queue = learnQueueRef.current;
    if (queue.length === 0) return;
    setCurrentCardWord(prevWord => {
      const idx = queue.findIndex(c => c.deWord === prevWord);
      const base = idx === -1 ? 0 : idx;
      const nextIndex = ((base + delta) % queue.length + queue.length) % queue.length;
      return queue[nextIndex].deWord;
    });
  }

  const currentLearnCard = useMemo(
    () => appData.find(c => c.deWord === currentCardWord) || null,
    [appData, currentCardWord]
  );

  return (
    <>
      <Nav
        onNavigate={navigate}
        autoRead={autoRead}
        onAutoReadChange={setAutoRead}
        translationMode={translationMode}
        onTranslationModeChange={setTranslationMode}
      />
      <div id="content">
        {path === '/learn' ? (
          <LearnPage
            card={currentLearnCard}
            memory={memory}
            onAnswer={recordAnswer}
            onAdvance={() => stepLearnQueue(1)}
            onPrev={() => stepLearnQueue(-1)}
            onNext={() => stepLearnQueue(1)}
            autoRead={autoRead}
          />
        ) : (
          <OverviewPage cards={appData} memory={memory} onAnswer={recordAnswer} autoRead={autoRead} />
        )}
      </div>
    </>
  );
}
