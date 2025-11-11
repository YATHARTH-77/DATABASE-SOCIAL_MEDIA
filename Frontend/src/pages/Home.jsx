import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { navItems } from "@/components/Sidebar";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, ThumbsUp, Loader2 } from "lucide-react";
import { StoryViewer } from "@/components/StoryViewer";
import { CommentSection } from "@/components/CommentSection";

// --- Base URL for our API ---
const API_URL = "http://localhost:5000";

// --- Helper: Format timestamp (e.g., "5m ago") ---
function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

export default function Home() {
  const navigate = useNavigate();

  // --- Dynamic State ---
  const [user, setUser] = useState(null);
  const [moments, setMoments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentsData, setCommentsData] = useState({});
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Now controls the whole page
  const [error, setError] = useState(null);

  // --- 1. Get Logged-in User ---
  // This is the most critical part for Google Login. This useEffect checks if a user is in localStorage (from a normal login) or in the server session (from a Google login).
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check localStorage first (for email/pass login)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        return; // Found user, exit
      }

      // 2. If not, check server session (for Google Login redirect)
      try {
        const res = await fetch("http://localhost:5000/api/auth/current_user", {
          credentials: 'include' // This is crucial for sending the session cookie
        });
        
        if (!res.ok) {
           // Not an error, just not logged in
           navigate("/login");
           return;
        }

        const data = await res.json();
        
        if (data.success) {
          // Save Google user to localStorage for future visits
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        } else {
          // Not logged in
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  // --- 2. Fetch Feed Data (Moments & Posts) on Load ---
  useEffect(() => {
    if (!user) return; // Don't fetch if user isn't loaded yet

    const fetchFeedData = async () => {
      setIsLoading(true); // Set loading to true *when* we start fetching
      setError(null);
      try {
        // --- Fetch Moments ---
        const momentsRes = await fetch(`${API_URL}/api/feed/stories?userId=${user.id}`);
        const momentsData = await momentsRes.json();
        if (momentsData.success) {
          // Map server data to frontend StoryViewer structure
          setMoments(momentsData.stories.map(s => ({
            id: s.story_id,
            username: s.username,
            avatar: s.profile_pic_url,
            src: `${API_URL}${s.media_url}`,
            type: s.media_url && s.media_url.endsWith('.mp4') ? 'video' : 'photo',
            timestamp: s.created_at,
          })));
        }

        // --- Fetch Posts ---
        const postsRes = await fetch(`${API_URL}/api/feed/posts?userId=${user.id}`);
        const postsData = await postsRes.json();
        
        if (postsData.success) {
          setPosts(postsData.posts);
          // Initialize liked/saved state from the fetched data
          setLikedPosts(postsData.posts.filter(p => p.user_has_liked).map(p => p.post_id));
          setSavedPosts(postsData.posts.filter(p => p.user_has_saved).map(p => p.post_id));
        } else {
          throw new Error(postsData.message);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false); // Set loading to false *after* fetching is done
      }
    };

    fetchFeedData();
  }, [user]); // Re-run when user is available

  // --- 3. API-Driven Action Handlers ---

  const handleLike = async (postId) => {
    if (!user) return;
    const isLiked = likedPosts.includes(postId);

    // Optimistic UI Update
    setLikedPosts(prev => isLiked ? prev.filter(id => id !== postId) : [...prev, postId]);
    setPosts(prevPosts => prevPosts.map(p => 
      p.post_id === postId 
        ? { ...p, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 }
        : p
    ));

    // API Call
    try {
      await fetch(`${API_URL}/api/posts/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId }),
      });
    } catch (err) {
      console.error("Failed to like post:", err);
      // Revert on error
      setLikedPosts(prev => isLiked ? [...prev, postId] : prev.filter(id => id !== postId));
       setPosts(prevPosts => prevPosts.map(p => 
        p.post_id === postId 
          ? { ...p, like_count: isLiked ? p.like_count + 1 : p.like_count - 1 }
          : p
      ));
    }
  };

  const handleSave = async (postId) => {
    if (!user) return;
    // Optimistic UI Update
    setSavedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
    // API Call
    try {
      await fetch(`${API_URL}/api/posts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId }),
      });
    } catch (err) {
      console.error("Failed to save post:", err);
      // Revert on error
      setSavedPosts(prev =>
        prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
      );
    }
  };
  
  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) {
        setCommentsData(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (err) { console.error("Failed to fetch comments:", err); }
  };

  const toggleComments = (postId) => {
    const newOpenId = openCommentPostId === postId ? null : postId;
    setOpenCommentPostId(newOpenId);
    if (newOpenId && !commentsData[postId]) {
      fetchComments(postId);
    }
  };

  const handleAddComment = async (postId, commentText) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, commentText }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentsData(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        setPosts(prevPosts => prevPosts.map(p =>
          p.post_id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
        ));
      }
    } catch (err) { console.error("Failed to add comment:", err); }
  };

  const handleMomentClick = (index) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleHashtagClick = (tag) => {
    navigate(`/hashtag/${tag}`); // Tag already comes without '#' from server
  };
  
  // --- 4. Render Loading/Error/Content ---

  if (isLoading || !user) { // Show loader until user is verified AND data is loaded
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 flex items-center justify-center">
          <p className="text-red-500 text-center">
            Error fetching feed: {error}<br/>
            (Please make sure you have followed some users)
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {showStoryViewer && (
        <StoryViewer
          stories={moments}
          initialIndex={selectedStoryIndex}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
      
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* --- MOMENTS --- */}
          <div className="bg-secondary/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-secondary/20">
            <h2 className="text-white font-bold gradient-primary px-4 py-1 rounded-full inline-block mb-4">
              MOMENTS
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {/* "Your Story" button (Unchanged) */}
              <div>
                {(() => {
                  const createItem = navItems.find((n) => n.label === "CREATE");
                  const Icon = createItem ? createItem.icon : null;
                  const to = createItem ? `${createItem.path}?tab=moment` : "/create?tab=moment";
                  return (
                    <Link to={to} onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-2">
                      <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-emerald-500 via-emerald-400 to-lime-400 cursor-pointer transition-shadow hover:shadow-xl flex items-center justify-center`}>
                        <div className="w-14 h-14 rounded-full bg-white/75 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                          <button
                            aria-label="Create Story"
                            className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md"
                          >
                            {Icon ? <Icon className="w-4 h-4" /> : <span className="text-white font-extrabold">+</span>}
                          </button>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Your Story</span>
                    </Link>
                  );
                })()}
              </div>
              
              {/* DYNAMIC MOMENTS */}
              {moments.map((moment, index) => (
                <div key={moment.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-emerald-400 to-amber-400 p-1 cursor-pointer"
                    onClick={() => handleMomentClick(index)}
                  >
                    <div className="w-full h-full rounded-full bg-background p-1">
                      <Avatar className="w-full h-full">
                        <AvatarImage src={moment.avatar ? `${API_URL}${moment.avatar}` : ''} />
                        <AvatarFallback>{moment.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{moment.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* --- FEED --- */}
          <div className="space-y-6">
            <h2 className="text-white font-bold gradient-primary px-4 py-1 rounded-full inline-block">
              FEED
            </h2>

            {posts.length === 0 && (
              <Card className="p-10 text-center text-muted-foreground">
                <p>Your feed is empty.</p>
                <p className="text-sm">Follow some users to see their posts here!</p>
              </Card>
            )}

            {posts.map((post) => (
              <Card key={post.post_id} className="overflow-hidden shadow-lg border">
                {/* Header (Username & Avatar) */}
                <div className="flex items-center justify-between p-3 bg-yellow-300/80 border-b border-yellow-400">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 min-w-0"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.profile_pic_url ? `${API_URL}${post.profile_pic_url}` : ''} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-blue-800">{post.username}</p>
                    </div>
                  </div>
                </div>

                {/* --- DYNAMIC MEDIA --- */}
                <div className="bg-black aspect-square flex items-center justify-center border-b">
                  {post.media && post.media.length > 0 ? (
                    post.media[0].media_type.startsWith('video') ? (
                      <video 
                        src={`${API_URL}${post.media[0].media_url}`} 
                        controls 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <img 
                        src={`${API_URL}${post.media[0].media_url}`} 
                        alt="Post media" 
                        className="w-full h-full object-cover" 
                      />
                    )
                  ) : (
                    <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
                  )}
                </div>

                {/* Caption, Actions, Hashtags */}
                <div className="p-4 space-y-3 bg-gray-100">
                  <div className="flex items-start justify-between">
                    <p className="text-sm break-words flex-1 pr-4 min-w-0">
                      <span className="font-semibold cursor-pointer" onClick={() => handleUserClick(post.username)}>
                        {post.username}
                      </span>{" "}
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 text-gray-600 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(post.post_id)}
                        className={`w-auto h-auto p-1 ${likedPosts.includes(post.post_id) ? "text-blue-500" : "hover:text-blue-500"}`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${likedPosts.includes(post.post_id) ? "fill-current" : ""}`} />
                        <span className="text-sm ml-1">{post.like_count}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-auto h-auto p-1 relative ${openCommentPostId === post.post_id ? "text-blue-500" : "hover:text-blue-500"}`}
                        onClick={() => toggleComments(post.post_id)}
                      >
                        <MessageCircle className="w-5 h-5" />
                        {post.comment_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {post.comment_count}
                          </span>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSave(post.post_id)}
                        className={`w-auto h-auto p-1 ${savedPosts.includes(post.post_id) ? "text-blue-500" : "hover:text-blue-500"}`}
                      >
                        <Bookmark className={`w-5 h-5 ${savedPosts.includes(post.post_id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div className="border-t pt-3">
                    <p className="font-semibold text-sm mb-1 text-gray-700">#Hashtags:</p>
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-sm text-blue-600 hover:underline cursor-pointer"
                          onClick={() => handleHashtagClick(tag)}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
                </div>

                {/* Comment Section - Inline */}
                {openCommentPostId === post.post_id && (
                  <CommentSection
                    postId={post.post_id}
                    comments={commentsData[post.post_id] || []}
                    onAddComment={handleAddComment}
                    onClose={() => setOpenCommentPostId(null)}
                    onUserClick={(username) => navigate(`/user/${username}`)}
                    currentUser={user}
                  />
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}