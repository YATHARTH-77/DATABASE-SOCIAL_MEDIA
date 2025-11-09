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
  password: 'ym@123@ym', // Your password
  database: 'S_M',
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
        const [hashtagRows] = await db.query(
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
//                 SEARCH ROUTES
// =================================================================
// (These routes are unchanged)

// 1. GET Trending Hashtags
app.get("/api/search/trending-hashtags", async (req, res) => {
  try {
    const sql = `
      SELECT h.hashtag_text, COUNT(ph.hashtag_id) as post_count
      FROM POST_HASHTAG ph
      JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id
      GROUP BY ph.hashtag_id, h.hashtag_text
      ORDER BY post_count DESC
      LIMIT 10
    `;
    const [hashtags] = await db.query(sql);
    res.json({ success: true, hashtags });
  } catch (err) {
    console.error("Get Trending DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 2. GET Suggested Users (Top followers)
app.get("/api/search/suggested-users", async (req, res) => {
  try {
    const sql = `
      SELECT user_id, username, full_name, profile_pic_url, follower_count
      FROM USER
      WHERE is_deleted = FALSE
      ORDER BY follower_count DESC
      LIMIT 5
    `;
    const [users] = await db.query(sql);
    res.json({ success: true, users });
  } catch (err) {
    console.error("Get Suggested Users DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 3. GET User Search (by query)
app.get("/api/search/users", async (req, res) => {
  const { q } = req.query; // Search query from ?q=...

  if (!q) {
    return res.status(400).json({ success: false, message: "Query 'q' is required." });
  }
  
  try {
    const query = `%${q}%`; // Add wildcards for LIKE search
    const sql = `
      SELECT user_id, username, full_name, profile_pic_url, follower_count
      FROM USER
      WHERE (username LIKE ? OR full_name LIKE ?) AND is_deleted = FALSE
    `;
    const [users] = await db.query(sql, [query, query]);
    res.json({ success: true, users });
  } catch (err) {
    console.error("User Search DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// =================================================================
//                 *** NEW HASHTAG ROUTES ***
// =================================================================

// 1. GET Posts by Hashtag
app.get("/api/hashtag/:hashtag_text", async (req, res) => {
  const { hashtag_text } = req.params;

  try {
    // 1. Find the hashtag_id
    const [hashtagRow] = await db.query(
      "SELECT hashtag_id FROM HASHTAG WHERE hashtag_text = ?",
      [hashtag_text]
    );

    if (hashtagRow.length === 0) {
      return res.json({ success: true, posts: [] }); // No posts for this tag
    }
    const hashtagId = hashtagRow[0].hashtag_id;

    // 2. Find all posts associated with this hashtag_id
    const [posts] = await db.query(
      `SELECT 
        p.post_id, p.user_id, p.caption, p.created_at,
        u.username, u.profile_pic_url,
        (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count,
        (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count
      FROM POST p
      JOIN USER u ON p.user_id = u.user_id
      JOIN POST_HASHTAG ph ON p.post_id = ph.post_id
      WHERE ph.hashtag_id = ?
      ORDER BY p.created_at DESC`,
      [hashtagId]
    );

    // 3. Get media for each post (similar to the home page feed)
    const postsWithDetails = await Promise.all(posts.map(async (post) => {
      const [media] = await db.query(
        "SELECT media_url, media_type FROM MEDIA WHERE post_id = ?", 
        [post.post_id]
      );
      
      // We already know the one hashtag, but we'll fetch them all for consistency
      const [hashtags] = await db.query(
        `SELECT h.hashtag_text FROM POST_HASHTAG ph 
         JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id 
         WHERE ph.post_id = ?`,
        [post.post_id]
      );

      return {
        ...post,
        media,
        hashtags: hashtags.map(h => h.hashtag_text),
      };
    }));

    res.json({ success: true, posts: postsWithDetails });

  } catch (err) {
    console.error("Get Posts by Hashtag DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/posts/like", async (req, res) => {
  const { userId, postId } = req.body;
  if (!userId || !postId) {
    return res.status(400).json({ success: false, message: "userId and postId are required" });
  }
  try {
    const [existing] = await db.query("SELECT * FROM POST_LIKE WHERE user_id = ? AND post_id = ?", [userId, postId]);
    if (existing.length > 0) {
      await db.query("DELETE FROM POST_LIKE WHERE user_id = ? AND post_id = ?", [userId, postId]);
      res.json({ success: true, action: 'unliked' });
    } else {
      await db.query("INSERT INTO POST_LIKE (user_id, post_id) VALUES (?, ?)", [userId, postId]);
      res.json({ success: true, action: 'liked' });
    }
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
});

// --- SAVE/UNSAVE A POST (TOGGLE) ---
app.post("/api/posts/save", async (req, res) => {
  const { userId, postId } = req.body;
  if (!userId || !postId) {
    return res.status(400).json({ success: false, message: "userId and postId are required" });
  }
  try {
    const [existing] = await db.query("SELECT * FROM Saved_posts WHERE user_id = ? AND post_id = ?", [userId, postId]);
    if (existing.length > 0) {
      await db.query("DELETE FROM Saved_posts WHERE user_id = ? AND post_id = ?", [userId, postId]);
      res.json({ success: true, action: 'unsaved' });
    } else {
      await db.query("INSERT INTO Saved_posts (user_id, post_id) VALUES (?, ?)", [userId, postId]);
      res.json({ success: true, action: 'saved' });
    }
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
});

// --- GET COMMENTS FOR A POST ---
app.get("/api/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  try {
    const [comments] = await db.query(
      `SELECT c.comment_id, c.comment_text, c.created_at, u.user_id, u.username, u.profile_pic_url
       FROM COMMENT c
       JOIN USER u ON c.user_id = u.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json({ success: true, comments });
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
});

// --- ADD A COMMENT TO A POST ---
app.post("/api/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const { userId, commentText } = req.body;
  if (!userId || !commentText) {
    return res.status(400).json({ success: false, message: "userId and commentText are required" });
  }
  try {
    const [result] = await db.query("INSERT INTO COMMENT (user_id, post_id, comment_text) VALUES (?, ?, ?)", [userId, postId, commentText]);
    const newCommentId = result.insertId;
    const [newComment] = await db.query(
      `SELECT c.comment_id, c.comment_text, c.created_at, u.user_id, u.username, u.profile_pic_url
       FROM COMMENT c
       JOIN USER u ON c.user_id = u.user_id
       WHERE c.comment_id = ?`,
      [newCommentId]
    );
    res.status(201).json({ success: true, comment: newComment[0] });
  } catch (err) { res.status(500).json({ success: false, message: "Internal server error" }); }
});


// =================================================================
//                 HASHTAG ROUTES
// =================================================================

// --- GET Posts by Hashtag (UPDATED) ---
app.get("/api/hashtag/:hashtag_text", async (req, res) => {
  const { hashtag_text } = req.params;
  const { userId } = req.query; // Get userId from query string

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId query parameter is required" });
  }

  try {
    // 1. Find the hashtag_id
    const [hashtagRow] = await db.query(
      "SELECT hashtag_id FROM HASHTAG WHERE hashtag_text = ?",
      [hashtag_text]
    );

    if (hashtagRow.length === 0) {
      return res.json({ success: true, posts: [] }); // No posts for this tag
    }
    const hashtagId = hashtagRow[0].hashtag_id;

    // 2. Find all posts associated with this hashtag_id (NOW INCLUDES LIKE/SAVE STATUS)
    const [posts] = await db.query(
      `SELECT 
        p.post_id, p.user_id, p.caption, p.created_at,
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
      [userId, userId, hashtagId] // Pass userId twice
    );

    // 3. Get media for each post
    const postsWithDetails = await Promise.all(posts.map(async (post) => {
      const [media] = await db.query(
        "SELECT media_url, media_type FROM MEDIA WHERE post_id = ?", 
        [post.post_id]
      );
      
      const [hashtags] = await db.query(
        `SELECT h.hashtag_text FROM POST_HASHTAG ph 
         JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id 
         WHERE ph.post_id = ?`,
        [post.post_id]
      );

      return {
        ...post,
        media,
        hashtags: hashtags.map(h => h.hashtag_text),
        // Convert 0/1 from EXISTS to boolean
        user_has_liked: !!post.user_has_liked,
        user_has_saved: !!post.user_has_saved
      };
    }));

    res.json({ success: true, posts: postsWithDetails });

  } catch (err) {
    console.error("Get Posts by Hashtag DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/activity/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [activities] = await db.query(
      `
      (
        -- New Likes
        SELECT 'like' AS type, pl.post_id, NULL AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, pl.created_at, pl.user_id AS actor_id
        FROM POST_LIKE pl
        JOIN POST p ON pl.post_id = p.post_id
        JOIN USER u ON pl.user_id = u.user_id
        WHERE p.user_id = ? AND pl.user_id != ?
      )
      UNION
      (
        -- New Comments
        SELECT 'comment' AS type, c.post_id, c.comment_text AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, c.created_at, c.user_id AS actor_id
        FROM COMMENT c
        JOIN POST p ON c.post_id = p.post_id
        JOIN USER u ON c.user_id = u.user_id
        WHERE p.user_id = ? AND c.user_id != ?
      )
      UNION
      (
        -- New Followers
        SELECT 'follow' AS type, NULL AS post_id, NULL AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, f.created_at, f.follower_id AS actor_id
        FROM FOLLOW f
        JOIN USER u ON f.follower_id = u.user_id
        WHERE f.following_id = ?
      )
      UNION
      (
        -- New Saves
        SELECT 'save' AS type, sp.post_id, NULL AS text_preview, u.username AS actor_username, u.profile_pic_url AS actor_pic, sp.created_at, sp.user_id AS actor_id
        FROM Saved_posts sp
        JOIN POST p ON sp.post_id = p.post_id
        JOIN USER u ON sp.user_id = u.user_id
        WHERE p.user_id = ? AND sp.user_id != ?
      )
      ORDER BY created_at DESC
      LIMIT 50
    `,
      // --- THIS IS THE FIX ---
      // The array now has 7 items to match the 7 '?' placeholders
      [userId, userId, userId, userId, userId, userId, userId]
    );
    res.json({ success: true, activities });
  } catch (err) {
    console.error("Get Activity DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- 2. FOLLOW/UNFOLLOW A USER (TOGGLE) ---
app.post("/api/follow", async (req, res) => {
  const { followerId, followingId } = req.body; // followerId = logged-in user

  if (!followerId || !followingId) {
    return res.status(400).json({ success: false, message: "followerId and followingId are required" });
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
      // --- UNFOLLOW ---
      await conn.query(
        "DELETE FROM FOLLOW WHERE follower_id = ? AND following_id = ?",
        [followerId, followingId]
      );
      await conn.query(
        "UPDATE USER SET follower_count = follower_count - 1 WHERE user_id = ?",
        [followingId]
      );
      
      await conn.commit();
      res.json({ success: true, action: 'unfollowed' });

    } else {
      // --- FOLLOW ---
      await conn.query(
        "INSERT INTO FOLLOW (follower_id, following_id) VALUES (?, ?)",
        [followerId, followingId]
      );
      await conn.query(
        "UPDATE USER SET follower_count = follower_count + 1 WHERE user_id = ?",
        [followingId]
      );

      await conn.commit();
      res.json({ success: true, action: 'followed' });
    }
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Follow/Unfollow DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// =================================================================
//                 *** NEW HOME FEED ROUTES ***
// =================================================================

// --- 1. GET STORIES FOR THE FEED (FOLLOWING ONLY) ---
app.get("/api/feed/stories", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId query parameter is required" });
  }
  
  try {
    const [stories] = await db.query(`
      SELECT s.story_id, s.media_url, s.created_at, s.user_id, u.username, u.profile_pic_url
      FROM STORY s
      JOIN USER u ON s.user_id = u.user_id
      JOIN FOLLOW f ON s.user_id = f.following_id
      WHERE s.expires_at > NOW() AND f.follower_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);
    res.json({ success: true, stories });
  } catch (err) {
    console.error("Get Feed Stories DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- 2. GET POSTS FOR THE FEED (FOLLOWING ONLY) ---
app.get("/api/feed/posts", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId query parameter is required" });
  }

  try {
    // This query gets posts ONLY from users the logged-in user follows
    const [posts] = await db.query(
      `SELECT 
        p.post_id, p.user_id, p.caption, p.created_at,
        u.username, u.profile_pic_url,
        (SELECT COUNT(*) FROM POST_LIKE pl WHERE pl.post_id = p.post_id) AS like_count,
        (SELECT COUNT(*) FROM COMMENT c WHERE c.post_id = p.post_id) AS comment_count,
        EXISTS(SELECT 1 FROM POST_LIKE pl WHERE pl.post_id = p.post_id AND pl.user_id = ?) AS user_has_liked,
        EXISTS(SELECT 1 FROM Saved_posts sp WHERE sp.post_id = p.post_id AND sp.user_id = ?) AS user_has_saved
      FROM POST p
      JOIN USER u ON p.user_id = u.user_id
      JOIN FOLLOW f ON p.user_id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY p.created_at DESC
      LIMIT 20`,
      [userId, userId, userId]
    );

    // Get media and hashtags for each post
    const postsWithDetails = await Promise.all(posts.map(async (post) => {
      const [media] = await db.query(
        "SELECT media_url, media_type FROM MEDIA WHERE post_id = ?", 
        [post.post_id]
      );
      
      const [hashtags] = await db.query(
        `SELECT h.hashtag_text FROM POST_HASHTAG ph 
         JOIN HASHTAG h ON ph.hashtag_id = h.hashtag_id 
         WHERE ph.post_id = ?`,
        [post.post_id]
      );

      return {
        ...post,
        media,
        hashtags: hashtags.map(h => h.hashtag_text),
        user_has_liked: !!post.user_has_liked,
        user_has_saved: !!post.user_has_saved
      };
    }));

    res.json({ success: true, posts: postsWithDetails });

  } catch (err) {
    console.error("Get Feed Posts DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- 1. GET ALL CONVERSATIONS FOR A USER ---
app.get("/api/conversations", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  try {
    // This query finds all chats the user is in,
    // then joins to find the *other* user in that chat.
    const [conversations] = await db.query(
      `
      SELECT 
        c.chat_id,
        u.user_id AS other_user_id,
        u.username AS name,
        u.profile_pic_url,
        (SELECT message_text FROM DIRECT_MESSAGE 
         WHERE chat_id = c.chat_id ORDER BY created_at DESC LIMIT 1) AS lastMessage,
        (SELECT created_at FROM DIRECT_MESSAGE 
         WHERE chat_id = c.chat_id ORDER BY created_at DESC LIMIT 1) AS time
      FROM CHAT c
      JOIN USER_CHAT uc ON c.chat_id = uc.chat_id
      JOIN USER_CHAT uc2 ON c.chat_id = uc2.chat_id AND uc2.user_id != ?
      JOIN USER u ON uc2.user_id = u.user_id
      WHERE uc.user_id = ?
      GROUP BY c.chat_id, u.user_id, u.username, u.profile_pic_url
      ORDER BY time DESC
    `, [userId, userId]
    );
    res.json({ success: true, conversations });
  } catch (err) {
    console.error("Get Conversations DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- 2. GET ALL MESSAGES FOR A SINGLE CONVERSATION ---
app.get("/api/conversations/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.query; // To find out who the "other user" is

  try {
    // Get all messages
    const [messages] = await db.query(
      `SELECT message_id, chat_id, sender_id, message_text, media_url, created_at 
       FROM DIRECT_MESSAGE 
       WHERE chat_id = ? 
       ORDER BY created_at ASC`,
      [chatId]
    );

    // Get info on the *other* user in the chat
    const [otherUser] = await db.query(
      `SELECT u.user_id, u.username, u.profile_pic_url 
       FROM USER u
       JOIN USER_CHAT uc ON u.user_id = uc.user_id
       WHERE uc.chat_id = ? AND uc.user_id != ?`,
       [chatId, userId]
    );

    res.json({ success: true, messages, otherUser: otherUser[0] || null });
  } catch (err) {
    console.error("Get Messages DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- 3. SEND A NEW MESSAGE ---
app.post("/api/messages", async (req, res) => {
  const { chatId, senderId, messageText } = req.body;
  if (!chatId || !senderId || !messageText) {
    return res.status(400).json({ success: false, message: "chatId, senderId, and messageText are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO DIRECT_MESSAGE (chat_id, sender_id, message_text) VALUES (?, ?, ?)",
      [chatId, senderId, messageText]
    );
    
    // Fetch the newly created message to send back
    const [newMessage] = await db.query(
      "SELECT * FROM DIRECT_MESSAGE WHERE message_id = ?",
      [result.insertId]
    );

    res.status(201).json({ success: true, message: newMessage[0] });
  } catch (err) {
    console.error("Send Message DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// --- 4. START A NEW CONVERSATION ---
// --- 4. START A NEW CONVERSATION (*** MODIFIED ***) ---
app.post("/api/conversations/start", async (req, res) => {
  const { userId1, username2 } = req.body; 

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Find the user_id for the target username
    const [user2Rows] = await conn.query("SELECT user_id FROM USER WHERE username = ?", [username2]);
    
    if (user2Rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const userId2 = user2Rows[0].user_id;

    if (userId1 == userId2) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Cannot start a chat with yourself" });
    }

    // 2. Check if a 1-on-1 chat already exists (*** THIS IS THE FIX ***)
    const [existingChat] = await conn.query(
      // --- Changed 'SELECT chat_id' to 'SELECT uc1.chat_id' ---
      `SELECT uc1.chat_id FROM USER_CHAT uc1
       JOIN USER_CHAT uc2 ON uc1.chat_id = uc2.chat_id
       WHERE uc1.user_id = ? AND uc2.user_id = ?`,
       [userId1, userId2]
    );

    if (existingChat.length > 0) {
      // Chat already exists
      await conn.commit();
      res.json({ success: true, chatId: existingChat[0].chat_id, isNew: false });
    } else {
      // 3. Create a new chat
      const [chatResult] = await conn.query("INSERT INTO CHAT () VALUES ()");
      const newChatId = chatResult.insertId;

      // 4. Link both users to the new chat
      await conn.query("INSERT INTO USER_CHAT (user_id, chat_id) VALUES (?, ?), (?, ?)", [
        userId1, newChatId, userId2, newChatId
      ]);

      await conn.commit();
      res.status(201).json({ success: true, chatId: newChatId, isNew: true });
    }
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Start Conversation DB error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

// =================================================================
//                 START SERVER
// =================================================================

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));