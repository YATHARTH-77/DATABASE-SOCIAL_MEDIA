import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const hashtagPosts = {
  nature: [
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
      id: 3,
      username: "explorer_jane",
      avatar: "",
      time: "1d ago",
      caption: "Mountain peaks at sunrise. Absolutely breathtaking! 🏔️",
      hashtags: ["#nature", "#mountains", "#sunrise"],
      likes: 892,
      comments: 45,
    },
  ],
  foodie: [
    {
      id: 2,
      username: "foodie",
      avatar: "",
      time: "5h ago",
      caption: "Homemade pasta perfection 🍝 Recipe in comments!",
      hashtags: ["#foodie", "#cooking", "#homemade"],
      likes: 567,
      comments: 42,
    },
  ],
  travel: [
    {
      id: 4,
      username: "wanderlust_soul",
      avatar: "",
      time: "3h ago",
      caption: "Hidden gems of Santorini ✨🇬🇷",
      hashtags: ["#travel", "#greece", "#santorini"],
      likes: 1203,
      comments: 67,
    },
  ],
  fitness: [
    {
      id: 5,
      username: "fit_lifestyle",
      avatar: "",
      time: "6h ago",
      caption: "Morning workout complete! 💪 Let's crush this day!",
      hashtags: ["#fitness", "#workout", "#motivation"],
      likes: 445,
      comments: 23,
    },
  ],
};

export default function HashtagPosts() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState([]);

  const posts = hashtagPosts[tag?.toLowerCase()] || [];

  const handleLike = (postId) => {
    setLikedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-48 flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold gradient-primary">#{tag}</h1>
          </div>

          <p className="text-muted-foreground ml-14">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>

          <div className="space-y-6 ml-14">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden shadow-lg">
                <div className="flex items-center justify-between p-4">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => handleUserClick(post.username)}
                  >
                    <Avatar>
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
                      className={likedPosts.includes(post.id) ? "text-red-500" : ""}
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
                      {post.likes + (likedPosts.includes(post.id) ? 1 : 0)} likes
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-semibold">{post.username}</span> {post.caption}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.hashtags.map((hashtag, idx) => (
                        <span
                          key={idx}
                          className="text-sm text-primary hover:underline cursor-pointer"
                          onClick={() => navigate(`/hashtag/${hashtag.slice(1)}`)}
                        >
                          {hashtag}
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
