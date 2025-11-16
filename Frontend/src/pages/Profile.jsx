import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Grid, Bookmark, UserPen, LogOut, Trash2, Loader2, Plus, X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";
import { useToast } from "@/hooks/use-toast";

// --- Base URL (Dynamic for Deployment) ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ⭐️ --- ViewHighlightModal Component --- ⭐️
function ViewHighlightModal({ stories, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStory = stories[currentIndex];

  const nextStory = () => {
    setCurrentIndex(prev => Math.min(prev + 1, stories.length - 1));
  };
  const prevStory = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-md bg-black sm:rounded-xl overflow-hidden shadow-lg flex flex-col justify-center">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white bg-black/30 rounded-full p-2">
          <X className="w-6 h-6" />
        </button>
        
        {currentStory && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Story Media */}
            {currentStory.media_type.startsWith('video') ? (
              <video src={currentStory.media_url} autoPlay controls className="w-full h-full object-contain" />
            ) : (
              <img src={currentStory.media_url} alt="Highlight story" className="w-full h-full object-contain" />
            )}

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent pt-12 sm:pt-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border border-white/50">
                  <AvatarImage src={currentStory.profile_pic_url} />
                  <AvatarFallback>{currentStory.username[0]}</AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-sm drop-shadow-md">{currentStory.username}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentIndex > 0 && (
          <button onClick={prevStory} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 text-white backdrop-blur-sm">
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        {currentIndex < stories.length - 1 && (
          <button onClick={nextStory} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 text-white backdrop-blur-sm">
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}

// ⭐️ --- CreateHighlightModal Component --- ⭐️
function CreateHighlightModal({
  onClose,
  archivedStories,
  onCreate,
  isLoading
}) {
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [coverStoryId, setCoverStoryId] = useState(null);
  const { toast } = useToast();

  const toggleStorySelect = (id) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(storyId => storyId !== id)
      : [...selectedIds, id];
    
    setSelectedIds(newIds);

    if (coverStoryId === id && !newIds.includes(id)) {
      setCoverStoryId(null);
    }
    if (!coverStoryId && newIds.length > 0) {
      setCoverStoryId(newIds[0]);
    }
  };

  const handleSetCover = (id) => {
    if (selectedIds.includes(id)) {
      setCoverStoryId(id);
    }
  };

  const handleSubmit = () => {
    if (!title || selectedIds.length === 0 || !coverStoryId) {
      return;
    }
    onCreate({
      title,
      story_ids: selectedIds,
      cover_story_id: coverStoryId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-xl shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-center text-[#1D0C69]">Create Highlight</h2>
          <Button onClick={handleSubmit} disabled={isLoading || !title || selectedIds.length === 0} size="sm">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
          </Button>
        </div>

        <div className="p-4 shrink-0">
          <Input
            placeholder="Highlight Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-purple-300 focus-visible:ring-purple-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-2">
          {archivedStories.map(story => (
            <div
              key={story.story_id}
              className="relative aspect-square cursor-pointer rounded-lg overflow-hidden group"
              onClick={() => toggleStorySelect(story.story_id)}
            >
              <img src={story.media_url} alt="Story" className="w-full h-full object-cover" />
              {selectedIds.includes(story.story_id) ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center border-4 border-purple-500">
                  {coverStoryId === story.story_id ? (
                    <span className="text-white text-xs font-bold bg-purple-600 px-2 py-1 rounded">Cover</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetCover(story.story_id);
                      }}
                      className="text-white text-xs bg-black/70 px-2 py-1 rounded hover:bg-black"
                    >
                      Set Cover
                    </button>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [highlights, setHighlights] = useState([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalLoading, setIsModalLoading] = useState(false); 
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  const [isCreateHighlightModalOpen, setCreateHighlightModalOpen] = useState(false);
  const [archivedStories, setArchivedStories] = useState([]);
  const [isViewHighlightModalOpen, setViewHighlightModalOpen] = useState(false);
  const [viewingHighlightStories, setViewingHighlightStories] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileRes = await fetch(`${API_URL}/api/profile/${user.username}?loggedInUserId=${user.id}`);
        const profileJson = await profileRes.json();

        if (profileJson.success) {
          setProfileData(profileJson.user);
          setPosts(profileJson.posts);
          setSavedPosts(profileJson.savedPosts);
          setHighlights(profileJson.highlights || []); 
        } else {
          throw new Error(profileJson.message);
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

  const handleOpenCreateHighlightModal = async () => {
    if (!user) return;
    setIsModalLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/stories/archive?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setArchivedStories(data.stories);
        setCreateHighlightModalOpen(true);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch stories archive.", variant: "destructive" });
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleCreateHighlight = async ({ title, story_ids, cover_story_id }) => {
    setIsModalLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/highlights/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title,
          story_ids,
          cover_story_id,
        })
      });
      const data = await res.json();
      if (data.success) {
        setHighlights(prev => [...prev, data.highlight]);
        setCreateHighlightModalOpen(false);
        setArchivedStories([]);
        toast({ title: "Success", description: "Highlight created!" });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsModalLoading(false);
    }
  };

  const openHighlight = async (highlightId) => {
    setIsModalLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/highlights/${highlightId}/stories`);
      const data = await res.json();
      if (data.success) {
        setViewingHighlightStories(data.stories);
        setViewHighlightModalOpen(true);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not load highlight stories.", variant: "destructive" });
    } finally {
      setIsModalLoading(false);
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

  // Updated to include highlight modals
  useEffect(() => {
    if (selectedPost || modalType || isCreateHighlightModalOpen || isViewHighlightModalOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost, modalType, isCreateHighlightModalOpen, isViewHighlightModalOpen]);

  if (isLoading || !profileData) {
    return (
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-[22rem] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <>
      <style>{`
        /* Custom Purple Scrollbar for Highlights Section */
        .highlights-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .highlights-scroll::-webkit-scrollbar-track {
          background: linear-gradient(to right, #f3e8ff, #faf5ff);
          border-radius: 10px;
        }
        .highlights-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #7C3AED, #5A0395);
          border-radius: 10px;
          border: 2px solid #f3e8ff;
        }
        .highlights-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #6C2ADD, #4A0285);
        }
      `}</style>

      {/* --- ALL MODALS (Highlights ⭐️ ADDED) --- */}
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
      
      {/* ⭐️ ADDED: Highlight Modals ⭐️ */}
      {isCreateHighlightModalOpen && (
        <CreateHighlightModal
          onClose={() => setCreateHighlightModalOpen(false)}
          archivedStories={archivedStories}
          onCreate={handleCreateHighlight}
          isLoading={isModalLoading}
        />
      )}

      {isViewHighlightModalOpen && (
        <ViewHighlightModal
          stories={viewingHighlightStories}
          onClose={() => setViewHighlightModalOpen(false)}
        />
      )}
      
      {/* RESPONSIVE FIX: ml-0 md:ml-[22rem] pb-24 md:pb-8 */}
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-[22rem] pb-24 md:pb-8 transition-all duration-300 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="mb-4 hover:bg-purple-100 hover:text-[#5A0395]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Card with responsive padding/borders */}
          <Card className="p-4 md:p-8 shadow-none md:shadow-lg border-0 md:border-2 border-purple-300 w-full">
            
            {/* --- Profile Header --- */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-6 w-full">
              <Avatar className="w-20 h-20 md:w-32 md:h-32 shrink-0 border-4 border-purple-100">
                <AvatarImage src={profileData.profile_pic_url || ''} className="object-cover" />
                <AvatarFallback className="gradient-sidebar text-white text-2xl md:text-3xl">
                  {profileData.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row items-center md:justify-between gap-2 mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#1D0C69] break-all">{profileData.username}</h1>
                    <div className="relative" ref={settingsMenuRef}>
                        <Button variant="ghost" size="icon" onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="hover:bg-purple-100 text-[#5A0395]">
                        <Settings className="w-6 h-6" />
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

                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 text-sm items-baseline mb-4">
                  <div className="text-center">
                    <span className="font-bold text-md sm:text-lg text-[#1D0C69] block">{profileData.post_count}</span>
                    <span className="text-[#5A0395]">posts</span>
                  </div>
                  <button onClick={() => openFollowModal("followers")} className="hover:bg-purple-50 px-2 py-1 rounded-md transition-colors cursor-pointer text-center">
                    <span className="font-bold text-md sm:text-lg text-[#1D0C69] block">{profileData.follower_count}</span>
                    <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">followers</span>
                  </button>
                  <button onClick={() => openFollowModal("following")} className="hover:bg-purple-50 px-2 py-1 rounded-md transition-colors cursor-pointer text-center">
                    <span className="font-bold text-md sm:text-lg text-[#1D0C69] block">{profileData.following_count}</span>
                    <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">following</span>
                  </button>
                </div>
              </div>
            </div>

            {/* --- Bio --- */}
            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="font-semibold mb-1 text-[#1D0C69]">{profileData.full_name || profileData.username}</p>
              <p className="text-sm text-gray-600 break-words">
                {profileData.bio || "No bio available."}
              </p>
            </div>

            {/* --- ⭐️ HIGHLIGHTS SECTION WITH CUSTOM SCROLLBAR ⭐️ --- */}
            <div className="mb-6">
              <div className="flex items-center gap-4 overflow-x-auto p-2 highlights-scroll">
                {/* "New" Highlight Button */}
                <button
                  onClick={handleOpenCreateHighlightModal}
                  disabled={isModalLoading}
                  className="flex flex-col items-center justify-start gap-1 w-20 flex-shrink-0"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    {isModalLoading ? <Loader2 className="w-6 h-6 text-gray-500 animate-spin" /> : <Plus className="w-6 h-6 text-gray-500" />}
                  </div>
                  <p className="text-xs font-medium text-center truncate w-full text-gray-600">New</p>
                </button>

                {/* Existing Highlights */}
                {highlights.map((hl) => (
                  <button
                    key={hl.highlight_id}
                    onClick={() => openHighlight(hl.highlight_id)}
                    className="flex flex-col items-center justify-start gap-1 w-20 flex-shrink-0"
                  >
                    <Avatar className="w-16 h-16 border-2 border-purple-300">
                      <AvatarImage src={hl.cover_media_url || ''} />
                      <AvatarFallback>{hl.title[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium text-center truncate w-full text-[#1D0C69]">{hl.title}</p>
                  </button>
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
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {posts.map((post) => (
                    <div
                      key={post.post_id}
                      onClick={() => setSelectedPost(post)}
                      className="aspect-square bg-muted md:rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-sm md:shadow-md relative group overflow-hidden"
                    >
                      {post.media_url ? (
                        <img src={post.media_url} alt={post.caption || 'post'} className="w-full h-full object-cover md:rounded-xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <span className="text-muted-foreground text-xs">No Media</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center md:rounded-xl">
                        <p className="text-white text-sm font-semibold">View</p>
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
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {savedPosts.map((post) => (
                    <div
                      key={post.post_id}
                      onClick={() => setSelectedPost({ ...post, isSavedView: true })}
                      className="aspect-square bg-muted md:rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-sm md:shadow-md relative group overflow-hidden"
                    >
                        {post.media_url ? (
                          <img src={post.media_url} alt={post.caption || 'post'} className="w-full h-full object-cover md:rounded-xl" />
                        ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                           <span className="text-muted-foreground text-xs">No Media</span>
                        </div>
                        )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center md:rounded-xl">
                        <p className="text-white text-sm font-semibold">View</p>
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