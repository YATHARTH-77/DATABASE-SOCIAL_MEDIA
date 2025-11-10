import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Grid, Bookmark, UserPen, LogOut, Trash2, Loader2 } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:5000";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Logged in user ---
  const [user, setUser] = useState(null);

  // --- Profile Data State ---
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  
  // --- UI State ---
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  // --- 1. Get Logged-in User ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login"); // Not logged in, redirect
    }
  }, [navigate]);

  // --- 2. Fetch All Profile Data ---
  useEffect(() => {
    if (!user) return; // Wait for user info

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/profile/${user.username}?loggedInUserId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setProfileData(data.user);
          setPosts(data.posts);
          setSavedPosts(data.savedPosts);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);
  
  // --- 3. Fetch Followers/Following (on demand) ---
  const openFollowModal = async (type) => {
    if (!user) return;
    setModalType(type);
    
    // Clear old data
    if (type === 'followers') setFollowers([]);
    else setFollowing([]);

    const endpoint = type === 'followers' ? 'followers' : 'following';
    try {
      const res = await fetch(`${API_URL}/api/profile/${user.id}/${endpoint}`);
      const data = await res.json();
      if (data.success) {
        if (type === 'followers') setFollowers(data.followers);
        if (type === 'following') setFollowing(data.following);
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}`, err);
    }
  };

  // --- 4. Modal/Settings Handlers ---

  const handleUserClick = (username) => {
    setModalType(null);
    // Don't navigate if clicking own username
    if (username === user.username) return; 
    navigate(`/user/${username}`);
  };

  const handleRemoveFollower = async (followerUserId) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/followers/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: followerUserId, followingId: user.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      // Optimistic update
      setFollowers(prev => prev.filter(u => u.user_id !== followerUserId));
      setProfileData(prev => ({ ...prev, follower_count: prev.follower_count - 1 }));
    } catch (err) {
      console.error("Failed to remove follower", err);
      toast({ title: "Error", description: "Failed to remove follower", variant: "destructive" });
    }
  };

  const handleUnfollow = async (followingUserId) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: user.id, followingId: followingUserId })
      });
      const data = await res.json();
      if (!data.success || data.action !== 'unfollowed') throw new Error(data.message);

      // Optimistic update
      setFollowing(prev => prev.filter(u => u.user_id !== followingUserId));
      setProfileData(prev => ({ ...prev, following_count: prev.following_count - 1 }));
    } catch (err) {
      console.error("Failed to unfollow", err);
      toast({ title: "Error", description: "Failed to unfollow", variant: "destructive" });
    }
  };

  const handleUnsavePost = async (postId) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, postId: postId })
      });
      const data = await res.json();
      if (!data.success || data.action !== 'unsaved') throw new Error(data.message);

      // Optimistic update
      setSavedPosts(prev => prev.filter(post => post.post_id !== postId));
      setSelectedPost(null); // Also close the modal
    } catch (err) {
      console.error("Failed to unsave post", err);
      toast({ title: "Error", description: "Failed to unsave post", variant: "destructive" });
    }
  };

  const handleEditProfile = () => {
    setShowSettingsMenu(false);
    // Navigate to the new Edit Profile page
    navigate("/profile/edit");
  };

  const handleLogout = () => {
    setShowSettingsMenu(false);
    localStorage.removeItem('user');
    toast({ title: "Logged Out", description: "You have been logged out." });
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setShowSettingsMenu(false);
    if (!user) return;
    
    if (window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.")) {
      try {
        const res = await fetch(`${API_URL}/api/profile/${user.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
          localStorage.removeItem('user');
          navigate("/login");
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error("Failed to delete account", err);
        toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    if (showSettingsMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (selectedPost || modalType) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
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
          variant="owner"
          isSavedPostView={selectedPost.isSavedView}
          isSaved={selectedPost.isSavedView} // Button is "saved" if it's from the saved tab
          onSave={() => handleUnsavePost(selectedPost.post_id)}
          // This modal will need to be updated to fetch full post details (likes, comments)
          // when opened, as the grid only has minimal info.
        />
      )}

      {modalType && (
        <FollowerModal
          type={modalType}
          users={modalType === "followers" ? followers : following}
          onClose={() => setModalType(null)}
          onRemoveFollower={handleRemoveFollower}
          onUnfollow={handleUnfollow}
          onUserClick={handleUserClick}
          isOwnProfile={true}
        />
      )}
      
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 sm:p-8 shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <Avatar className="w-24 h-24 flex-shrink-0">
                  <AvatarImage src={profileData.profile_pic_url ? `${API_URL}${profileData.profile_pic_url}` : ''} />
                  <AvatarFallback className="gradient-primary text-white text-3xl">
                    {profileData.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{profileData.username}</h1>
                  <div className="flex justify-center sm:justify-start gap-4 sm:gap-8 text-sm">
                    <div>
                      <span className="font-bold text-md sm:text-lg">{profileData.post_count}</span>{" "}
                      <span className="text-muted-foreground">posts</span>
                    </div>
                    <button 
                      onClick={() => openFollowModal("followers")}
                      className="hover:bg-muted/50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-md sm:text-lg">{profileData.follower_count}</span>{" "}
                      <span className="text-muted-foreground hover:text-foreground transition-colors">followers</span>
                    </button>
                    <button 
                      onClick={() => openFollowModal("following")}
                      className="hover:bg-muted/50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-md sm:text-lg">{profileData.following_count}</span>{" "}
                      <span className="text-muted-foreground hover:text-foreground transition-colors">following</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative" ref={settingsMenuRef}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                >
                  <Settings className="w-5 h-5" />
                </Button>
                
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={handleEditProfile}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <UserPen className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-xl">
              <p className="font-semibold mb-1">{profileData.full_name || profileData.username}</p>
              <p className="text-sm text-muted-foreground break-words">
                {profileData.bio || "No bio available."}
              </p>
            </div>

            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full gradient-primary mb-6">
                <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-white/20">
                  <Grid className="w-4 h-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex-1 data-[state=active]:bg-white/20">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Saved
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {posts.map((post) => (
                    <div
                      key={post.post_id}
                      onClick={() => setSelectedPost(post)} // This post object is minimal
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
              </TabsContent>

              <TabsContent value="saved" className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {savedPosts.map((post) => (
                    <div
                      key={post.post_id}
                      onClick={() => setSelectedPost({ ...post, isSavedView: true })}
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
                {savedPosts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No saved posts yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}