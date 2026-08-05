import { parseCSV } from './utils.js';

// Memory helper to save answers to localStorage
function saveAnswer(word, inputString, isCorrect) {
  let memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');
  if (!memory[word]) {
    memory[word] = [];
  }
  memory[word].push({
    timestamp: Date.now(),
    input: inputString,
    correct: isCorrect
  });
  localStorage.setItem('flashcard_memory', JSON.stringify(memory));
}

// Helper to forgive special German characters (e.g., ö -> o, ä -> a, ß -> ss)
function normalizeGermanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD') // Decomposes accents (ö -> o + ¨)
    .replace(/[\u0300-\u036f]/g, ''); // Removes the accent marks
}

const AUTO_READ_KEY = 'autoReadAudio';

function isAutoReadEnabled() {
  return localStorage.getItem(AUTO_READ_KEY) === 'true';
}

function audioSafeName(word) {
  return word.replace(/[\/\\?%*:|"<>]/g, '-').toLowerCase();
}

// Returns the Audio element so callers can react to playback finishing (e.g. 'ended').
function playAudioFile(audioName) {
  const audio = new Audio(`audio/${audioName}.mp3`);
  audio.play();
  return audio;
}

function playCardAudio(word, isSentence) {
  const safeName = audioSafeName(word);
  return playAudioFile(isSentence ? `${safeName}-sentence` : safeName);
}

// Shared by the Help button and the auto-help-on-incorrect behavior
function showHelp(germanWord, translation, sentence) {
  let memoryText = '\n\n--- Answer History ---\n';
  const memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');
  const history = memory[germanWord];

  if (history && history.length > 0) {
    history.forEach((entry, idx) => {
      const date = new Date(entry.timestamp).toLocaleString();
      const status = entry.correct ? '\u2705 Correct' : '\u274c Incorrect';
      memoryText += `${idx + 1}. [${date}] Typed: "${entry.input}" -> ${status}\n`;
    });
  } else {
    memoryText += 'No previous answers yet.\n';
  }

  alert(`Word: ${germanWord}\nSentence: ${sentence}${memoryText}`);
}

let appData = [];
let currentLearnIndex = 0;

function generateCardHtml(card, memory) {
  const history = memory[card.deWord] || [];
  const correctCount = history.filter(e => e.correct).length;
  const totalCount = history.length;
  
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

  const greenOpacity = Math.min(correctCount * 0.15, 0.7);
  const bgColor = correctCount > 0 ? `rgba(144, 238, 144, ${greenOpacity})` : '';
  const bgStyle = bgColor ? `style="background-color: ${bgColor};"` : '';

  const badge = isLearned ? `<span title="Learned" style="margin-left:8px;">🌟</span>` : '';
  const sentenceWithPlaceholder = card.deSentence.replace(card.deWord, '______');
  return `
    <div class="card" data-word="${card.deWord}" ${bgStyle}>
        <div class="score-display">[${correctCount}/${totalCount}]</div>
        <div class="sentence">${sentenceWithPlaceholder}</div>
        <div class="word">${card.deWord}${badge}</div>
        <div class="translation">${card.enWord}</div>
        <div class="sentence-translated">${card.enSentence}</div>
        <input type="text" class='answer'/>
        <div class="card-actions">
            <button class='submitButton' data-answer="${card.deWord}">Submit</button>
            <button class='help' data-german="${card.deWord}" data-word="${card.enWord}" data-sentence="${card.enSentence}">Help</button>
            <button class="playAudio" data-audio="${audioSafeName(card.deWord)}">🔊 Word</button>
            <button class="playAudio" data-audio="${audioSafeName(card.deWord)}-sentence">🔊 Sentence</button>
            <button class="reportButton">Report</button>
        </div>
    </div>
  `;
}

function renderCards(cards) {
  let html = '';
  const memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');
  const path = window.location.pathname;

  if (path === '/learn') {
    for (let card of cards) {
      html += generateCardHtml(card, memory);
    }
  } else {
    const learned = [];
    const learning = [];
    const upcoming = [];
    
    for (let card of cards) {
      const history = memory[card.deWord] || [];
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

      if (isLearned) learned.push(card);
      else if (history.length > 0) learning.push(card);
      else upcoming.push(card);
    }

    html += `<div id="section-learning" style="${learning.length === 0 ? 'display:none;' : ''}">`;
    html += `<h2 style="text-align: center; margin-top: 30px; color: #333;">Learning</h2>`;
    html += `<div class="section-content">${learning.map(c => generateCardHtml(c, memory)).join('')}</div>`;
    html += `</div>`;

    html += `<div id="section-upcoming" style="${upcoming.length === 0 ? 'display:none;' : ''}">`;
    html += `<h2 style="text-align: center; margin-top: 30px; color: #333;">Upcoming</h2>`;
    html += `<div class="section-content">${upcoming.map(c => generateCardHtml(c, memory)).join('')}</div>`;
    html += `</div>`;

    html += `<div id="section-learned" style="${learned.length === 0 ? 'display:none;' : ''}">`;
    html += `<h2 style="text-align: center; margin-top: 30px; color: #333;">Learned 🌟</h2>`;
    html += `<div class="section-content">${learned.map(c => generateCardHtml(c, memory)).join('')}</div>`;
    html += `</div>`;
  }

  if (window.location.pathname === '/learn') {
    html += `
      <div style="margin-top: 15px; display: flex; justify-content: space-between; max-width: 300px; margin-left: auto; margin-right: auto;">
        <button id="prevBtn" style="padding: 8px 16px;">&laquo; Prev</button>
        <button id="nextBtn" style="padding: 8px 16px;">Next &raquo;</button>
      </div>
    `;
  }

  document.querySelector('#content').innerHTML = html;

  if (window.location.pathname === '/learn') {
    const answerInput = document.querySelector('#content .answer');
    if (answerInput) answerInput.focus();

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.onclick = () => { currentLearnIndex--; renderCurrentView(); };
    if (nextBtn) nextBtn.onclick = () => { currentLearnIndex++; renderCurrentView(); };
  }

  // Attach Audio Button Listeners
  document.querySelectorAll('#content button.playAudio').forEach(button => {
    button.onclick = function () {
      playAudioFile(this.getAttribute('data-audio'));
    };
  });

  // Attach Report Button Listeners
  document.querySelectorAll('#content button.reportButton').forEach(button => {
    button.onclick = function () {
      alert("please email to vrzala.matej@gmail.com with any feedback.");
    };
  });

  // Attach Help Button Listeners
  document.querySelectorAll('#content button.help').forEach(button => {
    button.onclick = function () {
      showHelp(
        this.getAttribute('data-german'),
        this.getAttribute('data-word'),
        this.getAttribute('data-sentence')
      );
    }
  });

  // Attach Submit Button Listeners
  document.querySelectorAll('#content button.submitButton').forEach(button => {
    const cardEl = button.closest('.card');
    const inputField = cardEl ? cardEl.querySelector('.answer') : null;

    if (inputField) {
      inputField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          button.click();
        }
      });
    }

    button.onclick = function () {
      const correctAnswer = this.getAttribute('data-answer');
      const userAnswer = inputField.value.trim();

      const isCorrect = normalizeGermanText(userAnswer) === normalizeGermanText(correctAnswer);
      
      // Save to browser memory
      saveAnswer(correctAnswer, userAnswer, isCorrect);

      const memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');
      const history = memory[correctAnswer] || [];
      const correctCount = history.filter(e => e.correct).length;
      const totalCount = history.length;
      
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

      // Update targeted DOM elements without full re-render
      if (cardEl) {
        const scoreDisplay = cardEl.querySelector('.score-display');
        if (scoreDisplay) scoreDisplay.textContent = `[${correctCount}/${totalCount}]`;
        
        const greenOpacity = Math.min(correctCount * 0.15, 0.7);
        if (correctCount > 0) cardEl.style.backgroundColor = `rgba(144, 238, 144, ${greenOpacity})`;
        
        if (isLearned) {
          const wordDiv = cardEl.querySelector('.word');
          if (wordDiv && !wordDiv.innerHTML.includes('🌟')) {
             wordDiv.innerHTML += '<span title="Learned" style="margin-left:8px;">🌟</span>';
          }
        }

        // Recategorize if on overview page
        if (window.location.pathname !== '/learn') {
           let targetSectionId = isLearned ? 'section-learned' : (history.length > 0 ? 'section-learning' : 'section-upcoming');
           const targetSection = document.getElementById(targetSectionId);
           if (targetSection) {
             targetSection.style.display = 'block';
             const contentDiv = targetSection.querySelector('.section-content');
             if (contentDiv && cardEl.parentElement !== contentDiv) {
               // Add a tiny delay so user sees feedback before it jumps
               setTimeout(() => { contentDiv.appendChild(cardEl); }, 500);
             }
           }
        }
      }

      if (isCorrect) {
        inputField.style.backgroundColor = '#d4edda';

        if (window.location.pathname === '/learn') {
          const advance = () => {
            sortForLearnQueue();
            currentLearnIndex++;
            renderCurrentView();
          };

          if (isAutoReadEnabled()) {
            // Keep the card on screen for as long as the sentence is being read,
            // instead of advancing on a fixed timer.
            const sentenceAudio = playCardAudio(correctAnswer, true);
            let advanced = false;
            const advanceOnce = () => {
              if (advanced) return;
              advanced = true;
              advance();
            };
            sentenceAudio.addEventListener('ended', advanceOnce, { once: true });
            sentenceAudio.addEventListener('error', advanceOnce, { once: true });
            // Safety net in case playback stalls or is blocked by the browser.
            setTimeout(advanceOnce, 8000);
          } else {
            setTimeout(advance, 1000);
          }
        } else if (isAutoReadEnabled()) {
          playCardAudio(correctAnswer, true);
        }
      } else {
        inputField.style.backgroundColor = '#f8d7da';
        if (isAutoReadEnabled()) {
          playCardAudio(correctAnswer, false);
        }
        const helpBtn = cardEl ? cardEl.querySelector('.help') : null;
        if (helpBtn) {
          showHelp(
            helpBtn.getAttribute('data-german'),
            helpBtn.getAttribute('data-word'),
            helpBtn.getAttribute('data-sentence')
          );
        }
      }
    }
  });
}

function renderCurrentView() {
  const path = window.location.pathname;
  if (path === '/learn') {
    if (appData.length > 0) {
      if (currentLearnIndex >= appData.length) currentLearnIndex = 0;
      if (currentLearnIndex < 0) currentLearnIndex = appData.length - 1;
      renderCards([appData[currentLearnIndex]]);
    } else {
      renderCards([]);
    }
  } else {
    const memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');
    const sortedCards = [...appData].sort((a, b) => {
      const histA = memory[a.deWord] || [];
      const histB = memory[b.deWord] || [];
      const correctA = histA.filter(e => e.correct).length;
      const correctB = histB.filter(e => e.correct).length;
      return correctB - correctA;
    });
    renderCards(sortedCards);
  }
}

function sortForLearnQueue() {
  const memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');
  
  appData.forEach(card => {
    const history = memory[card.deWord] || [];
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
    
    let dueTime = 0;
    if (isLearned) {
      const delays = [0, 1, 4, 24, 72, 168]; 
      const delayIndex = Math.min(consecutiveCorrect, delays.length - 1);
      const delayMs = delays[delayIndex] * 60 * 60 * 1000;
      const lastTime = history[history.length - 1].timestamp;
      dueTime = lastTime + delayMs;
    }
    
    card.isLearned = isLearned;
    card.dueTime = dueTime;
  });

  appData.sort((a, b) => {
    if (a.isLearned !== b.isLearned) {
      return a.isLearned ? 1 : -1;
    }
    return a.dueTime - b.dueTime;
  });
}

function setupAutoReadToggle() {
  const toggle = document.getElementById('autoReadToggle');
  if (!toggle) return;
  toggle.checked = isAutoReadEnabled();
  toggle.addEventListener('change', () => {
    localStorage.setItem(AUTO_READ_KEY, toggle.checked ? 'true' : 'false');
  });
}

async function loadApp() {
  try {
    const response = await fetch('data.csv');
    const csvText = await response.text();
    appData = parseCSV(csvText);
    sortForLearnQueue();
    setupAutoReadToggle();

    // Setup navigation
    document.querySelectorAll('a[data-nav]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        history.pushState(null, '', link.getAttribute('href'));
        renderCurrentView();
      });
    });

    window.addEventListener('popstate', renderCurrentView);
    renderCurrentView();

  } catch (error) {
    console.error("Failed to load data.csv", error);
  }
}

// Initialize the app
loadApp();
