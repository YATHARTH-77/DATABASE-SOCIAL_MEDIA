import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Grid, Loader2 } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:5000";

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Logged in user ---
  const [user, setUser] = useState(null);

  // --- Profile Data State ---
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // --- UI State ---
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]); // Mocked, needs API
  const [savedPosts, setSavedPosts] = useState([]); // Mocked, needs API
  const [modalType, setModalType] = useState(null);

  // --- 1. Get Logged-in User ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login"); // Not logged in, redirect
    }
  }, [navigate]);

  // --- 2. Fetch Profile Data (for the user in URL) ---
  useEffect(() => {
    if (!user || !username) return; // Wait for logged-in user and URL param

    // Don't reload if viewing own profile (redirect to /profile)
    if (user.username === username) {
      navigate("/profile");
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/profile/${username}?loggedInUserId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setProfileData(data.user);
          setPosts(data.posts);
          // Note: Saved posts are private, so we don't get them here.
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: err.message, variant: "destructive" });
        if (err.message === "User not found") {
          navigate("/home"); // or a 404 page
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, username, navigate, toast]);

  // --- 3. Fetch Followers/Following (on demand) ---
  const openFollowModal = async (type) => {
    if (!profileData) return;
    setModalType(type);
    
    // Clear old data
    if (type === 'followers') setFollowers([]);
    else setFollowing([]);
    
    const endpoint = type === 'followers' ? 'followers' : 'following';
    try {
      const res = await fetch(`${API_URL}/api/profile/${profileData.user_id}/${endpoint}`);
      const data = await res.json();
      if (data.success) {
        if (type === 'followers') setFollowers(data.followers);
        if (type === 'following') setFollowing(data.following);
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}`, err);
    }
  };
  
  // --- 4. Action Handlers ---

  const handleFollowToggle = async () => {
    if (!user || !profileData) return;
    
    const isCurrentlyFollowing = profileData.isFollowing;

    // Optimistic Update
    setProfileData(prev => ({
      ...prev,
      isFollowing: !isCurrentlyFollowing,
      follower_count: isCurrentlyFollowing ? prev.follower_count - 1 : prev.follower_count + 1
    }));

    try {
      const res = await fetch(`${API_URL}/api/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: user.id, followingId: profileData.user_id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err) {
      // Revert on error
      setProfileData(prev => ({
        ...prev,
        isFollowing: isCurrentlyFollowing,
        follower_count: isCurrentlyFollowing ? prev.follower_count + 1 : prev.follower_count - 1
      }));
      toast({ title: "Error", description: "Failed to follow/unfollow", variant: "destructive" });
    }
  };
  
  // These need to be implemented fully if you want to like/save from this page
  const handleLike = (postId) => { /* ... API call to /api/posts/like ... */ };
  const handleSave = (postId) => { /* ... API call to /api/posts/save ... */ };

  const handleUserClick = (navUsername) => {
    if (navUsername && username && navUsername.toLowerCase() !== username.toLowerCase()) {
      setModalType(null); // Close modal
      navigate(`/user/${navUsername}`);
    }
  };

  useEffect(() => {
    if (selectedPost || modalType) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedPost, modalType]);

  // --- 5. Render ---
  
  if (isLoading || !profileData) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
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
          isLiked={likedPosts.includes(selectedPost.post_id)}
          isSaved={savedPosts.includes(selectedPost.post_id)}
          onLike={() => handleLike(selectedPost.post_id)}
          onSave={() => handleSave(selectedPost.post_id)}
        />
      )}

      {modalType && (
        <FollowerModal
          type={modalType}
          users={modalType === "followers" ? followers : following}
          onClose={() => setModalType(null)}
          onRemoveFollower={() => {}} // Not own profile
          onUnfollow={() => {}}      // Not own profile
          onUserClick={handleUserClick}
          isOwnProfile={false} // This hides remove/unfollow buttons
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
                <AvatarImage src={profileData.profile_pic_url ? `${API_URL}${profileData.profile_pic_url}` : ''} />
                <AvatarFallback className="gradient-primary text-white text-3xl">
                  {profileData.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left w-full">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{profileData.username}</h1>
                <div className="flex justify-center sm:justify-start gap-4 sm:gap-8 text-sm mb-4">
                  <div>
                    <span className="font-bold text-md sm:text-lg">{profileData.post_count}</span>{" "}
                    <span className="text-muted-foreground">posts</span>
                  </div>
                  <button onClick={() => openFollowModal("followers")} className="hover:bg-muted/80 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    <span className="font-bold text-md sm:text-lg">{profileData.follower_count}</span>{" "}
                    <span className="text-muted-foreground hover:text-foreground transition-colors">followers</span>
                  </button>
                  <button onClick={() => openFollowModal("following")} className="hover:bg-muted/80 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    <span className="font-bold text-md sm:text-lg">{profileData.following_count}</span>{" "}
                    <span className="text-muted-foreground hover:text-foreground transition-colors">following</span>
                  </button>
                </div>
                <Button
                  onClick={handleFollowToggle}
                  variant={profileData.isFollowing ? "outline" : "default"}
                  className={!profileData.isFollowing ? "gradient-primary text-white" : ""}
                >
                  {profileData.isFollowing ? "Unfollow" : "Follow"}
                </Button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-xl">
              <p className="font-semibold mb-1">{profileData.full_name}</p>
              <p className="text-sm text-muted-foreground break-words">{profileData.bio || "No bio available."}</p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Grid className="w-4 h-4 mr-2" /> Posts
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {posts.map((post) => (
                  <div
                    key={post.post_id}
                    onClick={() => setSelectedPost({ ...post, username: profileData.username })}
                    className="aspect-square bg-muted rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md relative group"
                  >
                    {post.media_url ? (
                      <img src={`${API_URL}${post.media_url}`} alt={post.caption || 'post'} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <span className="text-muted-foreground">No Media</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <p className="text-white text-sm font-semibold">View Post</p>
                    </div>
                  </div>
                ))}
              </div>
              {posts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}