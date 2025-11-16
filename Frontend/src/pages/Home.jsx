import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { navItems } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, ThumbsUp, Loader2, Plus } from "lucide-react";
import { StoryViewer } from "@/components/StoryViewer";
import { CommentSection } from "@/components/CommentSection";

// --- Base URL ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export default function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  // moments will now store GROUPS of users, not individual stories
  const [moments, setMoments] = useState([]); 
  // userStories will store an ARRAY of the current user's stories
  const [userStories, setUserStories] = useState([]); 
  
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentsData, setCommentsData] = useState({});
  
  // Story Viewer State
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [viewerStories, setViewerStories] = useState([]); // Stories currently being viewed
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. Check Auth ---
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/current_user`, { credentials: 'include' });
        if (!res.ok) { navigate("/login"); return; }
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        } else { navigate("/login"); }
      } catch (err) { navigate("/login"); }
    };
    checkAuth();
  }, [navigate]);

  // --- 2. Fetch Data & GROUP STORIES ---
  useEffect(() => {
    if (!user) return;

    const fetchFeedData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // A. Fetch Stories
        const momentsRes = await fetch(`${API_URL}/api/feed/stories?userId=${user.id}`);
        const momentsData = await momentsRes.json();
        
        if (momentsData.success) {
          // --- GROUPING LOGIC ---
          const groupedMap = {};

          momentsData.stories.forEach(s => {
            // Format the story object
            const formattedStory = {
                id: s.story_id,
                username: s.username,
                avatar: s.profile_pic_url,
                src: s.media_url, // Already absolute from Cloudinary
                type: s.media_type && s.media_type.startsWith('video') ? 'video' : 'photo',
                timestamp: s.created_at,
                userId: s.user_id
            };

            // Initialize group if not exists
            if (!groupedMap[s.user_id]) {
                groupedMap[s.user_id] = {
                    userId: s.user_id,
                    username: s.username,
                    avatar: s.profile_pic_url,
                    stories: []
                };
            }
            // Add story to that user's group
            groupedMap[s.user_id].stories.push(formattedStory);
          });

          // Extract current user's group
          const myGroup = groupedMap[user.id];
          if (myGroup) {
             setUserStories(myGroup.stories);
             delete groupedMap[user.id]; // Remove from the general list
          } else {
             setUserStories([]);
          }

          // Convert remaining map to array for "Moments" list
          const othersList = Object.values(groupedMap);
          setMoments(othersList);
        }

        // B. Fetch Posts
        const postsRes = await fetch(`${API_URL}/api/feed/posts?userId=${user.id}`);
        const postsData = await postsRes.json();
        
        if (postsData.success) {
          setPosts(postsData.posts);
          setLikedPosts(postsData.posts.filter(p => p.user_has_liked).map(p => p.post_id));
          setSavedPosts(postsData.posts.filter(p => p.user_has_saved).map(p => p.post_id));
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedData();
  }, [user]);

  // --- 3. Handlers ---
  
  // Opens the viewer with a specific list of stories (either mine or a friend's)
  const openStoryViewer = (storiesList) => {
    setViewerStories(storiesList);
    setInitialStoryIndex(0);
    setShowStoryViewer(true);
  };

  const handleLike = async (postId) => {
    if (!user) return;
    const isLiked = likedPosts.includes(postId);
    setLikedPosts(prev => isLiked ? prev.filter(id => id !== postId) : [...prev, postId]);
    setPosts(prevPosts => prevPosts.map(p => 
      p.post_id === postId ? { ...p, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 } : p
    ));
    try {
      await fetch(`${API_URL}/api/posts/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId }),
      });
    } catch (err) { console.error(err); }
  };

  const handleSave = async (postId) => {
    if (!user) return;
    setSavedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
    try {
      await fetch(`${API_URL}/api/posts/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId }),
      });
    } catch (err) { console.error(err); }
  };
  
  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) setCommentsData(prev => ({ ...prev, [postId]: data.comments }));
    } catch (err) { console.error(err); }
  };

  const toggleComments = (postId) => {
    const newOpenId = openCommentPostId === postId ? null : postId;
    setOpenCommentPostId(newOpenId);
    if (newOpenId && !commentsData[postId]) fetchComments(postId);
  };

  const handleAddComment = async (postId, commentText) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, commentText }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentsData(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
        setPosts(prevPosts => prevPosts.map(p => p.post_id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
      }
    } catch (err) { console.error(err); }
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleHashtagClick = (tag) => {
    navigate(`/hashtag/${tag}`);
  };
  
  if (isLoading || !user) { 
    return <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></main>;
  }

  if (error) {
    return <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center"><p className="text-red-500">Error: {error}</p></main>;
  }

  return (
    <>
      {showStoryViewer && (
        <StoryViewer
          stories={viewerStories}
          initialIndex={initialStoryIndex}
          onClose={() => setShowStoryViewer(false)}
        />
      )}

      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          

{/* --- MOMENTS --- */}
<div className="rounded-2xl p-4 md:p-6 border border-secondary/20 overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100">
  <div>
    <h2 className="text-white font-bold px-4 py-2 rounded-full inline-block mb-4 text-base md:text-lg bg-gradient-to-r from-[#1D0C69] to-[#5A0395]">
      MOMENTS
    </h2>
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      <style jsx>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    
      {/* 1. ADD MOMENT BUTTON (ALWAYS SHOWS) */}
      <div>
        <Link to="/create?tab=moment" className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-[#1D0C69] to-[#5A0395] cursor-pointer transition-shadow hover:shadow-xl flex items-center justify-center">
             <div className="w-14 h-14 rounded-full bg-white/75 backdrop-blur-sm border border-white/20 flex items-center justify-center">
               <div className="w-8 h-8 rounded-full bg-[#5A0395] text-white flex items-center justify-center shadow-md">
                 <Plus className="w-5 h-5" />
               </div>
             </div>
          </div>
          <span className="text-xs text-[#5A0395] font-medium">Add Moment</span>
        </Link>
      </div>

      {/* 2. MY STORY (ONLY IF I HAVE STORIES) */}
      {userStories.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1D0C69] via-[#5A0395] to-[#3D1A8F] p-[2px] cursor-pointer"
            onClick={() => openStoryViewer(userStories)}
          >
            <div className="w-full h-full rounded-full bg-white p-[2px]">
              <Avatar className="w-full h-full">
                <AvatarImage 
                  src={userStories[0]?.avatar || ''} 
                  alt={userStories[0]?.username || 'Your Story'}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-[#1D0C69] to-[#5A0395] text-white">
                  {userStories[0]?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-xs text-[#5A0395] font-medium">Your Story</span>
        </div>
      )}
      
      {/* 3. OTHER USERS' STORIES (Grouped) */}
      {moments.map((group) => (
        <div key={group.userId} className="flex flex-col items-center gap-2 flex-shrink-0">
          <div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1D0C69] via-[#5A0395] to-[#3D1A8F] p-[2px] cursor-pointer"
            onClick={() => openStoryViewer(group.stories)}
          >
            <div className="w-full h-full rounded-full bg-white p-[2px]">
              <Avatar className="w-full h-full">
                <AvatarImage 
                  src={group.avatar || ''} 
                  alt={group.username}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-[#1D0C69] to-[#5A0395] text-white">
                  {group.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-xs text-[#5A0395] font-medium">{group.username}</span>
        </div>
      ))}
    </div>
  </div>
</div>
          {/* --- FEED --- */}
          <div className="space-y-6">
            <h2 className="text-white font-bold gradient-sidebar px-4 py-1 rounded-full inline-block">
              FEED
            </h2>

            {posts.length === 0 && (
              <Card className="overflow-hidden rounded-2xl border border-secondary/20 p-0 bg-gradient-to-br from-[#1D0C69] to-[#5A0395]">
                <div className="p-10 text-center text-white">
                  <p>Your feed is empty.</p>
                  <p className="text-sm">Follow some users to see their posts here!</p>
                </div>
              </Card>
            )}

            {posts.map((post) => (
              <Card key={post.post_id} className="overflow-hidden shadow-lg border max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] border-b border-purple-600">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 min-w-0"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.profile_pic_url || ''} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-white">{post.username}</p>
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="bg-black max-h-[500px] flex items-center justify-center border-b">
                  {post.media && post.media.length > 0 ? (
                    post.media[0].media_type.startsWith('video') ? (
                      <video src={post.media[0].media_url} controls className="w-full max-h-[500px] object-contain" />
                    ) : (
                      <img src={post.media[0].media_url} alt="Post media" className="w-full max-h-[500px] object-contain" />
                    )
                  ) : (
                    <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
                  )}
                </div>

                {/* Caption & Actions */}
                <div className="p-4 space-y-3 bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="flex items-start justify-between">
                    <p className="text-sm break-words flex-1 pr-4 min-w-0 text-gray-800">
                      <span className="font-semibold cursor-pointer text-[#5A0395]" onClick={() => handleUserClick(post.username)}>
                        {post.username}
                      </span>{" "}
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 text-gray-600 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleLike(post.post_id)} className={`w-auto h-auto p-1 hover:bg-purple-100 ${likedPosts.includes(post.post_id) ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`}>
                        <ThumbsUp className={`w-5 h-5 ${likedPosts.includes(post.post_id) ? "fill-current" : ""}`} />
                        <span className="text-sm ml-1">{post.like_count}</span>
                      </Button>
                      <Button variant="ghost" size="icon" className={`w-auto h-auto p-1 hover:bg-purple-100 relative ${openCommentPostId === post.post_id ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`} onClick={() => toggleComments(post.post_id)}>
                        <MessageCircle className="w-5 h-5" />
                        {post.comment_count > 0 && <span className="absolute -top-1 -right-1 bg-[#5A0395] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{post.comment_count}</span>}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleSave(post.post_id)} className={`w-auto h-auto p-1 hover:bg-purple-100 ${savedPosts.includes(post.post_id) ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`}>
                        <Bookmark className={`w-5 h-5 ${savedPosts.includes(post.post_id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="border-t pt-3 border-purple-200">
                      <p className="font-semibold text-sm mb-1 text-[#1D0C69]">#Hashtags:</p>
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.map((tag, idx) => {
                          const tagText = typeof tag === 'object' ? tag.hashtag_text : tag;
                          return (
                            <span key={idx} className="text-sm text-[#5A0395] hover:underline cursor-pointer font-medium" onClick={() => handleHashtagClick(tagText)}>
                              #{tagText}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-600">{formatTimeAgo(post.created_at)}</p>
                </div>

                {/* Comments */}
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