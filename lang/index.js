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
    if (row.length >= 4) result.push(row);
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

async function loadApp() {
  try {
    const response = await fetch('data.csv');
    const csvText = await response.text();
    const data = parseCSV(csvText);

    let html = '';
    for (let arr of data) {
      // arr[0] = de-word, arr[1] = de-sentence, arr[2] = en-word, arr[3] = en-sentence
      const sentenceWithPlaceholder = arr[1].replace(arr[0], '______');
      html += `
        <div class="card">
            <div class="sentence">${sentenceWithPlaceholder}</div>
            <div class="word" >${arr[0]} </div>
            <div class="translation" style="font-size:11px">${arr[2]}</div>
            <div class="sentence-translated">${arr[3]}</div>
            <input type="text" class='answer'/>
            <button class='submitButton' data-answer="${arr[0]}">Submit</button>
            <button class='help' data-german="${arr[0]}" data-word="${arr[2]}" data-sentence="${arr[3]}">Help</button>
            <button>Report</button>
        </div>
      `;
    }

    document.querySelector('#content').innerHTML = html;

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

        alert(`Translation: ${translation}\nSentence: ${sentence}${memoryText}`);
      }
    });

    // Attach Submit Button Listeners
    document.querySelectorAll('#content button.submitButton').forEach(button => {
      button.onclick = function () {
        const correctAnswer = this.getAttribute('data-answer');
        const inputField = this.previousElementSibling;
        const userAnswer = inputField.value.trim();

        const isCorrect = normalizeGermanText(userAnswer) === normalizeGermanText(correctAnswer);
        
        // Save to browser memory
        saveAnswer(correctAnswer, userAnswer, isCorrect);

        if (isCorrect) {
          alert("Correct! 🎉");
          inputField.style.backgroundColor = '#d4edda';
        } else {
          alert("Incorrect, try again.");
          inputField.style.backgroundColor = '#f8d7da';
        }
      }
    });
  } catch (error) {
    console.error("Failed to load data.csv", error);
  }
}

// Initialize the app
loadApp();
