import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { navItems } from "@/components/Sidebar";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, ThumbsUp } from "lucide-react";
import { StoryViewer } from "@/components/StoryViewer";
import { CommentSection } from "@/components/CommentSection";

const moments = [
  { id: 1, username: "User1", color: "bg-gradient-to-br from-sky-400 via-green-400 to-yellow-400", timestamp: "2h ago", views: 45, isOwn: true },
  { id: 2, username: "User2", color: "bg-gradient-to-br from-blue-400 via-emerald-400 to-amber-400", timestamp: "5h ago", views: 23 },
  { id: 3, username: "User3", color: "bg-gradient-to-br from-cyan-400 via-lime-400 to-gold-400", timestamp: "8h ago", views: 67 },
  { id: 4, username: "User4", color: "bg-gradient-to-br from-indigo-400 via-green-400 to-yellow-400", timestamp: "12h ago", views: 89 },
  { id: 5, username: "User5", color: "bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500", timestamp: "1d ago", views: 34 },
];

const posts = [
  {
    id: 1,
    username: "adventurer_with_a_very_long_name",
    avatar: "",
    time: "2h ago",
    caption: "Just discovered this amazing trail! Nature never disappoints 🌲✨ What an absolutelystunningviewfromthetop!kvbhjvhjvjhvhjvhhvhhhh\nygygygiugiug\niugiu",
    hashtags: ["#nature", "#hiking", "#adventure"],
    likes: 234,
    comments: 18,
  },
  {
    id: 2,
    username: "foodie",
    avatar: "",
    time: "5h ago",
    caption: "Homemade pasta perfection 🍝 Recipe in comments!",
    hashtags: ["#cooking", "#homemade", "#foodporn"],
    likes: 567,
    comments: 42,
  },
];

// Initial sample comments data
const initialComments = {
  1: [
    {
      id: 1,
      username: "nature_lover",
      avatar: "",
      text: "Wow! This looks absolutely stunning! Which trail is this?",
      timestamp: "1h ago"
    },
    {
      id: 2,
      username: "hiker_pro",
      avatar: "",
      text: "Amazing view! I need to add this to my bucket list 🏔️",
      timestamp: "45m ago"
    }
  ],
  2: [
    {
      id: 1,
      username: "pasta_enthusiast",
      avatar: "",
      text: "This looks delicious! What type of pasta did you use?",
      timestamp: "3h ago"
    },
    {
      id: 2,
      username: "chef_mike",
      avatar: "",
      text: "Perfect al dente! Share the recipe please! 😍",
      timestamp: "2h ago"
    },
    {
      id: 3,
      username: "foodie_sam",
      avatar: "",
      text: "I'm drooling! Making this tonight for sure",
      timestamp: "1h ago"
    }
  ]
};

export default function Home() {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [commentsData, setCommentsData] = useState(initialComments);

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

  const handleMomentClick = (index) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleHashtagClick = (tag) => {
    navigate(`/hashtag/${tag.slice(1)}`);
  };

  const toggleComments = (postId) => {
    setOpenCommentPostId(openCommentPostId === postId ? null : postId);
  };

  const handleAddComment = (postId, commentText) => {
    const newComment = {
      id: Date.now(),
      username: "current_user", // In real app, this would be the logged-in user
      avatar: "",
      text: commentText,
      timestamp: "Just now"
    };

    setCommentsData((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
  };

  const getCommentCount = (postId) => {
    return commentsData[postId]?.length || 0;
  };

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
          <div className="bg-secondary/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold gradient-primary px-4 py-1 rounded-full inline-block">
                MOMENTS
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
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
              {moments.map((moment, index) => (
                <div key={moment.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full ${moment.color} p-1 cursor-pointer transition-shadow hover:shadow-xl`}
                    onClick={() => handleMomentClick(index)}
                  >
                    <div className="w-full h-full rounded-full bg-background" />
                  </div>
                  <span className="text-xs text-muted-foreground">{moment.username}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold gradient-primary px-4 py-1 rounded-full inline-block">
              FEED
            </h2>

            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden shadow-lg border">
                {/* Header (Username & Avatar) */}
                <div className="flex items-center justify-between p-3 bg-yellow-300/80 border-b border-yellow-400">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 min-w-0"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.avatar} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-blue-800">{post.username}</p>
                    </div>
                  </div>
                </div>

                {/* Media Section */}
                <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 aspect-square flex items-center justify-center border-b">
                  <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
                </div>

                {/* Caption, Actions, Hashtags */}
                <div className="p-4 space-y-3 bg-gray-100">
                  {/* Caption and Actions */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm break-words flex-1 pr-4">
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

                  {/* Hashtags */}
                  <div className="border-t pt-3 mt-3">
                    <p className="font-semibold text-sm mb-1 text-gray-700">#Hashtags:</p>
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-sm text-blue-600 hover:underline cursor-pointer"
                          onClick={() => handleHashtagClick(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment Section - Inline */}
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}