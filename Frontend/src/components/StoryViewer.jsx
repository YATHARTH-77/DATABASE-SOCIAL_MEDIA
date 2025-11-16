import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Heart, ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_URL = import.meta.env.VITE_API_URL || "https://backend-sm-seven.vercel.app";

// Format timestamp to relative time (e.g., "2h ago", "5m ago")
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  
  const now = new Date();
  const storyTime = new Date(timestamp);
  const diffMs = now - storyTime;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return storyTime.toLocaleDateString();
};

export const StoryViewer = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showLikesPopup, setShowLikesPopup] = useState(false);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const rafRef = useRef(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);

  const currentStory = stories[currentIndex];
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Fetch like status and likes list when story changes
  useEffect(() => {
    if (!currentStory || !user) return;

    // Reset states immediately when story changes
    setIsLoadingLike(true);
    setLiked(false);
    setLikesList([]);
    setShowLikesPopup(false);

    const fetchLikeData = async () => {
      try {
        // Fetch both like status and likes list in parallel
        const [likedRes, likesRes] = await Promise.all([
          fetch(`${API_URL}/api/stories/${currentStory.id}/liked?userId=${user.id}`),
          fetch(`${API_URL}/api/stories/${currentStory.id}/likes`)
        ]);

        const likedData = await likedRes.json();
        const likesData = await likesRes.json();

        if (likedData.success) {
          setLiked(likedData.liked);
        }

        if (likesData.success) {
          setLikesList(likesData.likes);
        }
      } catch (err) {
        console.error("Failed to fetch like data:", err);
      } finally {
        setIsLoadingLike(false);
      }
    };

    fetchLikeData();
  }, [currentStory?.id, user?.id]); // Added user.id to dependencies

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      if (typeof onClose === "function") onClose();
    }
  };

  const handleLike = async () => {
    if (!user || !currentStory || isLoadingLike) return;

    // Optimistic update
    const newLikedState = !liked;
    const previousLikedState = liked;
    const previousLikesList = [...likesList];
    
    setLiked(newLikedState);

    // Update likes list optimistically
    if (newLikedState) {
      setLikesList(prev => [{
        user_id: user.id,
        username: user.username,
        profile_pic_url: user.profile_pic_url
      }, ...prev]);
    } else {
      setLikesList(prev => prev.filter(like => like.user_id !== user.id));
    }

    try {
      const res = await fetch(`${API_URL}/api/stories/${currentStory.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      
      if (!data.success) {
        // Revert on failure
        setLiked(previousLikedState);
        setLikesList(previousLikesList);
      }
    } catch (err) {
      console.error("Like error:", err);
      // Revert on error
      setLiked(previousLikedState);
      setLikesList(previousLikesList);
    }
  };

  const handleBack = () => {
    if (typeof onClose === "function") onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, stories.length]);

  // Progress and auto-advance logic
  useEffect(() => {
    setProgress(0);
    setMediaLoaded(false);
    setMediaError(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const goNext = () => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        if (typeof onClose === "function") onClose();
      }
    };

    if (!currentStory || currentStory.type !== "video") {
      const duration = (currentStory && currentStory.duration) || 5000;
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(100, (elapsed / duration) * 100);
        setProgress(p);
        if (p >= 100) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          goNext();
        }
      }, 50);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    const video = videoRef.current;
    if (video) {
      setPlaybackBlocked(false);
      const onEnded = () => {
        setProgress(100);
        goNext();
      };

      const onPlay = () => {
        setIsPlaying(true);
        if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
      };

      const onPause = () => {
        setIsPlaying(false);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };

      const update = () => {
        if (video && video.duration) {
          const p = Math.min(100, (video.currentTime / video.duration) * 100);
          setProgress(p);
        }
        rafRef.current = requestAnimationFrame(update);
      };

      video.addEventListener("ended", onEnded);
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);

      const tryPlay = () => {
        video.currentTime = 0;
        video.muted = isMuted;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.then(() => {
            setIsPlaying(true);
            if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
          }).catch(() => {
            setPlaybackBlocked(true);
            if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
          });
        } else {
          if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
        }
      };

      if (video.readyState >= 1) {
        setMediaLoaded(true);
        tryPlay();
      } else {
        const onLoaded = () => {
          setMediaLoaded(true);
          tryPlay();
        };
        video.addEventListener("loadedmetadata", onLoaded, { once: true });
      }

      return () => {
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        try {
          video.pause();
        } catch (e) {}
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }

    return () => {};
  }, [currentIndex, stories, currentStory, onClose, isMuted]);

  // Progress segments - show only current user's stories
  const userStories = stories.filter(s => s.userId === currentStory.userId);
  const currentUserStoryIndex = userStories.findIndex(s => s.id === currentStory.id);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 z-50 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm p-2.5 rounded-full transition-all"
        aria-label="Back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Main content container */}
      <div className="w-full max-w-md h-[90vh] relative">
        {/* Progress segments */}
        <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-40">
          {userStories.map((story, idx) => (
            <div key={story.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentUserStoryIndex ? "100%" : idx === currentUserStoryIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Username header */}
        <div className="absolute top-10 left-4 right-4 flex items-center gap-3 z-40">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={currentStory.avatar || ''} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {currentStory.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm drop-shadow-lg">
              {currentStory.username}
            </p>
            <p className="text-white/80 text-xs drop-shadow-lg">{formatTimestamp(currentStory.timestamp)}</p>
          </div>
        </div>

        {/* Story content */}
        <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative">
          {currentStory.type === "video" ? (
            <div className="w-full h-full relative">
              {!mediaLoaded && !mediaError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {mediaError && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 text-white">
                  Unable to load video
                </div>
              )}
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                onCanPlay={() => setMediaLoaded(true)}
                onError={() => setMediaError(true)}
              >
                {currentStory.src && <source src={currentStory.src} type="video/mp4" />}
              </video>
              {(playbackBlocked || !isPlaying) && !mediaError && (
                <button
                  onClick={() => {
                    const v = videoRef.current;
                    if (!v) return;
                    setPlaybackBlocked(false);
                    v.muted = isMuted;
                    v.play().then(() => setIsPlaying(true)).catch(() => setPlaybackBlocked(true));
                  }}
                  className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                  aria-label="Play"
                >
                  {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                </button>
              )}

              {/* Mute button for videos */}
              <button
                onClick={() => {
                  const v = videoRef.current;
                  setIsMuted((m) => {
                    const next = !m;
                    if (v) v.muted = next;
                    return next;
                  });
                }}
                className="absolute bottom-6 right-6 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all z-20"
                aria-label="Toggle sound"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          ) : (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              {!mediaLoaded && !mediaError && currentStory.src && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {mediaError && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 text-white">
                  Unable to load image
                </div>
              )}
              {currentStory.src && (
                <img
                  src={currentStory.src}
                  alt={`${currentStory.username} story`}
                  className="w-full h-full object-contain"
                  onLoad={() => setMediaLoaded(true)}
                  onError={() => setMediaError(true)}
                />
              )}
            </div>
          )}

          {/* Like button and count */}
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
            <button
              onClick={handleLike}
              disabled={isLoadingLike}
              className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                isLoadingLike 
                  ? "bg-black/40 cursor-not-allowed" 
                  : liked 
                    ? "bg-red-500/80 hover:bg-red-600/80" 
                    : "bg-black/40 hover:bg-black/60"
              }`}
              aria-label="Like"
            >
              <Heart 
                className={`w-7 h-7 transition-all ${
                  isLoadingLike 
                    ? "text-white/50" 
                    : liked 
                      ? "fill-white text-white" 
                      : "text-white"
                }`} 
              />
            </button>
            
            {likesList.length > 0 && !isLoadingLike && (
              <button
                onClick={() => setShowLikesPopup(true)}
                className="px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all text-white font-medium"
              >
                {likesList.length} {likesList.length === 1 ? 'like' : 'likes'}
              </button>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="fixed left-8 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm p-3 rounded-full transition-all z-30"
            aria-label="Previous"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        
        {currentIndex < stories.length - 1 && (
          <button
            onClick={handleNext}
            className="fixed right-8 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm p-3 rounded-full transition-all z-30"
            aria-label="Next"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Likes popup */}
      {showLikesPopup && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setShowLikesPopup(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Liked by</h3>
              <button onClick={() => setShowLikesPopup(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {likesList.length > 0 ? (
                likesList.map((like) => (
                  <div key={like.user_id} className="flex items-center gap-3 py-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={like.profile_pic_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {like.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800">{like.username}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No likes yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};