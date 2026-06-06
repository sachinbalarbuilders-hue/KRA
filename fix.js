const fs = require('fs');
const files = ['src/app/admin/tracking/[id]/page.tsx', 'src/app/print/employee/[id]/blank/page.tsx'];
for(let f of files) {
  let txt = fs.readFileSync(f, 'utf8');
  if (txt.startsWith('"') && txt.endsWith('"')) {
    txt = JSON.parse(txt);
    fs.writeFileSync(f, txt);
    console.log('Fixed ' + f);
  } else {
    console.log('Skipped ' + f + ' (does not start and end with ")');
    console.log('Starts with: ' + txt.substring(0, 5));
    console.log('Ends with: ' + txt.substring(txt.length - 5));
  }
}
