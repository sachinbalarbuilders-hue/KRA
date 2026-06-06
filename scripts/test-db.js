const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'balarbuilders.com',
  user: 'u893770831_kra',
  password: 'Man_yooooh199#',
  database: 'u893770831_kra_db',
  port: 3306,
  connectTimeout: 10000
});

console.log('Attempting to connect...');

connection.connect((err) => {
  if (err) {
    console.error('Connection failed! Error details:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    return;
  }
  console.log('Connection successful!');
  connection.end();
});
