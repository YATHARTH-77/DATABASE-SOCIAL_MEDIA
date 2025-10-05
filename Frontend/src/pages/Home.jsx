import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Bookmark, MoveHorizontal as MoreHorizontal, Loader as Loader2 } from "lucide-react";
import { StoryViewer } from "@/components/StoryViewer";
import { postsService } from "@/services/postsService";
import { storiesService } from "@/services/storiesService";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    try {
      setLoading(true);
      const [feedPosts, activeStories] = await Promise.all([
        postsService.getFeedPosts(),
        storiesService.getActiveStories(),
      ]);
      setPosts(feedPosts);
      setStories(activeStories);
    } catch (error) {
      console.error('Error loading feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    const wasLiked = likedPosts.has(postId);

    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (wasLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, likes: post.likes + (wasLiked ? -1 : 1) }
          : post
      )
    );

    try {
      if (wasLiked) {
        await postsService.unlikePost(postId, user.id);
      } else {
        await postsService.likePost(postId, user.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, likes: post.likes + (wasLiked ? 1 : -1) }
            : post
        )
      );
    }
  };

  const handleSave = async (postId) => {
    if (!user) {
      toast.error('Please log in to save posts');
      return;
    }

    const wasSaved = savedPosts.has(postId);

    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (wasSaved) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    try {
      if (wasSaved) {
        await postsService.unsavePost(postId, user.id);
        toast.success('Post removed from saved');
      } else {
        await postsService.savePost(postId, user.id);
        toast.success('Post saved');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to save post');
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (wasSaved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    }
  };

  const handleMomentClick = (index) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleHashtagClick = (tag) => {
    navigate(`/hashtag/${tag.slice(1)}`);
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {showStoryViewer && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setShowStoryViewer(false)}
        />
      )}

      <main className="ml-48 flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {stories.length > 0 && (
            <div className="bg-secondary/10 backdrop-blur-sm rounded-2xl p-6 border border-secondary/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold gradient-primary px-4 py-1 rounded-full inline-block">
                  MOMENTS
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {stories.map((storyGroup, index) => (
                  <div key={storyGroup.userId} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 via-green-400 to-yellow-400 p-1 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleMomentClick(index)}
                    >
                      {storyGroup.profilePic ? (
                        <img src={storyGroup.profilePic} alt={storyGroup.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <span className="text-xs font-semibold">{storyGroup.username[0].toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{storyGroup.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-lg font-bold gradient-primary px-4 py-1 rounded-full inline-block">
              FEED
            </h2>

            {posts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No posts to show. Follow some users to see their posts!</p>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between p-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                      onClick={() => handleUserClick(post.username)}
                    >
                      <Avatar>
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback className="gradient-primary text-white">
                          {post.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{post.username}</p>
                        <p className="text-xs text-muted-foreground">{post.time}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>

                  {post.media && post.media.length > 0 ? (
                    <div className="aspect-square">
                      <img
                        src={post.media[0].media_url}
                        alt="Post content"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 aspect-square flex items-center justify-center">
                      <span className="text-6xl font-bold text-muted-foreground/20">MEDIA</span>
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(post.id)}
                        className={likedPosts.has(post.id) ? "text-red-500" : "hover:text-red-500"}
                      >
                        <Heart className={`w-6 h-6 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-primary">
                        <MessageCircle className="w-6 h-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto hover:text-accent"
                        onClick={() => handleSave(post.id)}
                      >
                        <Bookmark className={`w-6 h-6 ${savedPosts.has(post.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>

                    <div>
                      <p className="font-semibold text-sm">
                        {post.likes.toLocaleString()} likes
                      </p>
                      <p className="text-sm mt-1">
                        <span
                          className="font-semibold cursor-pointer hover:opacity-80"
                          onClick={() => handleUserClick(post.username)}
                        >
                          {post.username}
                        </span> {post.caption}
                      </p>
                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {post.hashtags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-sm text-primary hover:underline cursor-pointer"
                              onClick={() => handleHashtagClick(tag)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {post.comments > 0 && (
                        <button className="text-sm text-muted-foreground mt-2 hover:underline">
                          View all {post.comments} comments
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
