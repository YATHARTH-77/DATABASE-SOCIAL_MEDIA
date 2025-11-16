import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Grid, Loader2, Bookmark, Settings, UserPen, LogOut, Trash2, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";
import { StoryViewer } from "@/components/StoryViewer";
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

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  
  // --- HIGHLIGHT STATE ---
  const [highlights, setHighlights] = useState([]);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [selectedHighlightStories, setSelectedHighlightStories] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]); 
  const [savedPosts, setSavedPosts] = useState([]); 
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // --- Fetch All Profile Data ---
  useEffect(() => {
    if (!user || !username) return; 
    if (user.username === username) {
      navigate("/profile");
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Main Profile Data (Which includes Highlights now!)
        const profileRes = await fetch(`${API_URL}/api/profile/${username}?loggedInUserId=${user.id}`);
        
        if (profileRes.status === 404) {
             toast({ title: "User not found", description: "This user does not exist.", variant: "destructive" });
             navigate("/home");
             return;
        }
        
        if (!profileRes.ok) throw new Error(`Server error: ${profileRes.status}`);
        
        const profileJson = await profileRes.json();
        
        if (profileJson.success) {
          setProfileData(profileJson.user);
          setPosts(profileJson.posts);
          setSavedPosts(profileJson.savedPosts || []); 
          // FIX: Get highlights directly from the profile response
          setHighlights(profileJson.highlights || []); 
        } else {
          throw new Error(profileJson.message);
        }
        
      } catch (err) {
        console.error(err);
        if (err.message !== "Server error: 404") {
             toast({ title: "Error", description: "Could not load profile.", variant: "destructive" });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, username, navigate, toast]);

  const openFollowModal = async (type) => {
    if (!profileData) return;
    setModalType(type);
    
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
  
  const handleFollowToggle = async () => {
    if (!user || !profileData) return;
    const isCurrentlyFollowing = profileData.isFollowing;
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
      setProfileData(prev => ({
        ...prev,
        isFollowing: isCurrentlyFollowing,
        follower_count: isCurrentlyFollowing ? prev.follower_count + 1 : prev.follower_count - 1
      }));
      toast({ title: "Error", description: "Failed to follow/unfollow", variant: "destructive" });
    }
  };
  
  const handleLike = (postId) => { /* Logic handled in modal */ };
  const handleSave = (postId) => { /* Logic handled in modal */ };

  const handleUserClick = (navUsername) => {
    if (navUsername && username && navUsername.toLowerCase() !== username.toLowerCase()) {
      setModalType(null);
      navigate(`/user/${navUsername}`);
    }
  };

  // --- Highlight Handlers ---
  const handleHighlightClick = async (highlight) => {
    try {
      const res = await fetch(`${API_URL}/api/highlights/${highlight.highlight_id}/stories`);
      const data = await res.json();
      if (data.success) {
        const storiesForViewer = data.stories.map(s => ({
          id: s.story_id,
          username: s.username,
          avatar: s.profile_pic_url,
          src: s.media_url, 
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

  useEffect(() => {
    if (selectedPost || modalType || showHighlightViewer) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedPost, modalType, showHighlightViewer]);

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
        .highlights-scroll::-webkit-scrollbar { height: 4px; }
        .highlights-scroll::-webkit-scrollbar-thumb { background: #d8b4fe; border-radius: 10px; }
      `}</style>

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
          onRemoveFollower={() => {}} 
          onUnfollow={() => {}}      
          onUserClick={handleUserClick}
          isOwnProfile={false} 
        />
      )}
      
      {showHighlightViewer && (
        <StoryViewer
          stories={selectedHighlightStories}
          initialIndex={0}
          onClose={() => setShowHighlightViewer(false)}
        />
      )}
      
      {/* RESPONSIVE FIX: ml-0 md:ml-[22rem] pb-24 md:pb-8 */}
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-[22rem] pb-24 md:pb-8 transition-all duration-300 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4 hover:bg-purple-100 hover:text-[#5A0395]">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Card className="p-4 md:p-8 shadow-none md:shadow-lg border-0 md:border-2 border-purple-300 w-full">
            
            {/* --- Profile Header --- */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 mb-6 w-full">
              <Avatar className="w-20 h-20 md:w-32 md:h-32 shrink-0 border-4 border-purple-100">
                <AvatarImage src={profileData.profile_pic_url || ''} className="object-cover" />
                <AvatarFallback className="bg-[#5A0395] text-white text-2xl md:text-3xl">
                  {profileData.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row items-center md:justify-between gap-2 mb-4">
                     <h1 className="text-2xl md:text-3xl font-bold text-[#1D0C69] break-all">{profileData.username}</h1>
                     <Button
                        onClick={handleFollowToggle}
                        variant={profileData.isFollowing ? "outline" : "default"}
                        className={!profileData.isFollowing ? "bg-gradient-to-r from-[#1D0C69] to-[#5A0395] text-white hover:opacity-90 w-full md:w-auto" : "border-[#5A0395] text-[#5A0395] hover:bg-purple-50 w-full md:w-auto"}
                        >
                        {profileData.isFollowing ? "Unfollow" : "Follow"}
                     </Button>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-10 text-sm md:text-base mb-4">
                  <div className="text-center">
                      <span className="font-bold text-md sm:text-lg text-[#1D0C69] block">{profileData.post_count}</span>
                      <span className="text-[#5A0395]">posts</span>
                  </div>
                  <button onClick={() => openFollowModal("followers")} className="text-center hover:opacity-70">
                      <span className="font-bold text-md sm:text-lg text-[#1D0C69] block">{profileData.follower_count}</span>
                      <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">followers</span>
                  </button>
                  <button onClick={() => openFollowModal("following")} className="text-center hover:opacity-70">
                      <span className="font-bold text-md sm:text-lg text-[#1D0C69] block">{profileData.following_count}</span>
                      <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">following</span>
                  </button>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg text-sm text-gray-700 text-center md:text-left">
                    <span className="font-bold block text-[#1D0C69] mb-1">{profileData.full_name}</span>
                    {profileData.bio || "No bio available."}
                </div>
              </div>
            </div>
            
            {/* --- HIGHLIGHTS SECTION --- */}
            {highlights.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[#5A0395] mb-3 px-2">Highlights</h2>
                <div className="flex items-center gap-4 overflow-x-auto pb-2 px-2 highlights-scroll">
                  {highlights.map((highlight) => (
                    <div 
                      key={highlight.highlight_id} 
                      className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                      onClick={() => handleHighlightClick(highlight)}
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 p-[2px] rounded-full bg-gradient-to-tr from-purple-400 to-pink-500">
                        <div className="w-full h-full rounded-full bg-background p-0.5">
                          <Avatar className="w-full h-full">
                            <AvatarImage src={highlight.cover_media_url || ''} />
                            <AvatarFallback>{highlight.title[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#1D0C69] truncate w-16 text-center">{highlight.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- Posts Grid --- */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-bold mb-4 flex items-center text-[#1D0C69] px-2">
                <Grid className="w-4 h-4 mr-2" /> Posts
              </h2>
              {posts.length === 0 ? (
                <div className="text-center py-12 text-[#5A0395]">
                  <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {posts.map((post) => (
                    <div
                        key={post.post_id}
                        onClick={() => setSelectedPost({ ...post, username: profileData.username })}
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
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}