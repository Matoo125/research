function parseCSV(text) {
  const result = [];
  const lines = text.trim().split('\n');
  for (let i = 1; i < lines.length; i++) { // Skip header
    let row = [];
    let cur = '';
    let inQuotes = false;
    for (let char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    row.push(cur.trim());
    if (row.length >= 4) {
      result.push({
        deWord: row[0],
        deSentence: row[1],
        enWord: row[2],
        enSentence: row[3]
      });
    }
  }
  return result;
}

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

let appData = [];
let currentLearnIndex = 0;

function renderCards(cards) {
  let html = '';
  const memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');

  for (let card of cards) {
    const history = memory[card.deWord] || [];
    const correctCount = history.filter(e => e.correct).length;
    const totalCount = history.length;
    
    const greenOpacity = Math.min(correctCount * 0.15, 0.7);
    const bgColor = correctCount > 0 ? `rgba(144, 238, 144, ${greenOpacity})` : '';
    const bgStyle = bgColor ? `style="background-color: ${bgColor};"` : '';

    const sentenceWithPlaceholder = card.deSentence.replace(card.deWord, '______');
    html += `
      <div class="card" ${bgStyle}>
          <div style="font-size: 12px; color: #555; text-align: right; margin-bottom: 5px; font-weight: bold;">[${correctCount}/${totalCount}]</div>
          <div class="sentence">${sentenceWithPlaceholder}</div>
          <div class="word" >${card.deWord} </div>
          <div class="translation" style="font-size:11px">${card.enWord}</div>
          <div class="sentence-translated">${card.enSentence}</div>
          <input type="text" class='answer'/>
          <button class='submitButton' data-answer="${card.deWord}">Submit</button>
          <button class='help' data-german="${card.deWord}" data-word="${card.enWord}" data-sentence="${card.enSentence}">Help</button>
          <button>Report</button>
      </div>
    `;
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
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.onclick = () => { currentLearnIndex--; renderCurrentView(); };
    if (nextBtn) nextBtn.onclick = () => { currentLearnIndex++; renderCurrentView(); };
  }

  // Attach Help Button Listeners
  document.querySelectorAll('#content button.help').forEach(button => {
    button.onclick = function () {
      const germanWord = this.getAttribute('data-german');
      const translation = this.getAttribute('data-word');
      const sentence = this.getAttribute('data-sentence');
      
      let memoryText = '\n\n--- Answer History ---\n';
      const memory = JSON.parse(localStorage.getItem('flashcard_memory') || '{}');
      const history = memory[germanWord];
      
      if (history && history.length > 0) {
        history.forEach((entry, idx) => {
          const date = new Date(entry.timestamp).toLocaleString();
          const status = entry.correct ? '✅ Correct' : '❌ Incorrect';
          memoryText += `${idx + 1}. [${date}] Typed: "${entry.input}" -> ${status}\n`;
        });
      } else {
        memoryText += 'No previous answers yet.\n';
      }

      alert(`Word: ${germanWord}\nSentence: ${sentence}${memoryText}`);
    }
  });

  // Attach Submit Button Listeners
  document.querySelectorAll('#content button.submitButton').forEach(button => {
    const inputField = button.previousElementSibling;
    
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

      if (isCorrect) {
        inputField.style.backgroundColor = '#d4edda';
        
        if (window.location.pathname === '/learn') {
            setTimeout(() => {
                currentLearnIndex++;
                renderCurrentView();
            }, 1000);
        }
      } else {
        inputField.style.backgroundColor = '#f8d7da';
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

async function loadApp() {
  try {
    const response = await fetch('data.csv');
    const csvText = await response.text();
    appData = parseCSV(csvText);

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
