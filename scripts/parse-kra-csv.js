const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple CSV parser that handles quotes and newlines
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
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // End of quotes
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
        if (char === '\r' && nextChar === '\n') i++; // Skip \n
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

  // Add last field if any
  if (currentField !== '' || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(field => field !== '')) {
      lines.push(currentLine);
    }
  }

  return lines;
}

async function main() {
  const csvPath = path.resolve('C:\\Users\\Admin\\Desktop\\KRA\\Targeted_Employees_Database_Spaced.csv');
  const rows = parseCSV(csvPath);

  // Remove header row
  const header = rows.shift();
  console.log('CSV Headers:', header);

  // Group by Employee Name
  const grouped = {};
  for (const row of rows) {
    const name = row[0];
    const kra = row[1];
    const kpi = row[2];
    const weightage = parseInt(row[3]) || 0;

    if (!name || name === '') continue;

    if (!grouped[name]) {
      grouped[name] = [];
    }
    grouped[name].push({ kra, kpi, weightage });
  }

  console.log(`Found ${Object.keys(grouped).length} unique employee names in CSV.`);

  // Load all employees from DB
  const dbEmployees = await prisma.employee.findMany();
  console.log(`Found ${dbEmployees.length} employees in DB.`);

  const unmatched = [];
  const matched = [];

  for (const name of Object.keys(grouped)) {
    // Try exact match
    let emp = dbEmployees.find(e => e.name.toLowerCase().trim() === name.toLowerCase().trim());
    
    // Try partial match if no exact match (e.g. "Raj Shah" vs "Raj Shah (Vikash)")
    if (!emp) {
      emp = dbEmployees.find(e => {
        const n1 = e.name.toLowerCase();
        const n2 = name.toLowerCase();
        return n1.includes(n2) || n2.includes(n1);
      });
    }

    if (emp) {
      matched.push({ csvName: name, dbEmp: emp, kras: grouped[name] });
    } else {
      unmatched.push({ csvName: name, kras: grouped[name] });
    }
  }

  console.log(`Matched: ${matched.length}`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('Unmatched employee names from CSV:');
    for (const item of unmatched) {
      console.log(` - "${item.csvName}" (${item.kras.length} KRAs)`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
