require('dotenv').config(); // Load the .env variables
const mysql = require('mysql2'); // Or 'mysql' if you use that package

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: true // Required for TiDB Cloud
    }
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to TiDB Cloud MySQL Database!');
});

module.exports = db;