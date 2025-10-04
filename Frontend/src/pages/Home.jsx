import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import { StoryViewer } from "@/components/StoryViewer";

const moments = [
  { id: 1, username: "User1", color: "bg-gradient-to-br from-purple-400 to-pink-400", timestamp: "2h ago", views: 45, isOwn: true },
  { id: 2, username: "User2", color: "bg-gradient-to-br from-blue-400 to-cyan-400", timestamp: "5h ago", views: 23 },
  { id: 3, username: "User3", color: "bg-gradient-to-br from-green-400 to-emerald-400", timestamp: "8h ago", views: 67 },
  { id: 4, username: "User4", color: "bg-gradient-to-br from-orange-400 to-red-400", timestamp: "12h ago", views: 89 },
  { id: 5, username: "User5", color: "bg-gradient-to-br from-yellow-400 to-amber-400", timestamp: "1d ago", views: 34 },
];

const posts = [
  {
    id: 1,
    username: "adventurer",
    avatar: "",
    time: "2h ago",
    caption: "Just discovered this amazing trail! Nature never disappoints 🌲✨",
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

export default function Home() {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState([]);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const handleLike = (postId) => {
    setLikedPosts((prev) =>
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
      
      <main className="ml-48 flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-secondary/10 backdrop-blur-sm rounded-2xl p-6 border border-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold gradient-primary px-4 py-1 rounded-full inline-block">
                MOMENTS
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {moments.map((moment, index) => (
                <div key={moment.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full ${moment.color} p-1 cursor-pointer hover:scale-105 transition-transform`}
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
              <Card key={post.id} className="overflow-hidden shadow-lg">
                <div className="flex items-center justify-between p-4">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar>
                      <AvatarImage src={post.avatar} />
                      <AvatarFallback className="gradient-primary text-white">
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.username}</p>
                      <p className="text-xs text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>

                <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 aspect-square flex items-center justify-center">
                  <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleLike(post.id)}
                      className={likedPosts.includes(post.id) ? "text-red-500" : "hover:text-red-500"}
                    >
                      <Heart className={`w-6 h-6 ${likedPosts.includes(post.id) ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-primary">
                      <MessageCircle className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="ml-auto hover:text-accent">
                      <Bookmark className="w-6 h-6" />
                    </Button>
                  </div>

                  <div>
                    <p className="font-semibold text-sm">
                      {(post.likes + (likedPosts.includes(post.id) ? 1 : 0)).toLocaleString()} likes
                    </p>
                    <p className="text-sm mt-1">
                      <span 
                        className="font-semibold cursor-pointer hover:opacity-80"
                        onClick={() => handleUserClick(post.username)}
                      >
                        {post.username}
                      </span> {post.caption}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-sm text-primary hover:underline cursor-pointer"
                          onClick={() => handleHashtagClick(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="text-sm text-muted-foreground mt-2 hover:underline">
                      View all {post.comments} comments
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
