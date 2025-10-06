import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Grid, Bookmark, UserPen, LogOut, Trash2 } from "lucide-react";
import { PostDetailModal } from "@/components/PostDetailModal";
import { FollowerModal } from "@/components/FollowerModal";

const profileStats = [
  { label: "posts", value: 42 },
  { label: "followers", value: 1234 },
  { label: "following", value: 567 }
];

const mockPosts = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  username: "Username",
  avatar: "",
  caption: `This is my post number ${i + 1}.`,
  hashtags: ["#post", "#creative", "#inspiration"],
  gradient: `from-${["sky", "blue", "cyan", "indigo", "teal", "blue"][i]}-400 via-green-400 to-yellow-400`,
  comments: [{ id: 1, username: "friend_user", avatar: "", text: "Amazing post!", timestamp: "2h ago" }]
}));

const initialSavedPosts = Array.from({ length: 4 }, (_, i) => ({
  id: i + 100,
  username: `user_${i}`,
  avatar: "",
  caption: `This is a saved post about travel, number ${i + 1}.`,
  hashtags: ["#travel", "#saved", "#bucketlist"],
  gradient: `from-${["pink", "purple", "fuchsia", "violet"][i]}-400 via-orange-500 to-red-500`,
  comments: [{ id: 1, username: "another_user", avatar: "", text: "Great find!", timestamp: "3d ago" }],
  timestamp: `${i + 2}d ago`
}));

const mockFollowers = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, username: `follower_${i + 1}`, displayName: `Follower ${i + 1}`, avatar: "" }));
const mockFollowing = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, username: `following_${i + 1}`, displayName: `Following ${i + 1}`, avatar: "" }));

export default function Profile() {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [followers, setFollowers] = useState(mockFollowers);
  const [following, setFollowing] = useState(mockFollowing);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);
  
  // --- MODIFICATION START: Manage saved posts in state and add un-save handler ---
  const [savedPosts, setSavedPosts] = useState(initialSavedPosts);

  const handleUnsavePost = (postId) => {
    setSavedPosts(prev => prev.filter(post => post.id !== postId));
    setSelectedPost(null); // Also close the modal after un-saving
  };
  // --- MODIFICATION END ---

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleRemoveFollower = (userId) => {
    setFollowers(prev => prev.filter(user => user.id !== userId));
  };

  const handleUnfollow = (userId) => {
    setFollowing(prev => prev.filter(user => user.id !== userId));
  };

  const handleEditProfile = () => {
    setShowSettingsMenu(false);
    // Navigate to edit profile page or open edit modal
    console.log("Edit Profile clicked");
  };

  const handleLogout = () => {
    setShowSettingsMenu(false);
    // Add logout logic here
    console.log("Logout clicked");
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    setShowSettingsMenu(false);
    // Add delete account confirmation and logic here
    console.log("Delete Account clicked");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);

  useEffect(() => {
    if (selectedPost || modalType) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost, modalType]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUserClick={handleUserClick}
          variant="owner"
          // --- MODIFICATION: Pass new props for the saved post view ---
          isSavedPostView={selectedPost.isSavedView}
          isSaved={true} // The button is always ticked in this view
          onSave={() => handleUnsavePost(selectedPost.id)}
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
                  <AvatarFallback className="gradient-primary text-white text-3xl">U</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Username</h1>
                  <div className="flex justify-center sm:justify-start gap-4 sm:gap-8 text-sm">
                    <div>
                      <span className="font-bold text-md sm:text-lg">{profileStats[0].value}</span>{" "}
                      <span className="text-muted-foreground">{profileStats[0].label}</span>
                    </div>
                    <button 
                      onClick={() => setModalType("followers")}
                      className="hover:bg-muted/50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-md sm:text-lg">{followers.length}</span>{" "}
                      <span className="text-muted-foreground hover:text-foreground transition-colors">followers</span>
                    </button>
                    <button 
                      onClick={() => setModalType("following")}
                      className="hover:bg-muted/50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-md sm:text-lg">{following.length}</span>{" "}
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
              <p className="font-semibold mb-1">Display name</p>
              <p className="text-sm text-muted-foreground break-words">
                Bio text goes here. Share a bit about yourself! ✨
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
                  {mockPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`aspect-square bg-gradient-to-br ${post.gradient} rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md relative group`}
                    >
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <p className="text-white text-sm font-semibold">View Post</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="saved" className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {savedPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost({ ...post, isSavedView: true })}
                      className={`aspect-square bg-gradient-to-br ${post.gradient} rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md relative group`}
                    >
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