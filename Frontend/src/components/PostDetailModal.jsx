import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Loader2, X, ArrowLeft, ThumbsUp, Bookmark, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Base URL ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper: Format timestamp
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
  const seconds = Math.floor((now - date) / 1000);
  
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

export function PostDetailModal({
  post,
  onClose,
  onUserClick,
  variant = "viewer", // "viewer" = other user, "owner" = me
  onDelete,
  isSavedPostView = false,
}) {
  const [comments, setComments] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);

  // Use local state for post data so we can update Likes/Saves instantly
  const [postData, setPostData] = useState(post);
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  // 1. Get Current User
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  // 2. Fetch Fresh Post Data (Likes, Saved Status) & Comments
  useEffect(() => {
    if (!post.post_id) return;
    
    // We need currentUser to know if *they* liked the post
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    const fetchData = async () => {
      setIsLoadingPost(true);
      setIsLoadingComments(true);
      try {
        // Fetch Post Details
        const postRes = await fetch(`${API_URL}/api/posts/${post.post_id}?loggedInUserId=${userId}`);
        if (postRes.ok) {
           const postJson = await postRes.json();
           if (postJson.success) setPostData(postJson.post);
        }

        // Fetch Comments
        const commentsRes = await fetch(`${API_URL}/api/posts/${post.post_id}/comments`);
        const commentsJson = await commentsRes.json();
        if (commentsJson.success) {
          setComments(commentsJson.comments);
        }
      } catch (err) {
        console.error("Failed to fetch details", err);
      } finally {
        setIsLoadingPost(false);
        setIsLoadingComments(false);
      }
    };
    
    fetchData();
  }, [post.post_id]);

  // 3. Handle INTERNAL Like (Updates Modal UI immediately)
  const handleLikeInternal = async () => {
     if (!currentUser) return;
     const isLiked = postData.user_has_liked;
     
     // Optimistic Update
     setPostData(prev => ({
         ...prev,
         user_has_liked: !isLiked,
         like_count: isLiked ? prev.like_count - 1 : prev.like_count + 1
     }));

     try {
        await fetch(`${API_URL}/api/posts/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, postId: postData.post_id })
        });
     } catch (err) {
         console.error("Like failed");
     }
  };

  // 4. Handle INTERNAL Save
  const handleSaveInternal = async () => {
     if (!currentUser) return;
     const isSaved = postData.user_has_saved;

     setPostData(prev => ({ ...prev, user_has_saved: !isSaved }));

     try {
        await fetch(`${API_URL}/api/posts/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, postId: postData.post_id })
        });
     } catch (err) {
         console.error("Save failed");
     }
  };

  // 5. Handle Add Comment
  const handleAddComment = async (e) => {
    if (e.key !== "Enter") return;
    const commentText = e.target.value.trim();
    if (!commentText || !currentUser) return;

    try {
      const res = await fetch(
        `${API_URL}/api/posts/${post.post_id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, commentText }),
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [...prev, data.comment]);
        e.target.value = "";
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // 6. Handle Delete Post
  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_URL}/api/posts/${postData.post_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");
      const data = await res.json();

      if (data.success) {
        toast({ title: "Deleted", description: "Post deleted successfully." });
        if (onDelete) onDelete(postData.post_id);
        onClose();
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not delete post.", variant: "destructive" });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md md:max-w-5xl h-[85vh] md:h-[80vh] bg-background rounded-xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Left: Image/Media --- */}
        <div className="w-full md:w-[60%] bg-black flex items-center justify-center relative h-64 md:h-full">
          {postData.media_url ? (
            postData.media_type?.startsWith("video") ||
            postData.media_url.endsWith(".mp4") ? (
              <video src={postData.media_url} controls className="w-full h-full object-contain" />
            ) : (
              <img src={postData.media_url} alt="Post Content" className="w-full h-full object-contain" />
            )
          ) : (
            <div className="text-gray-500">No Media Available</div>
          )}
        </div>

        {/* --- Right: Details & Comments --- */}
        <div className="w-full md:w-[40%] flex flex-col h-full bg-white">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="mr-1 text-gray-600 hover:text-[#1D0C69]">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => { onUserClick(postData.username); onClose(); }}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={postData.profile_pic_url || postData.avatar} />
                  <AvatarFallback>{postData.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm text-[#1D0C69]">{postData.username}</span>
              </div>
            </div>

            {/* Delete Menu (Owner Only) */}
            {variant === "owner" && !isSavedPostView && (
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setShowMenu(!showMenu)}>
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-50">
                    <button onClick={handleDeletePost} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption */}
            {postData.caption && (
              <div className="flex gap-3 mb-4 border-b pb-4 border-gray-100">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={postData.profile_pic_url || postData.avatar} />
                  <AvatarFallback>{postData.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <span className="font-semibold mr-2 text-[#1D0C69]">{postData.username}</span>
                  <span className="text-gray-800">{postData.caption}</span>
                  <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(postData.created_at)}</div>
                </div>
              </div>
            )}

            {/* Comments */}
            {isLoadingComments ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin w-6 h-6 text-gray-400" /></div>
            ) : (
              <div className="space-y-4">
                {comments.length === 0 && <p className="text-center text-gray-400 text-sm mt-4">No comments yet.</p>}
                {comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0 cursor-pointer" onClick={() => { onUserClick(comment.username); onClose(); }}>
                      <AvatarImage src={comment.profile_pic_url} />
                      <AvatarFallback>{comment.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <span className="font-semibold mr-2 cursor-pointer hover:underline text-[#5A0395]" onClick={() => { onUserClick(comment.username); onClose(); }}>
                        {comment.username || "Unknown"}
                      </span>
                      <span className="text-gray-800">{comment.comment_text || comment.text}</span>
                      <div className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(comment.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-white shrink-0">
            
            {/* ⭐️ ACTION BUTTONS (Only for Viewer - Hidden for Owner) ⭐️ */}
            {variant === "viewer" && (
               <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleLikeInternal} 
                        className={`hover:bg-purple-50 ${postData.user_has_liked ? "text-[#5A0395]" : "text-gray-600"}`}
                    >
                        <ThumbsUp className={`w-6 h-6 ${postData.user_has_liked ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-purple-50">
                        <MessageCircle className="w-6 h-6" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSaveInternal}
                    className={`hover:bg-purple-50 ${postData.user_has_saved ? "text-[#5A0395]" : "text-gray-600"}`}
                  >
                    <Bookmark className={`w-6 h-6 ${postData.user_has_saved ? "fill-current" : ""}`} />
                  </Button>
               </div>
            )}

            <div className="font-bold text-sm mb-2 text-[#1D0C69]">
              {postData.like_count || 0} likes
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 text-sm border rounded-full px-4 py-2 focus:outline-none focus:border-[#5A0395]"
                placeholder="Add a comment..."
                onKeyDown={handleAddComment}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-[#5A0395] font-semibold hover:bg-transparent px-2"
                onClick={(e) => {
                  const input = e.target.previousSibling;
                  if (input.value) handleAddComment({ key: "Enter", target: input });
                }}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}