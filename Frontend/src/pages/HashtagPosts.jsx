import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Bookmark, ThumbsUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { CommentSection } from "@/components/CommentSection";

// --- Base URL for our API ---
const API_URL = "http://localhost:5000";

export default function HashtagPosts() {
  const { tag } = useParams();
  const navigate = useNavigate();

  // --- All state is now dynamic ---
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
      navigate("/login"); // Not logged in, redirect
    }
  }, [navigate]);

  // --- Fetch Posts for this Hashtag ---
  useEffect(() => {
    if (!tag || !user) return; // Don't fetch until we have the tag and user

    const fetchHashtagPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/hashtag/${tag}?userId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setPosts(data.posts);
          // Initialize liked/saved state from the fetched data
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
  }, [tag, user]); // Refetch if the tag or user changes

  // --- API-Driven Action Handlers ---

  const handleLike = async (postId) => {
    if (!user) return;

    const isLiked = likedPosts.includes(postId);

    // Optimistic UI Update (feels faster)
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
    // If opening and comments aren't loaded, fetch them
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
        // Add new comment to state and update count
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

  // --- Render Loading/Error States ---
  if (isLoading) {
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
          <p className="text-red-500">Error: {error}</p>
        </main>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-primary">#{tag}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.post_id} className="overflow-hidden shadow-lg border">
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

                <div className="p-4 space-y-3 bg-gray-100">
                  <div className="flex items-start justify-between">
                    <p className="text-sm break-words flex-1 pr-4 min-w-0">
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

                  <div className="border-t pt-3">
                    <p className="font-semibold text-sm mb-1 text-gray-700">#Hashtags:</p>
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((hashtag, idx) => (
                        <span
                          key={idx}
                          className="text-sm text-blue-600 hover:underline cursor-pointer"
                          onClick={() => navigate(`/hashtag/${hashtag}`)}
                        >
                          #{hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

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