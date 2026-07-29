export function parseCSV(text) {
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
