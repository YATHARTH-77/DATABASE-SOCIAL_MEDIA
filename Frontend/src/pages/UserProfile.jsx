import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";

const mockUsers = {
  adventurer: { displayName: "Adventure Seeker", bio: "Exploring the world one trail at a time 🌲🏔️", posts: 42, followers: 1234, following: 567, postCount: 6 },
  foodie: { displayName: "Food Lover", bio: "Home chef | Recipe creator | Food photography 🍝✨", posts: 89, followers: 3421, following: 234, postCount: 8 },
  photographer_pro: { displayName: "Pro Photographer", bio: "Professional photographer | Available for bookings 📸", posts: 156, followers: 12500, following: 89, postCount: 9 },
  tech_guru: { displayName: "Tech Enthusiast", bio: "Tech reviews & tutorials | DM for collabs 💻", posts: 234, followers: 8200, following: 456, postCount: 12 },
  artist_life: { displayName: "Digital Artist", bio: "Creating art daily | Commissions open 🎨", posts: 301, followers: 15800, following: 123, postCount: 15 },
};

const mockPosts = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, username: "Username", avatar: "", caption: `This is post number ${i + 1}. Here's some amazing content!`, hashtags: ["#sample", "#post"], gradient: `from-${["sky", "blue", "cyan", "indigo", "teal", "blue", "sky", "blue", "cyan", "indigo", "teal", "blue", "sky", "blue", "cyan"][i]}-400 via-green-400 to-yellow-400`, comments: [] }));

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);
  
  // --- MODIFICATION START: Added state and handlers for like/save ---
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);

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
  // --- MODIFICATION END ---
  
  const user = mockUsers[username?.toLowerCase()];

  const handleUserClick = (username) => {
    if (username && user && username.toLowerCase() !== user.username.toLowerCase()) {
       navigate(`/user/${username}`);
    }
  };

  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost]);

  if (!user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">User not found</h1>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUserClick={handleUserClick}
          // --- MODIFICATION START: Pass new props to the modal ---
          variant="viewer"
          isLiked={likedPosts.includes(selectedPost.id)}
          isSaved={savedPosts.includes(selectedPost.id)}
          onLike={() => handleLike(selectedPost.id)}
          onSave={() => handleSave(selectedPost.id)}
          // --- MODIFICATION END ---
        />
      )}
      
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Card className="p-4 sm:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
              <Avatar className="w-24 h-24 flex-shrink-0">
                <AvatarFallback className="gradient-primary text-white text-3xl">
                  {username?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left w-full">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{username}</h1>
                <div className="flex justify-center sm:justify-start gap-4 sm:gap-8 text-sm mb-4">
                  <div><span className="font-bold text-md sm:text-lg">{user.posts}</span>{" "}<span className="text-muted-foreground">posts</span></div>
                  <div><span className="font-bold text-md sm:text-lg">{user.followers}</span>{" "}<span className="text-muted-foreground">followers</span></div>
                  <div><span className="font-bold text-md sm:text-lg">{user.following}</span>{" "}<span className="text-muted-foreground">following</span></div>
                </div>
                <Button className="gradient-primary text-white">Follow</Button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-xl">
              <p className="font-semibold mb-1">{user.displayName}</p>
              <p className="text-sm text-muted-foreground break-words">{user.bio}</p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-bold mb-4">Posts</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {mockPosts.slice(0, user.postCount).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost({ ...post, username })}
                    className={`aspect-square bg-gradient-to-br ${post.gradient} rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md relative group`}
                  >
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <p className="text-white text-sm font-semibold">View Post</p>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}