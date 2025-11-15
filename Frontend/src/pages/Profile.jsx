import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Grid, Bookmark, UserPen, LogOut, Trash2, Loader2, Plus } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";
import { CreateHighlightModal } from "@/components/CreateHighlightModal"; 
import { StoryViewer } from "@/components/StoryViewer"; 
import { useToast } from "@/hooks/use-toast";

// --- Base URL (Dynamic for Deployment) ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  
  // --- NEW HIGHLIGHT STATE ---
  const [highlights, setHighlights] = useState([]);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [selectedHighlightStories, setSelectedHighlightStories] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // --- Fetch All Profile Data (Highlights added) ---
  useEffect(() => {
    if (!user) return; 

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // Fetch profile, posts, and highlights in parallel
        const [profileRes, highlightsRes] = await Promise.all([
          fetch(`${API_URL}/api/profile/${user.username}?loggedInUserId=${user.id}`),
          fetch(`${API_URL}/api/profile/${user.username}/highlights`)
        ]);

        const profileJson = await profileRes.json();
        const highlightsJson = await highlightsRes.json();

        if (profileJson.success) {
          setProfileData(profileJson.user);
          setPosts(profileJson.posts);
          setSavedPosts(profileJson.savedPosts);
        } else {
          throw new Error(profileJson.message);
        }
        
        if (highlightsJson.success) {
          setHighlights(highlightsJson.highlights);
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
  
  const openFollowModal = async (type) => {
    if (!user) return;
    setModalType(type);
    
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
  
  // --- NEW: Open Highlight Story Viewer ---
  const handleHighlightClick = async (highlight) => {
    try {
      const res = await fetch(`${API_URL}/api/highlight/${highlight.highlight_id}/stories`);
      const data = await res.json();
      if (data.success) {
        // Map stories to the format StoryViewer expects
        const storiesForViewer = data.stories.map(s => ({
          id: s.story_id,
          username: s.username,
          avatar: s.profile_pic_url,
          src: s.media_url, // Fixed: Use full URL directly
          type: s.media_type && s.media_type.startsWith('video') ? 'video' : 'photo',
          timestamp: s.created_at,
        }));
        setSelectedHighlightStories(storiesForViewer);
        setShowHighlightViewer(true);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not load highlight.", variant: "destructive" });
    }
  };

  const handleHighlightCreated = (newHighlight) => {
    setHighlights(prev => [...prev, newHighlight]); 
    setShowCreateHighlight(false);
    toast({ title: "Success", description: "Highlight created!" });
  };
  
  const handleUserClick = (username) => {
    setModalType(null);
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

      setSavedPosts(prev => prev.filter(post => post.post_id !== postId));
      setSelectedPost(null); 
    } catch (err) {
      console.error("Failed to unsave post", err);
      toast({ title: "Error", description: "Failed to unsave post", variant: "destructive" });
    }
  };

  const handleEditProfile = () => {
    setShowSettingsMenu(false);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    if (showSettingsMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  useEffect(() => {
    if (selectedPost || modalType || showCreateHighlight || showHighlightViewer) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost, modalType, showCreateHighlight, showHighlightViewer]);

  if (isLoading || !profileData) {
    return (
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <>
      {/* --- ALL MODALS --- */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUserClick={handleUserClick}
          variant="owner"
          isSavedPostView={selectedPost.isSavedView}
          isSaved={selectedPost.isSavedView}
          onSave={() => handleUnsavePost(selectedPost.post_id)}
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
      
      {showHighlightViewer && (
        <StoryViewer
          stories={selectedHighlightStories}
          initialIndex={0}
          onClose={() => setShowHighlightViewer(false)}
        />
      )}
      
      {showCreateHighlight && user && (
        <CreateHighlightModal
          onClose={() => setShowCreateHighlight(false)}
          onCreate={handleHighlightCreated}
          userId={user.id}
        />
      )}
      
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 sm:p-8 shadow-lg">
            {/* --- Profile Header (Unchanged) --- */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <Avatar className="w-24 h-24 flex-shrink-0">
                  <AvatarImage src={profileData.profile_pic_url ? `${API_URL}${profileData.profile_pic_url}` : ''} />
                  <AvatarFallback className="gradient-sidebar text-white text-3xl">
                    {profileData.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[#1D0C69]">{profileData.username}</h1>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8 text-sm items-baseline">
                    <div>
                      <span className="font-bold text-md sm:text-lg text-[#1D0C69]">{profileData.post_count}</span>{" "}
                      <span className="text-[#5A0395]">posts</span>
                    </div>
                    <button 
                      onClick={() => openFollowModal("followers")}
                      className="hover:bg-purple-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-md sm:text-lg text-[#1D0C69]">{profileData.follower_count}</span>{" "}
                      <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">followers</span>
                    </button>
                    <button 
                      onClick={() => openFollowModal("following")}
                      className="hover:bg-purple-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-md sm:text-lg text-[#1D0C69]">{profileData.following_count}</span>{" "}
                      <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">following</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative" ref={settingsMenuRef}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="hover:bg-purple-100 hover:text-[#5A0395]"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border-2 border-purple-300 rounded-lg shadow-lg py-1 z-50 overflow-hidden">
                    <button
                      onClick={handleEditProfile}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors text-[#1D0C69]"
                    >
                      <UserPen className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors text-[#1D0C69]"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --- Bio (Unchanged) --- */}
            <div className="mb-6 p-4 bg-muted/30 rounded-xl">
              <p className="font-semibold mb-1">{profileData.full_name || profileData.username}</p>
              <p className="text-sm text-muted-foreground break-words">
                {profileData.bio || "No bio available."}
              </p>
            </div>

            {/* --- *** NEW HIGHLIGHTS SECTION *** --- */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-[#5A0395] mb-3">Highlights</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                
                {/* "New" Highlight Button */}
                <div 
                  className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                  onClick={() => setShowCreateHighlight(true)}
                >
                  <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-dashed border-purple-300 flex items-center justify-center hover:border-[#5A0395] transition-colors">
                    <Plus className="w-8 h-8 text-[#5A0395]" />
                  </div>
                  <span className="text-xs text-[#5A0395]">New</span>
                </div>
                
                {/* Existing Highlights */}
                {highlights.map((highlight) => (
                  <div 
                    key={highlight.highlight_id} 
                    className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                    onClick={() => handleHighlightClick(highlight)}
                  >
                    <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600">
                      <div className="w-full h-full rounded-full bg-background p-1">
                        <Avatar className="w-full h-full">
                          {/* FIXED: Removed `${API_URL}` prefix */}
                          <AvatarImage src={highlight.cover_media_url || ''} />
                          <AvatarFallback>{highlight.title[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[#1D0C69]">{highlight.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Posts/Saved Tabs --- */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full bg-gradient-to-r from-[#1D0C69] to-[#5A0395] mb-6">
                <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-white/20 text-white">
                  <Grid className="w-4 h-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex-1 data-[state=active]:bg-white/20 text-white">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Saved
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {posts.map((post) => (
                    <div
                      key={post.post_id}
                      onClick={() => setSelectedPost(post)}
                      className="aspect-square bg-muted rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md relative group"
                    >
                      {post.media_url ? (
                        /* FIXED: Removed `${API_URL}` prefix */
                        <img src={post.media_url} alt={post.caption || 'post'} className="w-full h-full object-cover rounded-xl" />
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
                  <div className="text-center py-12 text-[#5A0395]">
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
                         /* FIXED: Removed `${API_URL}` prefix */
                         <img src={post.media_url} alt={post.caption || 'post'} className="w-full h-full object-cover rounded-xl" />
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
                  <div className="text-center py-12 text-[#5A0395]">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No saved posts yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </>
  );
}