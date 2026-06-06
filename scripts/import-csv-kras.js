const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to parse CSV with support for quoted strings and newlines
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

// 5 Missing HODs/Employees to add to DB first
const MISSING_EMPLOYEES = [
  { name: 'Dhaval Patel', email: 'dhaval.balarbuilders@gmail.com', department: 'Clubhouse', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Lalit Dobariya', email: 'lalit.balarbuilders@gmail.com', department: 'Management', hodName: 'Admin', hodEmail: 'admin@balarbuilders.com' },
  { name: 'Bhavin Patel', email: 'bhavin.balarbuilders@gmail.com', department: 'Legal', hodName: 'Admin', hodEmail: 'admin@balarbuilders.com' },
  { name: 'Pramod Dubey', email: 'pramod.balarbuilders@gmail.com', department: 'Admin', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Shrikant Talekar', email: 'shrikant.balarbuilders@gmail.com', department: 'Sales & Marketing', hodName: 'Admin', hodEmail: 'admin@balarbuilders.com' }
];

async function main() {
  console.log('Step 1: Checking and inserting missing employees/HODs...');
  for (const emp of MISSING_EMPLOYEES) {
    const existing = await prisma.employee.findFirst({
      where: { email: emp.email }
    });
    if (!existing) {
      await prisma.employee.create({
        data: {
          name: emp.name,
          email: emp.email,
          department: emp.department,
          hodName: emp.hodName,
          hodEmail: emp.hodEmail
        }
      });
      console.log(` - Created missing employee/HOD: ${emp.name}`);
    }
  }

  console.log('Step 2: Parsing CSV file...');
  const csvPath = path.resolve('C:\\Users\\Admin\\Desktop\\KRA\\Targeted_Employees_Database_Spaced.csv');
  const rows = parseCSV(csvPath);
  rows.shift(); // Remove header

  // Group KRAs by employee name
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

  // Reload all DB employees
  const dbEmployees = await prisma.employee.findMany();

  console.log('Step 3: Importing KRAs & KPIs...');
  let successCount = 0;

  for (const [csvName, kras] of Object.entries(grouped)) {
    // Match logic
    let emp = dbEmployees.find(e => e.name.toLowerCase().trim() === csvName.toLowerCase().trim());
    if (!emp) {
      emp = dbEmployees.find(e => {
        const n1 = e.name.toLowerCase();
        const n2 = csvName.toLowerCase();
        return n1.includes(n2) || n2.includes(n1);
      });
    }

    if (emp) {
      // Use a transaction to safely update KRAs
      await prisma.$transaction(async (tx) => {
        // Delete all old KRAs for this employee
        await tx.kRATemplate.deleteMany({
          where: { employeeId: emp.id }
        });

        // Insert new KRAs
        await tx.kRATemplate.createMany({
          data: kras.map(k => ({
            employeeId: emp.id,
            kra: k.kra || '',
            kpi: k.kpi || '',
            weightage: k.weightage
          }))
        });
      });
      console.log(` - Updated KRAs for: ${emp.name} (from CSV: "${csvName}", ${kras.length} KRAs)`);
      successCount++;
    } else {
      console.warn(` [WARNING] Could not match CSV employee "${csvName}" with any employee in DB.`);
    }
  }

  console.log(`Import complete. Successfully imported KRAs for ${successCount} employees.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
