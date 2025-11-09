// Import mysql2
const mysql = require('mysql2');

// Create a connection
const connection = mysql.createConnection({
  host: 'localhost',     // your host, usually localhost
  user: 'root',          // your MySQL username
  password: 'ym@123@ym', // your MySQL password
  database: 'S_M'  // database name you want to connect
});

// Connect
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

// Example query
connection.query('SELECT * FROM USER', (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log(results);
  }
});

// Close connection
connection.end();
