import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Grid, Bookmark, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { postsService } from "@/services/postsService";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [userProfile, followerCount, followingCount, postCount, posts, saved] = await Promise.all([
        userService.getUserProfile(user.id),
        userService.getFollowerCount(user.id),
        userService.getFollowingCount(user.id),
        userService.getPostCount(user.id),
        postsService.getUserPosts(user.id),
        postsService.getSavedPosts(user.id),
      ]);

      setProfile(userProfile);
      setStats({
        posts: postCount,
        followers: followerCount,
        following: followingCount,
      });
      setUserPosts(posts);
      setSavedPosts(saved);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="ml-48 flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="ml-48 flex-1 p-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="ml-48 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.profile_pic_url} />
                  <AvatarFallback className="gradient-primary text-white text-3xl">
                    {profile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
                  <div className="flex gap-8 text-sm">
                    <div>
                      <span className="font-bold text-lg">{stats.posts}</span>{" "}
                      <span className="text-muted-foreground">posts</span>
                    </div>
                    <div>
                      <span className="font-bold text-lg">{stats.followers}</span>{" "}
                      <span className="text-muted-foreground">followers</span>
                    </div>
                    <div>
                      <span className="font-bold text-lg">{stats.following}</span>{" "}
                      <span className="text-muted-foreground">following</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-xl">
              <p className="font-semibold mb-1">{profile.full_name || profile.username}</p>
              <p className="text-sm text-muted-foreground">
                {profile.email}
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
                {userPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No posts yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {userPosts.map((post) => (
                      <div
                        key={post.post_id}
                        className="aspect-square rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md overflow-hidden"
                      >
                        {post.media && post.media.length > 0 ? (
                          <img
                            src={post.media[0].media_url}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-sky-400 via-green-400 to-yellow-400 flex items-center justify-center">
                            <span className="text-white text-sm">No media</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-0">
                {savedPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No saved posts yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {savedPosts.map((post) => (
                      <div
                        key={post.post_id}
                        className="aspect-square rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md overflow-hidden"
                      >
                        {post.media && post.media.length > 0 ? (
                          <img
                            src={post.media[0].media_url}
                            alt="Saved post"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 via-emerald-400 to-amber-400 flex items-center justify-center">
                            <span className="text-white text-sm">No media</span>
                          </div>
                        )}
                      </div>
                    ))}
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
