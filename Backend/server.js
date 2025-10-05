const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',     
  user: 'root',          
  password: 'Sam@1234', 
  database: 'social_media_db'  
}).promise();

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const [existingUsers] = await db.query(
      "SELECT * FROM USER WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: "Username or email already in use." });
    }

    const sql = "INSERT INTO USER (username, email, password_hash) VALUES (?, ?, ?)";
    await db.query(sql, [username, email, password]);
    res.status(201).json({ success: true, message: "User registered successfully! Please log in." });

  } catch (err) {
    console.error("Registration DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const [users] = await db.query(
      "SELECT * FROM USER WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Incorrect username." });
    }

    const user = users[0];

    if (password === user.password_hash) {
      res.json({ success: true, user: { id: user.user_id, username: user.username } });
    } else {
      res.status(401).json({ success: false, message: "Incorrect password." });
    }

  } catch (err) {
    console.error("Login DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));