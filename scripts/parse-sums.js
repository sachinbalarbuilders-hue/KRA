const fs = require('fs');
const path = require('path');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') i++;
        currentLine.push(currentField.trim());
        if (currentLine.some(field => field !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== '' || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(field => field !== '')) {
      lines.push(currentLine);
    }
  }

  return lines;
}

const csvPath = path.resolve('C:\\Users\\Admin\\Desktop\\KRA\\Targeted_Employees_Database_Spaced.csv');
const rows = parseCSV(csvPath);
rows.shift(); // remove header

const grouped = {};
for (const row of rows) {
  const name = row[0];
  const weightage = parseInt(row[3]) || 0;
  if (!name) continue;
  if (!grouped[name]) grouped[name] = 0;
  grouped[name] += weightage;
}

console.log('Employee Weightage Sums in CSV:');
for (const [name, sum] of Object.entries(grouped)) {
  console.log(` - ${name}: ${sum}%`);
}
