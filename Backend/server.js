const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json()); // For parsing JSON bodies

// --- Create upload directories if they don't exist ---
const uploadsDir = path.join(__dirname, 'uploads');
const postsDir = path.join(uploadsDir, 'posts');
const storiesDir = path.join(uploadsDir, 'stories');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir);
if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir);

// --- Serve static files ---
// This makes files in the 'uploads' folder accessible via URL
// e.g., http://localhost:5000/uploads/posts/your-image.jpg
app.use('/uploads', express.static(uploadsDir));

// --- Database Connection ---
const db = mysql.createPool({ // Using a Pool is better for handling multiple connections
  host: 'localhost',
  user: 'root',
  password: 'Sam@1234', // Your password
  database: 'social_media_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Allows multiple SQL statements in one query
}).promise();

// --- Test DB Connection ---
(async () => {
  try {
    await db.query("SELECT 1");
    console.log('Connected to social_media_db!');
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
  }
})();

// =================================================================
//                 FILE UPLOAD (MULTER) CONFIG
// =================================================================

// --- Storage config for POSTS (multiple files) ---
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts'); // Save to 'uploads/posts' folder
  },
  filename: (req, file, cb) => {
    // Create a unique filename to prevent overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadPost = multer({ storage: postStorage });

// --- Storage config for STORIES (single file) ---
const storyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/stories'); // Save to 'uploads/stories' folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'story-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadStory = multer({ storage: storyStorage });


// =================================================================
//                 USER AUTHENTICATION ROUTES
// =================================================================

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  const saltRounds = 10;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    // 1. Check if user already exists
    const [existingUsers] = await db.query(
      "SELECT * FROM USER WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: "Username or email already in use." });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insert new user
    const sql = "INSERT INTO USER (username, email, password_hash) VALUES (?, ?, ?)";
    await db.query(sql, [username, email, hashedPassword]);
    
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
    // 1. Find the user
    const [users] = await db.query(
      "SELECT * FROM USER WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Incorrect username or password." });
    }

    const user = users[0];

    // 2. Compare the provided password with the stored hash
    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      // Passwords match!
      res.json({ success: true, user: { id: user.user_id, username: user.username } });
    } else {
      // Passwords do not match
      res.status(401).json({ success: false, message: "Incorrect username or password." });
    }

  } catch (err) {
    console.error("Login DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// =================================================================
//                 CREATE POST ROUTE (with Hashtags)
// =================================================================

app.post("/api/posts/create", uploadPost.array('media', 10), async (req, res) => {
  const { user_id, caption, hashtags } = req.body;
  const files = req.files;

  // --- Validation ---
  if (!user_id) {
    return res.status(400).json({ success: false, message: "user_id is required." });
  }
  if (!files || files.length === 0) {
     return res.status(400).json({ success: false, message: "At least one media file is required." });
  }
  
  let conn; // Declare connection variable
  try {
    // --- Start a Database Transaction ---
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Insert into the POST table
    const postSql = "INSERT INTO POST (user_id, caption) VALUES (?, ?)";
    const [postResult] = await conn.query(postSql, [user_id, caption || null]);
    const postId = postResult.insertId;

    // 2. Insert into the MEDIA table for each file
    // We use bulk insert for efficiency
    const mediaSql = "INSERT INTO MEDIA (post_id, media_url, media_type) VALUES ?";
    const mediaValues = files.map(file => {
      const mediaUrl = `/uploads/posts/${file.filename}`;
      return [postId, mediaUrl, file.mimetype];
    });
    await conn.query(mediaSql, [mediaValues]);

    // 3. --- HASHTAG LOGIC ---
    if (hashtags) {
      // Parse hashtags: "#react #js" -> ["react", "js"]
      const tagList = hashtags.split(' ')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()); // Remove '#' and lowercase

      if (tagList.length > 0) {
        // A. Find or Create hashtags in HASHTAG table
        // INSERT IGNORE avoids errors for duplicate hashtags
        const hashtagPlaceholders = tagList.map(() => '(?)').join(', ');
        const insertHashtagsSql = `INSERT IGNORE INTO HASHTAG (hashtag_text) VALUES ${hashtagPlaceholders}`;
        await conn.query(insertHashtagsSql, tagList);

        // B. Get the IDs of all the hashtags
        const [hashtagRows] = await conn.query(
          `SELECT hashtag_id FROM HASHTAG WHERE hashtag_text IN (?)`,
          [tagList]
        );
        const hashtagIds = hashtagRows.map(row => row.hashtag_id);

        // C. Link hashtags to the post in POST_HASHTAG table (bulk insert)
        const postHashtagSql = "INSERT INTO POST_HASHTAG (post_id, hashtag_id) VALUES ?";
        const postHashtagValues = hashtagIds.map(tagId => [postId, tagId]);
        
        if (postHashtagValues.length > 0) {
            await conn.query(postHashtagSql, [postHashtagValues]);
        }
      }
    }
    // --- END HASHTAG LOGIC ---

    // 4. If all queries were successful, commit the transaction
    await conn.commit();
    
    res.status(201).json({ success: true, message: "Post created successfully!", postId: postId });

  } catch (err) {
    console.error("Create Post DB error:", err);
    // 5. If any query failed, roll back the transaction
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    // 6. Always release the connection back to the pool
    if (conn) conn.release();
  }
});


// =================================================================
//                 CREATE STORY ROUTE
// =================================================================

app.post("/api/stories/create", uploadStory.single('media'), async (req, res) => {
  const { user_id } = req.body;
  const file = req.file;

  // --- Validation ---
  if (!user_id) {
    return res.status(400).json({ success: false, message: "user_id is required." });
  }
  if (!file) {
     return res.status(400).json({ success: false, message: "A media file is required." });
  }
  
  try {
    // Construct the URL
    const mediaUrl = `/uploads/stories/${file.filename}`;

    // Your STORY table has expires_at, so we set it for 24 hours
    const sql = `
      INSERT INTO STORY (user_id, media_url, expires_at) 
      VALUES (?, ?, NOW() + INTERVAL 1 DAY)
    `;
    
    await db.query(sql, [user_id, mediaUrl]);
    
    res.status(201).json({ success: true, message: "Story created successfully!" });

  } catch (err) {
    console.error("Create Story DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// =================================================================
//                 START SERVER
// =================================================================

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));