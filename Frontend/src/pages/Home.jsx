import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, ThumbsUp } from "lucide-react"; // Import ThumbsUp
import { StoryViewer } from "@/components/StoryViewer";

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
      
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-secondary/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-secondary/20">
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
              <Card key={post.id} className="overflow-hidden shadow-lg border">
                {/* Header (Username & Avatar) - Styled to match image */}
                <div className="flex items-center justify-between p-3 bg-yellow-300/80 border-b border-yellow-400"> {/* Added background and border */}
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 min-w-0"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar className="w-8 h-8"> {/* Smaller avatar */}
                      <AvatarImage src={post.avatar} />
                      <AvatarFallback className="bg-blue-500 text-white"> {/* Blue icon color */}
                        {/* You can use a specific icon here if desired, e.g., <User /> */}
                        {post.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-blue-800">{post.username}</p> {/* Blue text */}
                      {/* Removed time here as per image */}
                    </div>
                  </div>
                  {/* Removed MoreHorizontal button as per image */}
                </div>

                {/* Media Section */}
                <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 aspect-square flex items-center justify-center border-b"> {/* Added border-b */}
                  <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
                </div>

                {/* New layout for Caption, Actions, Hashtags */}
                <div className="p-4 space-y-3 bg-gray-100"> {/* Gray background for this section */}
                  {/* Caption and Actions */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm break-words flex-1 pr-4"> {/* Caption on left, actions on right */}
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 text-gray-600 flex-shrink-0"> {/* Action buttons */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(post.id)}
                        className={`w-auto h-auto p-1 ${likedPosts.includes(post.id) ? "text-blue-500" : "hover:text-blue-500"}`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${likedPosts.includes(post.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-auto h-auto p-1 hover:text-blue-500">
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-auto h-auto p-1 hover:text-blue-500">
                        <Bookmark className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div className="border-t pt-3 mt-3"> {/* Separator line and top padding */}
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
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}