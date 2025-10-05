import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Bookmark, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { CommentSection } from "@/components/CommentSection";

const hashtagPostsData = {
  nature: [
    { id: 1, username: "adventurer", avatar: "", time: "2h ago", caption: "Just discovered this amazing trail! Nature never disappoints 🌲✨", hashtags: ["#nature", "#hiking", "#adventure"], likes: 234, comments: 18 },
    { id: 3, username: "explorer_jane", avatar: "", time: "1d ago", caption: "Mountain peaks at sunrise. Absolutely breathtaking! 🏔️", hashtags: ["#nature", "#mountains", "#sunrise"], likes: 892, comments: 45 },
  ],
  foodie: [
    { id: 2, username: "foodie", avatar: "", time: "5h ago", caption: "Homemade pasta perfection 🍝 Recipe in comments!", hashtags: ["#foodie", "#cooking", "#homemade"], likes: 567, comments: 42 },
  ],
  travel: [
    { id: 4, username: "wanderlust_soul", avatar: "", time: "3h ago", caption: "Hidden gems of Santorini ✨🇬🇷", hashtags: ["#travel", "#greece", "#santorini"], likes: 1203, comments: 67 },
  ],
  fitness: [
    { id: 5, username: "fit_lifestyle", avatar: "", time: "6h ago", caption: "Morning workout complete! 💪 Let's crush this day!", hashtags: ["#fitness", "#workout", "#motivation"], likes: 445, comments: 23 },
  ],
};

// Mock comments for the posts on this page
const initialComments = {
  1: [{ id: 1, username: "nature_lover", avatar: "", text: "Stunning view!", timestamp: "1h ago" }],
  3: [{ id: 1, username: "sunrise_chaser", avatar: "", text: "Worth the early morning hike!", timestamp: "12h ago" }],
  2: [{ id: 1, username: "pasta_fan", avatar: "", text: "Recipe please!", timestamp: "2h ago" }],
  4: [{ id: 1, username: "travel_bug", avatar: "", text: "I miss Greece!", timestamp: "1h ago" }],
  5: [{ id: 1, username: "gym_rat", avatar: "", text: "Get it!", timestamp: "3h ago" }],
};

export default function HashtagPosts() {
  const { tag } = useParams();
  const navigate = useNavigate();

  // --- MODIFICATION: Added state to support new post features ---
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentsData, setCommentsData] = useState(initialComments);

  const posts = hashtagPostsData[tag?.toLowerCase()] || [];

  const handleLike = (postId) => {
    setLikedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleSave = (postId) => {
    setSavedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const toggleComments = (postId) => {
    setOpenCommentPostId(openCommentPostId === postId ? null : postId);
  };

  const handleAddComment = (postId, commentText) => {
    const newComment = { id: Date.now(), username: "current_user", avatar: "", text: commentText, timestamp: "Just now" };
    setCommentsData((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));
  };

  const getCommentCount = (postId) => {
    return commentsData[postId]?.length || 0;
  };
  // --- END MODIFICATION ---

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* --- MODIFICATION: Made main container responsive --- */}
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
              // --- MODIFICATION: Replaced post card with the design from Home.jsx ---
              <Card key={post.id} className="overflow-hidden shadow-lg border">
                <div className="flex items-center justify-between p-3 bg-yellow-300/80 border-b border-yellow-400">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 min-w-0"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-blue-800">{post.username}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 aspect-square flex items-center justify-center border-b">
                  <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
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
                        onClick={() => handleLike(post.id)}
                        className={`w-auto h-auto p-1 ${likedPosts.includes(post.id) ? "text-blue-500" : "hover:text-blue-500"}`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${likedPosts.includes(post.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-auto h-auto p-1 relative ${openCommentPostId === post.id ? "text-blue-500" : "hover:text-blue-500"}`}
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageCircle className="w-5 h-5" />
                        {getCommentCount(post.id) > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {getCommentCount(post.id)}
                          </span>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSave(post.id)}
                        className={`w-auto h-auto p-1 ${savedPosts.includes(post.id) ? "text-blue-500" : "hover:text-blue-500"}`}
                      >
                        <Bookmark className={`w-5 h-5 ${savedPosts.includes(post.id) ? "fill-current" : ""}`} />
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
                          onClick={() => navigate(`/hashtag/${hashtag.slice(1)}`)}
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {openCommentPostId === post.id && (
                  <CommentSection
                    postId={post.id}
                    comments={commentsData[post.id] || []}
                    onAddComment={handleAddComment}
                    onClose={() => setOpenCommentPostId(null)}
                    onUserClick={(username) => navigate(`/user/${username}`)}
                  />
                )}
              </Card>
              // --- END MODIFICATION ---
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}