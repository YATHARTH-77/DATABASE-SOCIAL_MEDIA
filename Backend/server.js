// =================================================================
//                SERVER.JS (FINAL DEPLOYMENT VERSION)
// =================================================================

require('dotenv').config(); // Loads .env variables
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

// --- CLOUDINARY IMPORTS ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// =================================================================
//          CONTENT FILTERING (DATABASE TRIGGERS)
// =================================================================
//Trigger
//Trigger
const ABUSIVE_PATTERNS = [
  /f+\W*?u+\W*?c+\W*?k+/i,              // fuck variations
  /s+\W*?h+\W*?i+\W*?t+/i,              // shit variations
  /b+\W*?i+\W*?t+\W*?c+\W*?h+/i,        // bitch variations
  /a+\W*?s+\W*?s+\W*?h+\W*?o+\W*?l+\W*?e+/i, // asshole
  /d+\W*?i+\W*?c+\W*?k+/i,              // dick
  /c+\W*?o+\W*?c+\W*?k+/i,              // cock
  /p+\W*?u+\W*?s+\W*?s+\W*?y+/i,        // pussy
  /s+\W*?l+\W*?u+\W*?t+/i,              // slut
  /w+\W*?h+\W*?o+\W*?r+\W*?e+/i,        // whore
  /b+\W*?a+\W*?s+\W*?t+\W*?a+\W*?r+\W*?d+/i, // bastard
  /f+\W*?a+\W*?g+/i,                    // fag variations
  /c+\W*?u+\W*?m+/i,                    // cum
  /s+\W*?e+\W*?x+/i,                    // sex, s3x, s*x
  /s+\W*?e+\W*?x+\W*?y+/i,              // sexy
  /p+\W*?o+\W*?r+\W*?n+/i,              // porn
  /h+\W*?o+\W*?r+\W*?n+/i,              // horny
  /n+\W*?i+\W*?g+\W*?g+\W*?a+/i,        // nigga
  /n+\W*?i+\W*?g+\W*?g+\W*?e+\W*?r+/i   // nigger
];

function containsAbusiveContent(text) {
  if (!text || typeof text !== 'string') return false;
  const lowerText = text.toLowerCase();
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }
  return false;
}

async function isDuplicateComment(db, userId, postId, commentText) {
  const [existing] = await db.query(
    "SELECT COUNT(*) as count FROM `COMMENT` WHERE user_id = ? AND post_id = ? AND comment_text = ?",
    [userId, postId, commentText]
  );
  return existing[0].count > 0;
}
//Trigger ends
// --- 1. Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- 2. Deployment Ready CORS ---
// Allows Localhost AND your future Frontend URL
const allowedOrigins = [
  "http://localhost:8080", 
  "http://localhost:5173", 
  process.env.FRONTEND_URL // e.g., https://your-app.vercel.app
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS Policy Error'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json()); 
app.set('trust proxy', 1); // Required for Render cookies

// --- Legacy Directory Creation (Kept as requested, though not used for Cloudinary) ---
const uploadsDir = path.join(__dirname, 'uploads');
const postsDir = path.join(uploadsDir, 'posts');
const storiesDir = path.join(uploadsDir, 'stories');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir);
if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir);
app.use('/uploads', express.static(uploadsDir));

// --- 3. Database Connection (TiDB Cloud Ready) ---
const db = mysql.createPool({ 
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: true // REQUIRED for TiDB Cloud
  }
}).promise();

// --- Test DB Connection ---
(async () => {
  try {
    await db.query("SELECT 1");
    console.log('✅ Connected to TiDB Cloud Database!');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) console.error('Error with email transporter:', error);
  else console.log('Email transporter is ready!');
});

// =================================================================
//                 FILE UPLOAD (CLOUDINARY) CONFIG
// =================================================================

// Storage for POSTS
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_media_posts',
    resource_type: 'auto', // Allows images and videos
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'avi'],
  },
});
const uploadPost = multer({ storage: postStorage });

// Storage for STORIES
const storyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_media_stories',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'avi'],
  },
});
const uploadStory = multer({ storage: storyStorage });

// =================================================================
//                 PASSPORT & SESSION
// =================================================================

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Important for Render
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, 
    secure: process.env.NODE_ENV === 'production', // True in HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback", 
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const displayName = profile.displayName;
    const profilePic = profile.photos[0].value;
    
    try {
      const [users] = await db.query("SELECT * FROM USER WHERE email = ?", [email]);
      if (users.length > 0) return done(null, users[0]);
      
      let username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const [existingUsernames] = await db.query("SELECT * FROM USER WHERE username = ?", [username]);
      if (existingUsernames.length > 0) username = `${username}${crypto.randomInt(1000, 9999)}`;
      
      const fakePassword = crypto.randomBytes(20).toString('hex');
      const hashedPassword = await bcrypt.hash(fakePassword, 10);
      
      const [result] = await db.query(
        "INSERT INTO USER (username, email, password_hash, full_name, profile_pic_url) VALUES (?, ?, ?, ?, ?)",
        [username, email, hashedPassword, displayName, profilePic]
      );
      
      return done(null, { user_id: result.insertId, username, email });

    } catch (err) { return done(err, null); }
  }
));

passport.serializeUser((user, done) => done(null, user.user_id));
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query("SELECT user_id, username, email FROM USER WHERE user_id = ?", [id]);
    done(null, users[0]);
  } catch (err) { done(err, null); }
});

// =================================================================
//                 ROUTES
// =================================================================

// --- Auth Routes ---
app.post("/api/register/send-otp", async (req, res) => {
  const { username, email } = req.body;
  try {
    const [existingUsers] = await db.query("SELECT * FROM USER WHERE username = ? OR email = ?", [username, email]);
    if (existingUsers.length > 0) return res.status(409).json({ success: false, message: "Username or email already in use." });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      `INSERT INTO OTP_VERIFICATION (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?`,
      [email, otp, expires_at, otp, expires_at]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code for ConnectIT',
      html: `<h2>Code: ${otp}</h2><p>Expires in 10 mins.</p>`
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "OTP sent to your email!" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/register/verify", async (req, res) => {
  const { username, email, password, otp } = req.body;
  
  // Validate username for abusive content
  if (containsAbusiveContent(username)) {
    return res.status(400).json({ 
      success: false, 
      message: "Inappropriate username is not allowed." 
    });
  }
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [otpRows] = await conn.query("SELECT * FROM OTP_VERIFICATION WHERE email = ? AND otp = ? AND expires_at > NOW()", [email, otp]);
    if (otpRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.query("INSERT INTO USER (username, email, password_hash) VALUES (?, ?, ?)", [username, email, hashedPassword]);
    await conn.query("DELETE FROM OTP_VERIFICATION WHERE email = ?", [email]);
    await conn.commit();
    res.status(201).json({ success: true, message: "User registered successfully! Please log in." });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Registration DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally { if (conn) conn.release(); }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM USER WHERE username = ?", [username]);
    if (users.length === 0) return res.status(401).json({ success: false, message: "Incorrect username." });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      req.login(user, (err) => {
         if (err) return res.status(500).json({message: "Session error"});
         res.json({ success: true, user: { id: user.user_id, username: user.username } });
      });
    } else {
      res.status(401).json({ success: false, message: "Incorrect password." });
    }
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
});

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=google' }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    res.redirect(`${frontendUrl}/home`);
  }
);

app.get('/api/auth/current_user', (req, res) => {
  if (req.user) res.json({ success: true, user: { id: req.user.user_id, username: req.user.username } });
  else res.status(401).json({ success: false, message: "Not authenticated" });
});

app.get('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.json({ success: true, message: "Logged out" });
  });
});

// --- Post Routes (UPDATED: Uses Cloudinary file.path) ---
app.post("/api/posts/create", uploadPost.array('media', 10), async (req, res) => {
  const { user_id, caption, hashtags } = req.body;
  const files = req.files;
  
  // Validate caption for abusive content
  if (caption && containsAbusiveContent(caption)) {
    return res.status(400).json({ 
      success: false, 
      message: "Caption contains inappropriate language." 
    });
  }
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [postResult] = await conn.query("INSERT INTO POST (user_id, caption) VALUES (?, ?)", [user_id, caption]);
    const postId = postResult.insertId;

    // Cloudinary Change: Use `file.path` (The remote URL) instead of `file.filename`
    const mediaValues = files.map(f => [postId, f.path, f.mimetype]);
    if (mediaValues.length > 0) await conn.query("INSERT INTO MEDIA (post_id, media_url, media_type) VALUES ?", [mediaValues]);

    if (hashtags) {
      const tagList = hashtags.split(' ').map(t => t.trim()).filter(t => t).map(t => t.startsWith('#') ? t.substring(1).toLowerCase() : t.toLowerCase());
      if (tagList.length > 0) {
        const phs = tagList.map(() => '(?)').join(', ');
        await conn.query(`INSERT IGNORE INTO HASHTAG (hashtag_text) VALUES ${phs}`, tagList);
        const [hRows] = await db.query(`SELECT hashtag_id FROM HASHTAG WHERE hashtag_text IN (?)`, [tagList]);
        const phValues = hRows.map(row => [postId, row.hashtag_id]);
        if (phValues.length > 0) await conn.query("INSERT INTO POST_HASHTAG (post_id, hashtag_id) VALUES ?", [phValues]);
      }
    }
    await conn.commit();
    res.status(201).json({ success: true, message: "Post created!", postId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Create Post DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally { if (conn) conn.release(); }
});

app.post("/api/posts/like", async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction(); // 🔒 START
    
    const [existing] = await conn.query(
      "SELECT * FROM POST_LIKE WHERE user_id = ? AND post_id = ?", 
      [userId, postId]
    );
    
    if (existing.length > 0) {
      // UNLIKE
      await conn.query(
        "DELETE FROM POST_LIKE WHERE user_id = ? AND post_id = ?", 
        [userId, postId]
      );
    } else {
      // LIKE
      await conn.query(
        "INSERT INTO POST_LIKE (user_id, post_id) VALUES (?, ?)", 
        [userId, postId]
      );
    }
    
    await conn.commit(); // ✅ SUCCESS
    
  } catch (err) {
    if (conn) await conn.rollback(); // ❌ CANCEL
    res.status(500).json({success:false});
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/posts/save", async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction(); // 🔒 START
    
    const [existing] = await conn.query(
      "SELECT * FROM Saved_posts WHERE user_id = ? AND post_id = ?", 
      [userId, postId]
    );
    
    if (existing.length > 0) {
      // UNSAVE
      await conn.query(
        "DELETE FROM Saved_posts WHERE user_id = ? AND post_id = ?", 
        [userId, postId]
      );
    } else {
      // SAVE
      await conn.query(
        "INSERT INTO Saved_posts (user_id, post_id) VALUES (?, ?)", 
        [userId, postId]
      );
    }
    
    await conn.commit(); // ✅ SUCCESS
    
  } catch (err) {
    if (conn) await conn.rollback(); // ❌ CANCEL
    res.status(500).json({success:false});
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/posts/:postId/comments", async (req, res) => {
  try {
    const [comments] = await db.query(`SELECT c.*, u.username, u.profile_pic_url FROM COMMENT c JOIN USER u ON c.user_id = u.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC`, [req.params.postId]);
    res.json({ success: true, comments });
  } catch (err) { res.status(500).json({success:false}); }
});

app.post("/api/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const { userId, commentText } = req.body;

  if (!userId || !commentText) {
    return res.status(400).json({ 
      success: false, 
      message: "userId and commentText are required" 
    });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction(); // 🔒 START TRANSACTION

    // Step 1: Check for duplicate comment
    const [existing] = await conn.query(
      `SELECT COUNT(*) AS count 
       FROM COMMENT 
       WHERE user_id = ? AND post_id = ? AND comment_text = ?`,
      [userId, postId, commentText]
    );

    if (existing[0].count > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Duplicate comment not allowed."
      });
    }

    // Step 2: Insert the new comment
    const [resDb] = await conn.query(
      "INSERT INTO COMMENT (user_id, post_id, comment_text) VALUES (?, ?, ?)",
      [userId, postId, commentText]
    );

    // Step 3: Fetch inserted comment with user info
    const [newComment] = await conn.query(
      `SELECT c.comment_id, c.comment_text, c.created_at,
              u.user_id, u.username, u.profile_pic_url
       FROM COMMENT c
       JOIN USER u ON c.user_id = u.user_id
       WHERE c.comment_id = ?`,
      [resDb.insertId]
    );

    await conn.commit(); // ✅ COMMIT

    return res.status(201).json({
      success: true,
      comment: newComment[0]
    });

  } catch (err) {
    console.error("Add Comment Error:", err);

    if (conn) await conn.rollback();

    // Handle trigger errors (spam, abusive, etc.)
    if (err.code === "ER_SIGNAL_EXCEPTION" || err.errno === 1644) {
      return res.status(400).json({
        success: false,
        message: err.sqlMessage
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  } finally {
    if (conn) conn.release();
  }
});

// --- Story Routes (UPDATED: Uses Cloudinary file.path) ---
app.post("/api/stories/create", uploadStory.single('media'), async (req, res) => {
  const { user_id, tags } = req.body;
  const file = req.file;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    
    // Cloudinary Change: Use file.path
    const [sRes] = await conn.query(`INSERT INTO STORY (user_id, media_url, media_type, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL 1 DAY)`, [user_id, file.path, file.mimetype]);
    
    if (tags) {
      const usernames = tags.split(' ').map(t => t.trim()).filter(t => t);
      if (usernames.length > 0) {
        const [users] = await conn.query("SELECT user_id FROM USER WHERE username IN (?)", [usernames]);
        if (users.length > 0) {
           const tVals = users.map(u => [sRes.insertId, u.user_id]);
           await conn.query("INSERT INTO STORY_TAG (story_id, tagged_user_id) VALUES ?", [tVals]);
        }
      }
    }
    await conn.commit();
    res.status(201).json({ success: true, message: "Story created!" });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally { if (conn) conn.release(); }
});

app.get("/api/stories/:storyId", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT s.*, u.username, u.profile_pic_url FROM STORY s JOIN USER u ON s.user_id = u.user_id WHERE s.story_id = ?`, [req.params.storyId]);
    if (rows.length === 0) return res.status(404).json({success: false});
    res.json({ success: true, story: rows[0] });
  } catch (err) { res.status(500).json({success:false}); }
});

// --- Feed & Search ---
app.get("/api/feed/posts", async (req, res) => {
  const { userId } = req.query;
  try {
    const [posts] = await db.query(
      `SELECT p.*, u.username, u.profile_pic_url, 
      (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count,
      (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count,
      EXISTS(SELECT 1 FROM POST_LIKE pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) AS user_has_liked,
      EXISTS(SELECT 1 FROM Saved_posts sp WHERE sp.post_id = p.post_id AND sp.user_id = ?) AS user_has_saved
      FROM POST p JOIN USER u ON p.user_id = u.user_id JOIN FOLLOW f ON p.user_id = f.following_id 
      WHERE f.follower_id = ? ORDER BY p.created_at DESC LIMIT 20`, 
      [userId, userId, userId]
    );
    
    const detailedPosts = await Promise.all(posts.map(async (p) => {
      const [media] = await db.query("SELECT media_url, media_type FROM MEDIA WHERE post_id = ?", [p.post_id]);
      const [tags] = await db.query("SELECT h.hashtag_text FROM POST_HASHTAG ph JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id WHERE ph.post_id = ?", [p.post_id]);
      return { ...p, media, hashtags: tags.map(t => t.hashtag_text), user_has_liked: !!p.user_has_liked, user_has_saved: !!p.user_has_saved };
    }));
    res.json({ success: true, posts: detailedPosts });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/feed/stories", async (req, res) => {
  try {
    const [stories] = await db.query(`SELECT s.*, u.username, u.profile_pic_url FROM STORY s JOIN USER u ON s.user_id = u.user_id JOIN FOLLOW f ON s.user_id = f.following_id WHERE s.expires_at > NOW() AND f.follower_id = ? ORDER BY s.created_at DESC`, [req.query.userId]);
    res.json({ success: true, stories });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/search/users", async (req, res) => {
  try {
    const q = `%${req.query.q}%`;
    const [users] = await db.query("SELECT user_id, username, full_name, profile_pic_url FROM USER WHERE (username LIKE ? OR full_name LIKE ?) AND is_deleted = FALSE", [q, q]);
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/search/suggested-users", async (req, res) => {
  try {
    const [users] = await db.query("SELECT user_id, username, full_name, profile_pic_url, follower_count FROM USER WHERE is_deleted = FALSE ORDER BY follower_count DESC LIMIT 5");
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: "Server error" }); }
});

app.get("/api/search/trending-hashtags", async (req, res) => {
  try {
    const [hashtags] = await db.query("SELECT h.hashtag_text, COUNT(ph.hashtag_id) as count FROM POST_HASHTAG ph JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id GROUP BY ph.hashtag_id ORDER BY count DESC LIMIT 10");
    res.json({ success: true, hashtags });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/hashtag/:hashtag_text", async (req, res) => {
  const { hashtag_text } = req.params;
  const { userId } = req.query;
  try {
    const [hRows] = await db.query("SELECT hashtag_id FROM HASHTAG WHERE hashtag_text = ?", [hashtag_text]);
    if (hRows.length === 0) return res.json({ success: true, posts: [] });
    
    const [posts] = await db.query(`SELECT p.*, u.username, u.profile_pic_url, (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count, (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count, EXISTS(SELECT 1 FROM POST_LIKE pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) AS user_has_liked, EXISTS(SELECT 1 FROM Saved_posts sp WHERE sp.post_id = p.post_id AND sp.user_id = ?) AS user_has_saved FROM POST p JOIN USER u ON p.user_id = u.user_id JOIN POST_HASHTAG ph ON p.post_id = ph.post_id WHERE ph.hashtag_id = ? ORDER BY p.created_at DESC`, [userId, userId, hRows[0].hashtag_id]);
    
    const detailed = await Promise.all(posts.map(async (p) => {
       const [media] = await db.query("SELECT media_url, media_type FROM MEDIA WHERE post_id = ?", [p.post_id]);
       const [tags] = await db.query("SELECT h.hashtag_text FROM POST_HASHTAG ph JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id WHERE ph.post_id = ?", [p.post_id]);
       return { ...p, media, hashtags: tags.map(t => t.hashtag_text), user_has_liked: !!p.user_has_liked, user_has_saved: !!p.user_has_saved };
    }));
    res.json({ success: true, posts: detailed });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/activity/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [activities] = await db.query(
      `SELECT 'like' AS type, pl.post_id, NULL AS story_id, NULL AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, pl.created_at, pl.user_id AS actor_id FROM POST_LIKE pl JOIN POST p ON pl.post_id = p.post_id JOIN USER u ON pl.user_id = u.user_id WHERE p.user_id = ? AND pl.user_id != ?
       UNION
       SELECT 'comment' AS type, c.post_id, NULL AS story_id, c.comment_text AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, c.created_at, c.user_id AS actor_id FROM COMMENT c JOIN POST p ON c.post_id = p.post_id JOIN USER u ON c.user_id = u.user_id WHERE p.user_id = ? AND c.user_id != ?
       UNION
       SELECT 'follow' AS type, NULL AS post_id, NULL AS story_id, NULL AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, f.created_at, f.follower_id AS actor_id FROM FOLLOW f JOIN USER u ON f.follower_id = u.user_id WHERE f.following_id = ?
       UNION
       SELECT 'save' AS type, sp.post_id, NULL AS story_id, NULL AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, sp.created_at, sp.user_id AS actor_id FROM Saved_posts sp JOIN POST p ON sp.post_id = p.post_id JOIN USER u ON sp.user_id = u.user_id WHERE p.user_id = ? AND sp.user_id != ?
       UNION
       SELECT 'story_tag' AS type, NULL AS post_id, st.story_id, NULL AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, st.created_at, s.user_id AS actor_id FROM STORY_TAG st JOIN STORY s ON st.story_id = s.story_id JOIN USER u ON s.user_id = u.user_id WHERE st.tagged_user_id = ? AND s.user_id != ?
       ORDER BY created_at DESC LIMIT 50`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );
    res.json({ success: true, activities });
  } catch (err) { res.status(500).json({success:false}); }
});

// --- Chat Routes ---
app.post("/api/conversations/start", async (req, res) => {
  const { userId1, username2 } = req.body;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [u2] = await conn.query("SELECT user_id FROM USER WHERE username = ?", [username2]);
    if (u2.length === 0) { await conn.rollback(); return res.status(404).json({success:false, message:"User not found"}); }
    const userId2 = u2[0].user_id;
    if (userId1 == userId2) { await conn.rollback(); return res.status(400).json({success:false}); }
    
    const [exists] = await conn.query("SELECT uc1.chat_id FROM USER_CHAT uc1 JOIN USER_CHAT uc2 ON uc1.chat_id = uc2.chat_id WHERE uc1.user_id = ? AND uc2.user_id = ?", [userId1, userId2]);
    if (exists.length > 0) {
      await conn.commit(); res.json({ success: true, chatId: exists[0].chat_id, isNew: false });
    } else {
      const [cr] = await conn.query("INSERT INTO CHAT () VALUES ()");
      await conn.query("INSERT INTO USER_CHAT (user_id, chat_id) VALUES (?, ?), (?, ?)", [userId1, cr.insertId, userId2, cr.insertId]);
      await conn.commit(); res.status(201).json({ success: true, chatId: cr.insertId, isNew: true });
    }
  } catch (err) { if (conn) await conn.rollback(); res.status(500).json({success:false}); } finally { if (conn) conn.release(); }
});

app.get("/api/conversations", async (req, res) => {
  try {
    const [convos] = await db.query(`SELECT c.chat_id, u.user_id AS other_user_id, u.username AS name, u.profile_pic_url, (SELECT message_text FROM DIRECT_MESSAGE WHERE chat_id = c.chat_id ORDER BY created_at DESC LIMIT 1) AS lastMessage, (SELECT created_at FROM DIRECT_MESSAGE WHERE chat_id = c.chat_id ORDER BY created_at DESC LIMIT 1) AS time FROM CHAT c JOIN USER_CHAT uc ON c.chat_id = uc.chat_id JOIN USER_CHAT uc2 ON c.chat_id = uc2.chat_id AND uc2.user_id != ? JOIN USER u ON uc2.user_id = u.user_id WHERE uc.user_id = ? GROUP BY c.chat_id, u.user_id ORDER BY time DESC`, [req.query.userId, req.query.userId]);
    res.json({ success: true, conversations: convos });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/conversations/:chatId", async (req, res) => {
  try {
    const [msgs] = await db.query("SELECT * FROM DIRECT_MESSAGE WHERE chat_id = ? ORDER BY created_at ASC", [req.params.chatId]);
    const [u] = await db.query("SELECT u.user_id, u.username, u.profile_pic_url FROM USER u JOIN USER_CHAT uc ON u.user_id = uc.user_id WHERE uc.chat_id = ? AND uc.user_id != ?", [req.params.chatId, req.query.userId]);
    res.json({ success: true, messages: msgs, otherUser: u[0] });
  } catch (err) { res.status(500).json({success:false}); }
});

app.post("/api/messages", async (req, res) => {
  const { chatId, senderId, messageText } = req.body;
  try {
    const [r] = await db.query("INSERT INTO DIRECT_MESSAGE (chat_id, sender_id, message_text) VALUES (?, ?, ?)", [chatId, senderId, messageText]);
    const [m] = await db.query("SELECT * FROM DIRECT_MESSAGE WHERE message_id = ?", [r.insertId]);
    res.status(201).json({ success: true, message: m[0] });
  } catch (err) { res.status(500).json({success:false}); }
});

// --- Profile Routes ---
app.get("/api/profile/:username", async (req, res) => {
  const { username } = req.params;
  const { loggedInUserId } = req.query;
  try {
    const [u] = await db.query("SELECT user_id, username, full_name, bio, profile_pic_url, follower_count FROM USER WHERE username = ?", [username]);
    if (u.length === 0) return res.status(404).json({success:false});
    const user = u[0];

    const [following] = await db.query("SELECT COUNT(*) as c FROM FOLLOW WHERE follower_id = ?", [user.user_id]);
    const [posts] = await db.query("SELECT p.post_id, p.caption, (SELECT m.media_url FROM MEDIA m WHERE m.post_id = p.post_id LIMIT 1) as media_url FROM POST p WHERE p.user_id = ? ORDER BY created_at DESC", [user.user_id]);
    
    let saved = [];
    if (user.user_id == loggedInUserId) {
      const [s] = await db.query("SELECT p.post_id, p.caption, (SELECT m.media_url FROM MEDIA m WHERE m.post_id = p.post_id LIMIT 1) as media_url FROM Saved_posts sp JOIN POST p ON sp.post_id = p.post_id WHERE sp.user_id = ? ORDER BY sp.created_at DESC", [user.user_id]);
      saved = s;
    }
    
    const [isF] = await db.query("SELECT 1 FROM FOLLOW WHERE follower_id = ? AND following_id = ?", [loggedInUserId, user.user_id]);
    
    res.json({ 
      success: true, 
      user: { ...user, following_count: following[0].c, post_count: posts.length, isFollowing: isF.length > 0 }, 
      posts, 
      savedPosts: saved 
    });
  } catch (err) { res.status(500).json({success:false}); }
});

app.post("/api/follow", async (req, res) => {
  const { followerId, followingId } = req.body;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [ex] = await conn.query("SELECT * FROM FOLLOW WHERE follower_id = ? AND following_id = ?", [followerId, followingId]);
    if (ex.length > 0) {
      await conn.query("DELETE FROM FOLLOW WHERE follower_id = ? AND following_id = ?", [followerId, followingId]);
      await conn.query("UPDATE USER SET follower_count = follower_count - 1 WHERE user_id = ?", [followingId]);
      await conn.commit(); res.json({ success: true, action: 'unfollowed' });
    } else {
      await conn.query("INSERT INTO FOLLOW (follower_id, following_id) VALUES (?, ?)", [followerId, followingId]);
      await conn.query("UPDATE USER SET follower_count = follower_count + 1 WHERE user_id = ?", [followingId]);
      await conn.commit(); res.json({ success: true, action: 'followed' });
    }
  } catch (err) { if (conn) await conn.rollback(); res.status(500).json({success:false}); } finally { if (conn) conn.release(); }
});

app.post("/api/followers/remove", async (req, res) => {
  const { followerId, followingId } = req.body;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [ex] = await conn.query("SELECT * FROM FOLLOW WHERE follower_id = ? AND following_id = ?", [followerId, followingId]);
    if (ex.length === 0) { await conn.rollback(); return res.status(404).json({success:false}); }

    await conn.query("DELETE FROM FOLLOW WHERE follower_id = ? AND following_id = ?", [followerId, followingId]);
    await conn.query("UPDATE USER SET follower_count = follower_count - 1 WHERE user_id = ? AND follower_count > 0", [followingId]);
    await conn.commit();
    res.json({ success: true, action: 'removed' });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false });
  } finally { if (conn) conn.release(); }
});

app.get("/api/profile/:userId/followers", async (req, res) => {
  try {
    const [f] = await db.query("SELECT u.user_id, u.username, u.full_name, u.profile_pic_url FROM FOLLOW f JOIN USER u ON f.follower_id = u.user_id WHERE f.following_id = ?", [req.params.userId]);
    res.json({ success: true, followers: f });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/profile/:userId/following", async (req, res) => {
  try {
    const [f] = await db.query("SELECT u.user_id, u.username, u.full_name, u.profile_pic_url FROM FOLLOW f JOIN USER u ON f.following_id = u.user_id WHERE f.follower_id = ?", [req.params.userId]);
    res.json({ success: true, following: f });
  } catch (err) { res.status(500).json({success:false}); }
});

app.put("/api/profile/:userId", async (req, res) => {
  const { fullName, bio } = req.body;
  
  // Validate full name and bio for abusive content
  if (containsAbusiveContent(fullName) || containsAbusiveContent(bio)) {
    return res.status(400).json({ 
      success: false, 
      message: "Profile contains inappropriate language." 
    });
  }
  
  try {
    await db.query("UPDATE USER SET full_name = ?, bio = ? WHERE user_id = ?", [req.body.fullName, req.body.bio, req.params.userId]);
    res.json({ success: true, message: "Updated" });
  } catch (err) { res.status(500).json({success:false}); }
});

app.delete("/api/profile/:userId", async (req, res) => {
  try {
    await db.query("DELETE FROM USER WHERE user_id = ?", [req.params.userId]);
    res.json({ success: true, message: "Account deleted" });
  } catch (err) { res.status(500).json({ success: false }); }
});

// --- Highlights Routes ---
app.get("/api/stories/archived", async (req, res) => {
  try {
    const [s] = await db.query("SELECT story_id, media_url, media_type, created_at FROM STORY WHERE user_id = ? ORDER BY created_at DESC", [req.query.userId]);
    res.json({ success: true, stories: s });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/profile/:username/highlights", async (req, res) => {
  try {
    const [h] = await db.query("SELECT h.highlight_id, h.title, s.media_url AS cover_media_url FROM HIGHLIGHT h JOIN USER u ON h.user_id = u.user_id LEFT JOIN STORY s ON h.cover_story_id = s.story_id WHERE u.username = ? ORDER BY h.created_at ASC", [req.params.username]);
    res.json({ success: true, highlights: h });
  } catch (err) { res.status(500).json({success:false}); }
});

app.get("/api/highlight/:highlightId/stories", async (req, res) => {
  try {
    const [s] = await db.query("SELECT s.*, u.username, u.profile_pic_url FROM STORY s JOIN HIGHLIGHT_STORY hs ON s.story_id = hs.story_id JOIN USER u ON s.user_id = u.user_id WHERE hs.highlight_id = ? ORDER BY s.created_at ASC", [req.params.highlightId]);
    res.json({ success: true, stories: s });
  } catch (err) { res.status(500).json({success:false}); }
});

app.post("/api/highlights/create", async (req, res) => {
  const { userId, title, storyIds } = req.body;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [h] = await conn.query("INSERT INTO HIGHLIGHT (user_id, title, cover_story_id) VALUES (?, ?, ?)", [userId, title, storyIds[0]]);
    const vals = storyIds.map(sid => [h.insertId, sid]);
    await conn.query("INSERT INTO HIGHLIGHT_STORY (highlight_id, story_id) VALUES ?", [vals]);
    await conn.commit();
    res.status(201).json({ success: true, message: "Highlight created!", highlightId: h.insertId });
  } catch (err) { if (conn) await conn.rollback(); res.status(500).json({success:false}); } finally { if (conn) conn.release(); }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));