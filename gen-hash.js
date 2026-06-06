const bcrypt = require('bcryptjs');

async function run() {
  const hash = await bcrypt.hash('Admin@123', 12);
  console.log('Generated hash:', hash);
  const match = await bcrypt.compare('Admin@123', hash);
  console.log('Match test:', match);
}

run();
