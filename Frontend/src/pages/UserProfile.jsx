import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Grid, Loader2 } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";
import { StoryViewer } from "@/components/StoryViewer";
import { useToast } from "@/hooks/use-toast";

const API_URL = "http://localhost:5000";

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  
  // --- NEW HIGHLIGHT STATE ---
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

  useEffect(() => {
    if (!user || !username) return; 
    if (user.username === username) {
      navigate("/profile");
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const [profileRes, highlightsRes] = await Promise.all([
          fetch(`${API_URL}/api/profile/${username}?loggedInUserId=${user.id}`),
          fetch(`${API_URL}/api/profile/${username}/highlights`)
        ]);
        
        const profileJson = await profileRes.json();
        const highlightsJson = await highlightsRes.json();
        
        if (profileJson.success) {
          setProfileData(profileJson.user);
          setPosts(profileJson.posts);
        } else {
          throw new Error(profileJson.message);
        }

        if (highlightsJson.success) {
          setHighlights(highlightsJson.highlights);
        }
        
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: err.message, variant: "destructive" });
        if (err.message === "User not found") {
          navigate("/home");
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
  
  const handleLike = (postId) => { /* ... API call to /api/posts/like ... */ };
  const handleSave = (postId) => { /* ... API call to /api/posts/save ... */ };

  const handleUserClick = (navUsername) => {
    if (navUsername && username && navUsername.toLowerCase() !== username.toLowerCase()) {
      setModalType(null);
      navigate(`/user/${navUsername}`);
    }
  };
  
  // --- NEW: Open Highlight Story Viewer ---
  const handleHighlightClick = async (highlight) => {
    try {
      const res = await fetch(`${API_URL}/api/highlight/${highlight.highlight_id}/stories`);
      const data = await res.json();
      if (data.success) {
        const storiesForViewer = data.stories.map(s => ({
          id: s.story_id,
          username: s.username,
          avatar: s.profile_pic_url,
          src: `${API_URL}${s.media_url}`,
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
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <>
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
      
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4 hover:bg-purple-100 hover:text-[#5A0395]">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Card className="p-4 sm:p-8 shadow-lg border-2 border-purple-300">
            {/* --- Profile Header --- */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
              <Avatar className="w-24 h-24 flex-shrink-0">
                <AvatarImage src={profileData.profile_pic_url ? `${API_URL}${profileData.profile_pic_url}` : ''} />
                <AvatarFallback className="bg-[#5A0395] text-white text-3xl">
                  {profileData.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left w-full">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words text-[#1D0C69]">{profileData.username}</h1>
                <div className="flex justify-center sm:justify-start gap-4 sm:gap-8 text-sm mb-4">
                  <div>
                    <span className="font-bold text-md sm:text-lg text-[#1D0C69]">{profileData.post_count}</span>{" "}
                    <span className="text-[#5A0395]">posts</span>
                  </div>
                  <button onClick={() => openFollowModal("followers")} className="hover:bg-purple-50 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    <span className="font-bold text-md sm:text-lg text-[#1D0C69]">{profileData.follower_count}</span>{" "}
                    <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">followers</span>
                  </button>
                  <button onClick={() => openFollowModal("following")} className="hover:bg-purple-50 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    <span className="font-bold text-md sm:text-lg text-[#1D0C69]">{profileData.following_count}</span>{" "}
                    <span className="text-[#5A0395] hover:text-[#1D0C69] transition-colors">following</span>
                  </button>
                </div>
                <Button
                  onClick={handleFollowToggle}
                  variant={profileData.isFollowing ? "outline" : "default"}
                  className={!profileData.isFollowing ? "bg-gradient-to-r from-[#1D0C69] to-[#5A0395] text-white hover:opacity-90" : "border-[#5A0395] text-[#5A0395] hover:bg-purple-50"}
                >
                  {profileData.isFollowing ? "Unfollow" : "Follow"}
                </Button>
              </div>
            </div>

            {/* --- Bio --- */}
            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="font-semibold mb-1 text-[#1D0C69]">{profileData.full_name}</p>
              <p className="text-sm text-gray-600 break-words">{profileData.bio || "No bio available."}</p>
            </div>
            
            {/* --- HIGHLIGHTS SECTION --- */}
            {highlights.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[#5A0395] mb-3">Highlights</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {highlights.map((highlight) => (
                    <div 
                      key={highlight.highlight_id} 
                      className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                      onClick={() => handleHighlightClick(highlight)}
                    >
                      <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600">
                        <div className="w-full h-full rounded-full bg-background p-1">
                          <Avatar className="w-full h-full">
                            <AvatarImage src={highlight.cover_media_url ? `${API_URL}${highlight.cover_media_url}` : ''} />
                            <AvatarFallback>{highlight.title[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#1D0C69]">{highlight.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- Posts Grid --- */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-bold mb-4 flex items-center text-[#1D0C69]">
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
                <div className="text-center py-12 text-[#5A0395]">
                  <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}