import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";

const mockFollowers = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, username: `follower_${i + 1}`, displayName: `Follower ${i + 1}`, avatar: "" }));
const mockFollowing = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, username: `following_${i + 1}`, displayName: `Following ${i + 1}`, avatar: "" }));

const mockUsers = {
  adventurer: { displayName: "Adventure Seeker", bio: "Exploring the world one trail at a time 🌲🏔️", posts: 42, followers: mockFollowers.slice(0, 10), following: mockFollowing.slice(0, 5), postCount: 6 },
  foodie: { displayName: "Food Lover", bio: "Home chef | Recipe creator | Food photography 🍝✨", posts: 89, followers: mockFollowers.slice(0, 8), following: mockFollowing.slice(0, 12), postCount: 8 },
  photographer_pro: { displayName: "Pro Photographer", bio: "Professional photographer | Available for bookings 📸", posts: 156, followers: mockFollowers.slice(0, 15), following: mockFollowing.slice(0, 2), postCount: 9 },
  tech_guru: { displayName: "Tech Enthusiast", bio: "Tech reviews & tutorials | DM for collabs 💻", posts: 234, followers: mockFollowers.slice(0, 7), following: mockFollowing.slice(0, 7), postCount: 12 },
  artist_life: { displayName: "Digital Artist", bio: "Creating art daily | Commissions open 🎨", posts: 301, followers: mockFollowers.slice(0, 11), following: mockFollowing.slice(0, 9), postCount: 15 },
};

const mockPosts = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, username: "Username", avatar: "", caption: `This is post number ${i + 1}. Here's some amazing content!`, hashtags: ["#sample", "#post"], gradient: `from-${["sky", "blue", "cyan", "indigo", "teal", "blue", "sky", "blue", "cyan", "indigo", "teal", "blue", "sky", "blue", "cyan"][i]}-400 via-green-400 to-yellow-400`, comments: [] }));

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [modalType, setModalType] = useState(null);
  
  const user = mockUsers[username?.toLowerCase()];

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(user ? user.followers.length : 0);

  // --- MODIFICATION START: Added useEffect to reset state when username changes ---
  useEffect(() => {
    // This effect runs when the component mounts AND whenever the `username` in the URL changes.
    // This ensures the follow status and count are fresh for the user being viewed.
    const currentUser = mockUsers[username?.toLowerCase()];
    if (currentUser) {
      setIsFollowing(false); // Reset follow state for the new user
      setFollowerCount(currentUser.followers.length); // Reset follower count
    }
  }, [username]);
  // --- MODIFICATION END ---

  const handleFollowToggle = () => {
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    setFollowerCount(currentCount => newFollowingState ? currentCount + 1 : currentCount - 1);
    // In a real app, you would make an API call here.
  };

  const handleLike = (postId) => { /* ... */ };
  const handleSave = (postId) => { /* ... */ };

  const handleUserClick = (navUsername) => {
    if (navUsername && username && navUsername.toLowerCase() !== username.toLowerCase()) {
       navigate(`/user/${navUsername}`);
    }
  };

  useEffect(() => {
    if (selectedPost || modalType) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost, modalType]);

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
          variant="viewer"
          isLiked={likedPosts.includes(selectedPost.id)}
          isSaved={savedPosts.includes(selectedPost.id)}
          onLike={() => handleLike(selectedPost.id)}
          onSave={() => handleSave(selectedPost.id)}
        />
      )}

      {modalType && (
        <FollowerModal
          type={modalType}
          users={modalType === "followers" ? user.followers : user.following}
          onClose={() => setModalType(null)}
          onRemoveFollower={() => {}}
          onUnfollow={() => {}}
          onUserClick={handleUserClick}
          isOwnProfile={false}
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
                  
                  <button onClick={() => setModalType("followers")} className="hover:bg-muted/80 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    <span className="font-bold text-md sm:text-lg">{followerCount}</span>{" "}
                    <span className="text-muted-foreground hover:text-foreground transition-colors">followers</span>
                  </button>
                  <button onClick={() => setModalType("following")} className="hover:bg-muted/80 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    <span className="font-bold text-md sm:text-lg">{user.following.length}</span>{" "}
                    <span className="text-muted-foreground hover:text-foreground transition-colors">following</span>
                  </button>
                </div>
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing ? "outline" : "default"}
                  className={!isFollowing ? "gradient-primary text-white" : ""}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
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