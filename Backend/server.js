// =================================================================
//         SERVER.JS (FINAL DEPLOYMENT VERSION)
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
//         CONTENT FILTERING (DATABASE TRIGGERS)
// =================================================================
//Trigger
//Trigger
const ABUSIVE_PATTERNS = [
  /f+\W*?u+\W*?c+\W*?k+/i,          // fuck variations
  /s+\W*?h+\W*?i+\W*?t+/i,          // shit variations
  /b+\W*?i+\W*?t+\W*?c+\W*?h+/i,      // bitch variations
  /a+\W*?s+\W*?s+\W*?h+\W*?o+\W*?l+\W*?e+/i, // asshole
  /d+\W*?i+\W*?c+\W*?k+/i,          // dick
  /c+\W*?o+\W*?c+\W*?k+/i,          // cock
  /p+\W*?u+\W*?s+\W*?s+\W*?y+/i,      // pussy
  /s+\W*?l+\W*?u+\W*?t+/i,          // slut
  /w+\W*?h+\W*?o+\W*?r+\W*?e+/i,      // whore
  /b+\W*?a+\W*?s+\W*?t+\W*?a+\W*?r+\W*?d+/i, // bastard
  /f+\W*?a+\W*?g+/i,              // fag variations
  /c+\W*?u+\W*?m+/i,              // cum
  /s+\W*?e+\W*?x+/i,              // sex, s3x, s*x
  /s+\W*?e+\W*?x+\W*?y+/i,          // sexy
  /p+\W*?o+\W*?r+\W*?n+/i,          // porn
  /h+\W*?o+\W*?r+\W*?n+/i,          // horny
  /n+\W*?i+\W*?g+\W*?g+\W*?a+/i,      // nigga
  /n+\W*?i+\W*?g+\W*?g+\W*?e+\W*?r+/i,  // nigger
  /a+\W*?s+\W*?s+/i
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

async function isSpamComment(db, userId, postId, commentText) {
  try {
    // Check for exact duplicate in last 5 minutes
    const [recentDuplicates] = await db.query(
      `SELECT COUNT(*) as count 
       FROM COMMENT 
       WHERE user_id = ? 
       AND post_id = ? 
       AND comment_text = ? 
       AND created_at > NOW() - INTERVAL 5 MINUTE`,
      [userId, postId, commentText]
    );
    
    if (recentDuplicates[0].count > 0) {
      return { isSpam: true, reason: "Duplicate comment detected" };
    }
    
    // Check for rapid commenting (more than 5 comments in 1 minute)
    const [rapidComments] = await db.query(
      `SELECT COUNT(*) as count 
       FROM COMMENT 
       WHERE user_id = ? 
       AND created_at > NOW() - INTERVAL 1 MINUTE`,
      [userId]
    );
    
    if (rapidComments[0].count >= 5) {
      return { isSpam: true, reason: "Too many comments in short time. Please slow down." };
    }
    
    // Check for repetitive characters (e.g., "aaaaaaa", "hahahaha")
    const repeatedChars = /(.)\1{5,}/gi;
    if (repeatedChars.test(commentText)) {
      return { isSpam: true, reason: "Spam detected: Repetitive characters" };
    }
    
    // Check for all caps (more than 70% uppercase)
    const uppercaseCount = (commentText.match(/[A-Z]/g) || []).length;
    const letterCount = (commentText.match(/[A-Za-z]/g) || []).length;
    if (letterCount > 10 && (uppercaseCount / letterCount) > 0.7) {
      return { isSpam: true, reason: "Please don't use excessive caps" };
    }
    
    return { isSpam: false };
    
  } catch (err) {
    console.error("Spam detection error:", err);
    return { isSpam: false }; // Don't block on error
  }
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
  timezone: '+05:30',
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
//         FILE UPLOAD (CLOUDINARY) CONFIG
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

// Storage for PROFILE PICTURES
const profilePicStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_media_profile_pics',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }] // Square crop
  },
});
const uploadProfilePic = multer({ storage: profilePicStorage });

const isAuthenticated = (req, res, next) => {
  if (req.user) {
    // req.user is set by passport from the session
    return next();
  }
  res.status(401).json({ success: false, message: 'Not authenticated' });
};

// =================================================================
//         PASSPORT & SESSION
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
//         ROUTES
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
// --- Post Routes (FIXED: Hashtag Logic & Abusive Content Check) ---
app.post("/api/posts/create", uploadPost.array('media', 10), async (req, res) => {
  const { user_id, caption, hashtags } = req.body;
  const files = req.files;
  
  console.log("📝 Creating post with hashtags:", hashtags); // Debug
  
  // 1. Validate caption for abusive content
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

    // 2. Insert Post
    const [postResult] = await conn.query(
      "INSERT INTO POST (user_id, caption) VALUES (?, ?)", 
      [user_id, caption]
    );
    const postId = postResult.insertId;
    console.log(`✅ Post ${postId} created`);

    // 3. Insert Media (Cloudinary)
    const mediaValues = files.map(f => [postId, f.path, f.mimetype]);
    if (mediaValues.length > 0) {
      await conn.query("INSERT INTO MEDIA (post_id, media_url, media_type) VALUES ?", [mediaValues]);
      console.log(`✅ Inserted ${mediaValues.length} media files`);
    }

    // 4. Insert Hashtags (FIXED LOGIC)
    if (hashtags && hashtags.trim().length > 0) {
      console.log("🏷️  Processing hashtags:", hashtags);
      
      // Clean tags: remove spaces, split by space, remove #, lowercase
      const tagList = hashtags
        .split(' ')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => {
          // Remove # if present and convert to lowercase
          const cleaned = t.startsWith('#') ? t.substring(1) : t;
          return cleaned.toLowerCase();
        });

      console.log("🔍 Cleaned tag list:", tagList);

      if (tagList.length > 0) {
        // A. Insert new tags (IGNORE duplicates)
        // Build VALUES clause: (?) for each tag
        const insertValues = tagList.map(tag => [tag]);
        await conn.query(
          "INSERT IGNORE INTO HASHTAG (hashtag_text) VALUES ?", 
          [insertValues]
        );
        console.log(`✅ Inserted/ignored ${tagList.length} hashtags into HASHTAG table`);

        // B. Get IDs of ALL tags - FIXED: Spread the array properly
        const placeholders = tagList.map(() => '?').join(', ');
        const [hRows] = await conn.query(
          `SELECT hashtag_id, hashtag_text FROM HASHTAG WHERE hashtag_text IN (${placeholders})`, 
          [...tagList] // ⭐ CRITICAL FIX: Spread the array!
        );

        console.log(`🔍 Found ${hRows.length} hashtag IDs:`, hRows);

        // C. Link tags to the post
        if (hRows.length > 0) {
          const phValues = hRows.map(row => [postId, row.hashtag_id]);
          await conn.query(
            "INSERT INTO POST_HASHTAG (post_id, hashtag_id) VALUES ?", 
            [phValues]
          );
          console.log(`✅ Linked ${phValues.length} hashtags to post ${postId}`);
        } else {
          console.warn("⚠️ No hashtag IDs found! Check HASHTAG table.");
        }
      }
    }

    await conn.commit();
    console.log(`✅ Post ${postId} committed successfully`);
    
    res.status(201).json({ 
      success: true, 
      message: "Post created!", 
      postId 
    });
    
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ Create Post DB error:", err);
    console.error("Error details:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: err.message 
    });
  } finally { 
    if (conn) conn.release(); 
  }
});
app.post("/api/posts/like", async (req, res) => {
  const { userId, postId } = req.body;
  
  if (!userId || !postId) {
    return res.status(400).json({
      success: false,
      message: "userId and postId are required"
    });
  }
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    
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
      await conn.commit();
      res.json({ success: true, action: 'unliked' });
    } else {
      // LIKE
      await conn.query(
        "INSERT INTO POST_LIKE (user_id, post_id) VALUES (?, ?)",
        [userId, postId]
      );
      await conn.commit();
      res.json({ success: true, action: 'liked' });
    }
    
  } catch (err) {
    console.error("Like error:", err);
    if (conn) await conn.rollback();
    res.status(500).json({success:false, message: "Internal server error"});
  } finally {
    if (conn) conn.release();
  }
});

app.post("/api/posts/save", async (req, res) => {
  const { userId, postId } = req.body;
  
  if (!userId || !postId) {
    return res.status(400).json({
      success: false,
      message: "userId and postId are required"
    });
  }
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    
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
      await conn.commit();
      res.json({ success: true, action: 'unsaved' });
    } else {
      // SAVE
      await conn.query(
        "INSERT INTO Saved_posts (user_id, post_id) VALUES (?, ?)",
        [userId, postId]
      );
      await conn.commit();
      res.json({ success: true, action: 'saved' });
    }
    
  } catch (err) {
    console.error("Save error:", err);
    if (conn) await conn.rollback();
    res.status(500).json({success:false, message: "Internal server error"});
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/posts/:postId/comments", async (req, res) => {
  try {
    const [comments] = await db.query(
      `SELECT c.*, 
      CONVERT_TZ(c.created_at, '+00:00', '+05:30') as created_at,
      u.username, u.profile_pic_url 
      FROM COMMENT c 
      JOIN USER u ON c.user_id = u.user_id 
      WHERE c.post_id = ? 
      ORDER BY c.created_at ASC`, 
      [req.params.postId]
    );
    res.json({ success: true, comments });
  } catch (err) { 
    console.error("Get comments error:", err);
    res.status(500).json({success:false}); 
  }
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
  

  // 🚫 CHECK 1: Abusive Content (same as post caption)
  if (containsAbusiveContent(commentText)) {
    return res.status(400).json({
      success: false,
      message: "Comment contains inappropriate language."
    });
  }

  // 🚫 CHECK 2: Spam Detection
  const spamCheck = await isSpamComment(db, userId, postId, commentText);
  if (spamCheck.isSpam) {
    return res.status(400).json({
      success: false,
      message: spamCheck.reason
    });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Insert the new comment
    const [resDb] = await conn.query(
      "INSERT INTO COMMENT (user_id, post_id, comment_text) VALUES (?, ?, ?)",
      [userId, postId, commentText]
    );

    // Fetch inserted comment with user info
    const [newComment] = await conn.query(
      `SELECT c.comment_id, c.comment_text, 
              CONVERT_TZ(c.created_at, '+00:00', '+05:30') as created_at,
              u.user_id, u.username, u.profile_pic_url
       FROM COMMENT c
       JOIN USER u ON c.user_id = u.user_id
       WHERE c.comment_id = ?`,
      [resDb.insertId]
    );

    await conn.commit();

    return res.status(201).json({
      success: true,
      comment: newComment[0]
    });

  } catch (err) {
    console.error("Add Comment Error:", err);

    if (conn) await conn.rollback();

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  } finally {
    if (conn) conn.release();
  }
});
app.get("/api/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  const { loggedInUserId } = req.query; // Get logged in user ID from query
  
  if (!loggedInUserId) {
    return res.status(400).json({ success: false, message: "loggedInUserId is required" });
  }

  try {
    const [posts] = await db.query(
      `SELECT p.*, 
        CONVERT_TZ(p.created_at, '+00:00', '+05:30') as created_at,
        u.username, u.profile_pic_url,
        (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count,
        (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count,
        EXISTS(SELECT 1 FROM POST_LIKE pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) AS user_has_liked,
        EXISTS(SELECT 1 FROM Saved_posts sp WHERE sp.post_id = p.post_id AND sp.user_id = ?) AS user_has_saved
       FROM POST p 
       JOIN USER u ON p.user_id = u.user_id
       WHERE p.post_id = ?`,
      [loggedInUserId, loggedInUserId, postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const post = posts[0];
    
    // Also fetch media and hashtags
    const [media] = await db.query("SELECT media_url, media_type FROM MEDIA WHERE post_id = ?", [post.post_id]);
    const [tags] = await db.query("SELECT h.hashtag_text FROM POST_HASHTAG ph JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id WHERE ph.post_id = ?", [post.post_id]);
    
    const detailedPost = { 
      ...post, 
      media, 
      hashtags: tags.map(t => t.hashtag_text), 
      user_has_liked: !!post.user_has_liked, 
      user_has_saved: !!post.user_has_saved 
    };

    // Use first media as the default `media_url` for simplicity in the modal
    if (media.length > 0) {
      detailedPost.media_url = media[0].media_url;
      detailedPost.media_type = media[0].media_type;
    }

    res.json({ success: true, post: detailedPost });

  } catch (err) {
    console.error("Get single post error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// --- DELETE POST ROUTE (Missing previously) ---
app.delete("/api/posts/:postId", isAuthenticated, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.user_id; // Get user ID from session

  if (!userId) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // The query now checks for BOTH post_id AND user_id
    // This ensures you can only delete your own posts
    const [result] = await conn.query(
      "DELETE FROM POST WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    if (result.affectedRows === 0) {
      // This means either the post wasn't found OR it wasn't owned by this user
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Post not found or you don't have permission to delete it" });
    }
    
    // Note: This also automatically deletes media, likes, comments, etc.
    // if you have `ON DELETE CASCADE` set up in your database.
    // If not, you would need to delete those manually here.

    await conn.commit();
    res.json({ success: true, message: "Post deleted" });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Delete post error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});


// --- Story Routes (UPDATED: Uses Cloudinary file.path) ---
// --- Story Routes (UPDATED: Cloudinary + Repost Support) ---
app.post("/api/stories/create", uploadStory.single('media'), async (req, res) => {
  const { user_id, tags, repost_story_id } = req.body;
  const file = req.file;
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    
    let mediaUrl, mediaType;
    
    // If reposting, use original story's media
    if (repost_story_id) {
      const [originalStory] = await conn.query(
        "SELECT media_url, media_type FROM STORY WHERE story_id = ?", 
        [repost_story_id]
      );
      
      if (originalStory.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: "Original story not found" });
      }
      
      mediaUrl = originalStory[0].media_url;
      mediaType = originalStory[0].media_type;
    } else if (file) {
      // New upload - Cloudinary
      mediaUrl = file.path;
      mediaType = file.mimetype;
    } else {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No media provided" });
    }
    
    // Insert story
    const [sRes] = await conn.query(
      `INSERT INTO STORY (user_id, media_url, media_type, expires_at) 
       VALUES (?, ?, ?, NOW() + INTERVAL 1 DAY)`, 
      [user_id, mediaUrl, mediaType]
    );
    
    // Handle tags
    if (tags) {
      const usernames = tags.split(' ').map(t => t.trim()).filter(t => t);
      if (usernames.length > 0) {
        const [users] = await conn.query(
          "SELECT user_id FROM USER WHERE username IN (?)", 
          [usernames]
        );
        if (users.length > 0) {
          const tVals = users.map(u => [sRes.insertId, u.user_id]);
          await conn.query(
            "INSERT INTO STORY_TAG (story_id, tagged_user_id) VALUES ?", 
            [tVals]
          );
        }
      }
    }
    
    await conn.commit();
    res.status(201).json({ success: true, message: "Story created!" });
    
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Create Story Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally { 
    if (conn) conn.release(); 
  }
});
app.get("/api/stories/archive", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }
  try {
    // Fetches ALL stories for a user, even expired ones
    const [stories] = await db.query(
      "SELECT story_id, media_url, media_type, created_at FROM STORY WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json({ success: true, stories });
  } catch (err) {
    console.error("Story archive error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/stories/:storyId", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT s.*, u.username, u.profile_pic_url FROM STORY s JOIN USER u ON s.user_id = u.user_id WHERE s.story_id = ?`, [req.params.storyId]);
    if (rows.length === 0) return res.status(404).json({success: false});
    res.json({ success: true, story: rows[0] });
  } catch (err) { res.status(500).json({success:false}); }
});

// --- NEW ROUTE: Get story archive for highlights ---


// --- Feed & Search ---
app.get("/api/feed/posts", async (req, res) => {
  const { userId } = req.query;
  try {
    const [posts] = await db.query(
      `SELECT p.*, 
      CONVERT_TZ(p.created_at, '+00:00', '+05:30') as created_at,
      u.username, u.profile_pic_url,
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
  } catch (err) { 
    console.error("Feed posts error:", err);
    res.status(500).json({success:false}); 
  }
});

// Replace the existing /api/feed/stories endpoint in server.js with this:

app.get("/api/feed/stories", async (req, res) => {
  try {
    const [stories] = await db.query(
      `SELECT s.*, 
      CONVERT_TZ(s.created_at, '+00:00', '+05:30') as created_at,
      CONVERT_TZ(s.expires_at, '+00:00', '+05:30') as expires_at,
      u.username, u.profile_pic_url 
      FROM STORY s 
      JOIN USER u ON s.user_id = u.user_id 
      WHERE s.expires_at > NOW() 
      AND (
        s.user_id = ? 
        OR s.user_id IN (
          SELECT following_id FROM FOLLOW WHERE follower_id = ?
        )
      )
      ORDER BY s.created_at DESC`, 
      [req.query.userId, req.query.userId]
    );
    res.json({ success: true, stories });
  } catch (err) { 
    console.error("Feed stories error:", err);
    res.status(500).json({success:false}); 
  }
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
    const { userId } = req.query; // ✅ Get userId from query parameters
    
    // If no userId provided (not logged in), show top users by follower count
    if (!userId) {
      const [users] = await db.query(
        `SELECT user_id, username, full_name, profile_pic_url, follower_count
         FROM USER
         WHERE is_deleted = FALSE
         ORDER BY follower_count DESC
         LIMIT 5`
      );
      return res.json({ success: true, users });
    }
    
    // If userId provided, exclude current user and users they already follow
    const [users] = await db.query(
      `SELECT u.user_id, u.username, u.full_name, u.profile_pic_url, u.follower_count
       FROM USER u
       WHERE u.is_deleted = FALSE
       AND u.user_id != ?
       AND u.user_id NOT IN (
         SELECT following_id FROM FOLLOW WHERE follower_id = ?
       )
       ORDER BY u.follower_count DESC
       LIMIT 5`,
      [userId, userId]
    );
    
    res.json({ success: true, users });
  } catch (err) {
    console.error("Suggested users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/search/trending-hashtags", async (req, res) => {
  try {
    const [hashtags] = await db.query(
      `SELECT h.hashtag_text, 
              COUNT(ph.hashtag_id) as post_count 
       FROM POST_HASHTAG ph 
       JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id 
       GROUP BY ph.hashtag_id, h.hashtag_text 
       ORDER BY post_count DESC 
       LIMIT 5`
    );
    
    // Debug log
    console.log("📊 Trending hashtags:", hashtags);
    
    res.json({ success: true, hashtags });
  } catch (err) {
    console.error("Trending hashtags error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/hashtag/:hashtag_text", async (req, res) => {
  const { hashtag_text } = req.params;
  const { userId } = req.query;
  try {
    const [hRows] = await db.query("SELECT hashtag_id FROM HASHTAG WHERE hashtag_text = ?", [hashtag_text]);
    if (hRows.length === 0) return res.json({ success: true, posts: [] });
    
    const [posts] = await db.query(
      `SELECT p.*, 
      CONVERT_TZ(p.created_at, '+00:00', '+05:30') as created_at,
      u.username, u.profile_pic_url, 
      (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count, 
      (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count, 
      EXISTS(SELECT 1 FROM POST_LIKE pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) AS user_has_liked, 
      EXISTS(SELECT 1 FROM Saved_posts sp WHERE sp.post_id = p.post_id AND sp.user_id = ?) AS user_has_saved 
      FROM POST p 
      JOIN USER u ON p.user_id = u.user_id 
      JOIN POST_HASHTAG ph ON p.post_id = ph.post_id 
      WHERE ph.hashtag_id = ? 
      ORDER BY p.created_at DESC`, 
      [userId, userId, hRows[0].hashtag_id]
    );
    
    const detailed = await Promise.all(posts.map(async (p) => {
       const [media] = await db.query("SELECT media_url, media_type FROM MEDIA WHERE post_id = ?", [p.post_id]);
       const [tags] = await db.query("SELECT h.hashtag_text FROM POST_HASHTAG ph JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id WHERE ph.post_id = ?", [p.post_id]);
       return { ...p, media, hashtags: tags.map(t => t.hashtag_text), user_has_liked: !!p.user_has_liked, user_has_saved: !!p.user_has_saved };
    }));
    res.json({ success: true, posts: detailed });
  } catch (err) { 
    console.error("Hashtag posts error:", err);
    res.status(500).json({success:false}); 
  }
});

app.get("/api/activity/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [activities] = await db.query(
      `SELECT 'like' AS type, pl.post_id, NULL AS story_id, NULL AS text_preview, 
      u.username AS actor_username, u.profile_pic_url AS actor_pic, 
      CONVERT_TZ(pl.created_at, '+00:00', '+05:30') as created_at, 
      pl.user_id AS actor_id 
      FROM POST_LIKE pl 
      JOIN POST p ON pl.post_id = p.post_id 
      JOIN USER u ON pl.user_id = u.user_id 
      WHERE p.user_id = ? AND pl.user_id != ?
       UNION
       SELECT 'comment' AS type, c.post_id, NULL AS story_id, c.comment_text AS text_preview, 
       u.username AS actor_username, u.profile_pic_url AS actor_pic, 
       CONVERT_TZ(c.created_at, '+00:00', '+05:30') as created_at, 
       c.user_id AS actor_id 
       FROM COMMENT c 
       JOIN POST p ON c.post_id = p.post_id 
       JOIN USER u ON c.user_id = u.user_id 
       WHERE p.user_id = ? AND c.user_id != ?
       UNION
       SELECT 'follow' AS type, NULL AS post_id, NULL AS story_id, NULL AS text_preview, 
       u.username AS actor_username, u.profile_pic_url AS actor_pic, 
       CONVERT_TZ(f.created_at, '+00:00', '+05:30') as created_at, 
       f.follower_id AS actor_id 
       FROM FOLLOW f 
       JOIN USER u ON f.follower_id = u.user_id 
       WHERE f.following_id = ?
       UNION
       SELECT 'save' AS type, sp.post_id, NULL AS story_id, NULL AS text_preview, 
       u.username AS actor_username, u.profile_pic_url AS actor_pic, 
       CONVERT_TZ(sp.created_at, '+00:00', '+05:30') as created_at, 
       sp.user_id AS actor_id 
       FROM Saved_posts sp 
       JOIN POST p ON sp.post_id = p.post_id 
       JOIN USER u ON sp.user_id = u.user_id 
       WHERE p.user_id = ? AND sp.user_id != ?
       UNION
       SELECT 'story_tag' AS type, NULL AS post_id, st.story_id, NULL AS text_preview, 
       u.username AS actor_username, u.profile_pic_url AS actor_pic, 
       CONVERT_TZ(st.created_at, '+00:00', '+05:30') as created_at, 
       s.user_id AS actor_id 
       FROM STORY_TAG st 
       JOIN STORY s ON st.story_id = s.story_id 
       JOIN USER u ON s.user_id = u.user_id 
       WHERE st.tagged_user_id = ? AND s.user_id != ?
       ORDER BY created_at DESC LIMIT 50`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );
    res.json({ success: true, activities });
  } catch (err) { 
    console.error("Activity error:", err);
    res.status(500).json({success:false}); 
  }
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
// --- Profile Route (FIXED: Added like_count & comment_count) ---
// --- Profile Route (FIXED: Fetches Like & Comment Counts) ---
app.get("/api/profile/:username", async (req, res) => {
  const { username } = req.params;
  const { loggedInUserId } = req.query;
  try {
    const [u] = await db.query("SELECT user_id, username, full_name, bio, profile_pic_url, follower_count FROM USER WHERE username = ?", [username]);
    if (u.length === 0) return res.status(404).json({success:false});
    const user = u[0];

    const [following] = await db.query("SELECT COUNT(*) as c FROM FOLLOW WHERE follower_id = ?", [user.user_id]);
    
    // 1. Get User's Posts (With Like & Comment Counts)
    const [posts] = await db.query(
      `SELECT p.post_id, p.caption, 
       CONVERT_TZ(p.created_at, '+00:00', '+05:30') as created_at,
       (SELECT m.media_url FROM MEDIA m WHERE m.post_id = p.post_id LIMIT 1) as media_url,
       (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count,
       (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count,
       EXISTS(SELECT 1 FROM POST_LIKE pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) AS user_has_liked,
       EXISTS(SELECT 1 FROM Saved_posts sp WHERE sp.post_id = p.post_id AND sp.user_id = ?) AS user_has_saved
       FROM POST p 
       WHERE p.user_id = ? 
       ORDER BY created_at DESC`, 
      [loggedInUserId, loggedInUserId, user.user_id]
    );
    
    // 2. Get Highlights
    const [h] = await db.query(`SELECT h.highlight_id, h.title, s.media_url AS cover_media_url FROM HIGHLIGHT h LEFT JOIN STORY s ON h.cover_story_id = s.story_id WHERE h.user_id = ? ORDER BY h.created_at ASC`, [user.user_id]);

    // 3. Get Saved Posts (With Like & Comment Counts)
    let saved = [];
    if (user.user_id == loggedInUserId) {
       const [s] = await db.query(
         `SELECT p.post_id, p.caption, 
          CONVERT_TZ(p.created_at, '+00:00', '+05:30') as created_at,
          (SELECT m.media_url FROM MEDIA m WHERE m.post_id = p.post_id LIMIT 1) as media_url,
          (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count,
          (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count,
          EXISTS(SELECT 1 FROM POST_LIKE pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) AS user_has_liked,
          EXISTS(SELECT 1 FROM Saved_posts sp WHERE sp.post_id = p.post_id AND sp.user_id = ?) AS user_has_saved
          FROM Saved_posts sp 
          JOIN POST p ON sp.post_id = p.post_id 
          WHERE sp.user_id = ? 
          ORDER BY sp.created_at DESC`, 
         [loggedInUserId, loggedInUserId, user.user_id]
       );
       saved = s;
    }
    
    const [isF] = await db.query("SELECT 1 FROM FOLLOW WHERE follower_id = ? AND following_id = ?", [loggedInUserId, user.user_id]);
    
    res.json({
      success: true,
      user: { ...user, following_count: following[0].c, post_count: posts.length, isFollowing: isF.length > 0 },
      posts: posts.map(p => ({...p, user_has_liked: !!p.user_has_liked, user_has_saved: !!p.user_has_saved})),
      savedPosts: saved.map(p => ({...p, user_has_liked: !!p.user_has_liked, user_has_saved: !!p.user_has_saved})),
      highlights: h
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({success:false});
  }
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

// --- Follow Back Route ---
app.post("/api/follow-back", async (req, res) => {
  const { followerId, followingId } = req.body;
  
  if (!followerId || !followingId) {
    return res.status(400).json({
      success: false,
      message: "followerId and followingId are required"
    });
  }
  
  if (followerId == followingId) {
    return res.status(400).json({
      success: false,
      message: "Cannot follow yourself"
    });
  }
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    
    const [existing] = await conn.query(
      "SELECT * FROM FOLLOW WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );
    
    if (existing.length > 0) {
      await conn.commit();
      return res.json({
        success: true,
        action: 'already_following',
        message: "Already following this user"
      });
    }
    
    await conn.query(
      "INSERT INTO FOLLOW (follower_id, following_id) VALUES (?, ?)",
      [followerId, followingId]
    );
    
    await conn.query(
      "UPDATE USER SET follower_count = follower_count + 1 WHERE user_id = ?",
      [followingId]
    );
    
    await conn.commit();
    res.json({
      success: true,
      action: 'followed',
      message: "Successfully followed back"
    });
    
  } catch (err) {
    console.error("Follow back error:", err);
    if (conn) await conn.rollback();
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } finally {
    if (conn) conn.release();
  }
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

// --- UPDATE PROFILE PICTURE ---
app.post("/api/profile/:userId/picture", uploadProfilePic.single('profilePic'), async (req, res) => {
  const { userId } = req.params;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ 
      success: false, 
      message: "No image file provided" 
    });
  }
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    
    // Get old profile pic URL to delete from Cloudinary (optional)
    const [oldProfile] = await conn.query(
      "SELECT profile_pic_url FROM USER WHERE user_id = ?",
      [userId]
    );
    
    // Update with new Cloudinary URL
    await conn.query(
      "UPDATE USER SET profile_pic_url = ? WHERE user_id = ?",
      [file.path, userId] // file.path is the Cloudinary URL
    );
    
    // Optional: Delete old image from Cloudinary if it exists
    if (oldProfile[0]?.profile_pic_url && oldProfile[0].profile_pic_url.includes('cloudinary')) {
      try {
        const publicId = oldProfile[0].profile_pic_url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`social_media_profile_pics/${publicId}`);
      } catch (deleteErr) {
        console.log("Could not delete old image:", deleteErr);
        // Continue anyway - don't fail the upload
      }
    }
    
    await conn.commit();
    
    res.json({ 
      success: true, 
      message: "Profile picture updated!",
      profile_pic_url: file.path
    });
    
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Profile pic update error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update profile picture" 
    });
  } finally {
    if (conn) conn.release();
  }
});
app.delete("/api/profile/:userId", async (req, res) => {
  try {
    await db.query("DELETE FROM USER WHERE user_id = ?", [req.params.userId]);
    res.json({ success: true, message: "Account deleted" });
  } catch (err) { res.status(500).json({ success: false }); }
});


// --- ⭐️ NEW HIGHLIGHT ROUTES ⭐️ ---

app.post("/api/highlights/create", async (req, res) => {
  const { user_id, title, story_ids, cover_story_id } = req.body;

  if (!user_id || !title || !story_ids || !story_ids.length || !cover_story_id) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Create the Highlight
    const [hResult] = await conn.query(
      "INSERT INTO HIGHLIGHT (user_id, title, cover_story_id) VALUES (?, ?, ?)",
      [user_id, title, cover_story_id]
    );
    const highlightId = hResult.insertId;

    // 2. Link stories to the highlight
    const storyLinks = story_ids.map(story_id => [highlightId, story_id]);
    await conn.query(
      "INSERT INTO HIGHLIGHT_STORY (highlight_id, story_id) VALUES ?",
      [storyLinks]
    );
    
    // 3. Get the newly created highlight data to return
    const [newHighlight] = await conn.query(
      `SELECT h.highlight_id, h.title, s.media_url AS cover_media_url
       FROM HIGHLIGHT h
       LEFT JOIN STORY s ON h.cover_story_id = s.story_id
       WHERE h.highlight_id = ?`,
      [highlightId]
    );

    await conn.commit();
    res.status(201).json({ success: true, highlight: newHighlight[0] });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Create Highlight Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.get("/api/highlights/:highlightId/stories", async (req, res) => {
  const { highlightId } = req.params;
  try {
    const [stories] = await db.query(
      `SELECT s.story_id, s.media_url, s.media_type, s.created_at, u.username, u.profile_pic_url
       FROM STORY s
       JOIN HIGHLIGHT_STORY hs ON s.story_id = hs.story_id
       JOIN USER u ON s.user_id = u.user_id
       WHERE hs.highlight_id = ?
       ORDER BY s.created_at ASC`,
      [highlightId]
    );
    res.json({ success: true, stories });
  } catch (err) {
    console.error("Get Highlight Stories Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- ⭐️ END NEW HIGHLIGHT ROUTES ⭐️ ---


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));