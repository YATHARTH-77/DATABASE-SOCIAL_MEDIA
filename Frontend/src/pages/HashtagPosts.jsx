import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Bookmark, ThumbsUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { CommentSection } from "@/components/CommentSection";

// --- Base URL (Dynamic for Deployment) ---
const API_URL = import.meta.env.VITE_API_URL || "https://backend-sm-seven.vercel.app";

// --- Helper: Format timestamp (UTC Fix) ---
function formatTimeAgo(dateString) {
  if (!dateString) return "";
  let safeString = String(dateString);
  if (!safeString.includes("T") && !safeString.includes("Z")) {
    safeString = safeString.replace(" ", "T") + "Z";
  } else if (safeString.includes("T") && !safeString.includes("Z")) {
    safeString += "Z";
  }
  const date = new Date(safeString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 0) return "Just now";
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

export default function HashtagPosts() {
  const { tag } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentsData, setCommentsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Get Logged-in User ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login"); 
    }
  }, [navigate]);

  // --- Fetch Posts for this Hashtag ---
  useEffect(() => {
    if (!tag || !user) return; 

    const fetchHashtagPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/hashtag/${tag}?userId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setPosts(data.posts);
          setLikedPosts(data.posts.filter(p => p.user_has_liked).map(p => p.post_id));
          setSavedPosts(data.posts.filter(p => p.user_has_saved).map(p => p.post_id));
        } else {
          throw new Error(data.message || "Failed to fetch posts");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHashtagPosts();
  }, [tag, user]); 

  // --- API-Driven Action Handlers ---

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

    try {
      await fetch(`${API_URL}/api/posts/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (postId) => {
    if (!user) return;
    setSavedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
    try {
      await fetch(`${API_URL}/api/posts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId }),
      });
    } catch (err) {
      console.error(err);
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

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleHashtagClick = (tagText) => {
    navigate(`/hashtag/${tagText}`);
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-purple-200">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-sidebar">#{tag}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.post_id} className="overflow-hidden shadow-lg border max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] border-b border-purple-600">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 min-w-0"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.profile_pic_url ||''} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-white">{post.username}</p>
                    </div>
                  </div>
                </div>

                {/* --- DYNAMIC MEDIA (FIXED: Removed API_URL) --- */}
                <div className="bg-black max-h-[500px] flex items-center justify-center border-b">
                  {post.media && post.media.length > 0 ? (
                    post.media[0].media_type.startsWith('video') ? (
                      <video 
                        src={post.media[0].media_url} 
                        controls 
                        className="w-full max-h-[500px] object-contain" 
                      />
                    ) : (
                      <img 
                        src={post.media[0].media_url} 
                        alt="Post media" 
                        className="w-full max-h-[500px] object-contain" 
                      />
                    )
                  ) : (
                    <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
                  )}
                </div>

                {/* Caption, Actions, Hashtags */}
                <div className="p-4 space-y-3 bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="flex items-start justify-between">
                    <p className="text-sm break-words flex-1 pr-4 min-w-0 text-gray-800">
                      <span className="font-semibold cursor-pointer text-[#5A0395]" onClick={() => handleUserClick(post.username)}>
                        {post.username}
                      </span>{" "}
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 text-gray-600 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(post.post_id)}
                        className={`w-auto h-auto p-1 hover:bg-purple-100 ${likedPosts.includes(post.post_id) ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${likedPosts.includes(post.post_id) ? "fill-current" : ""}`} />
                        <span className="text-sm ml-1">{post.like_count}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-auto h-auto p-1 hover:bg-purple-100 relative ${openCommentPostId === post.post_id ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`}
                        onClick={() => toggleComments(post.post_id)}
                      >
                        <MessageCircle className="w-5 h-5" />
                        {post.comment_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#5A0395] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {post.comment_count}
                          </span>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSave(post.post_id)}
                        className={`w-auto h-auto p-1 hover:bg-purple-100 ${savedPosts.includes(post.post_id) ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`}
                      >
                        <Bookmark className={`w-5 h-5 ${savedPosts.includes(post.post_id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Hashtags (FIXED: Robust Rendering) */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="border-t pt-3 border-purple-200">
                      <p className="font-semibold text-sm mb-1 text-[#1D0C69]">#Hashtags:</p>
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.map((tag, idx) => {
                           const tagText = typeof tag === 'object' ? tag.hashtag_text : tag;
                           return (
                            <span
                              key={idx}
                              className="text-sm text-[#5A0395] hover:underline cursor-pointer font-medium"
                              onClick={() => handleHashtagClick(tagText)}
                            >
                              #{tagText}
                            </span>
                           );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600">{formatTimeAgo(post.created_at)}</p>
                </div>

                {/* Comment Section */}
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
    </>
  );
}