import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Eye, ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

export const StoryViewer = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const rafRef = useRef(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [mediaVisible, setMediaVisible] = useState(true);
  const TRANSITION_MS = 320;

  const currentStory = stories[currentIndex];
  const navigate = useNavigate();

  useEffect(() => {
    // debug
    // eslint-disable-next-line no-console
    console.debug("StoryViewer: currentStory", currentStory);

    // ensure media fades in when a new story is mounted
    setMediaVisible(true);
    setLiked(false);
    setProgress(0);

    // clear any previous timers/frames
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Helper to go to next story or close
    const goNext = () => {
      if (currentIndex < stories.length - 1) {
        // animate out then advance
        setMediaVisible(false);
        setTimeout(() => setCurrentIndex((i) => i + 1), TRANSITION_MS);
      } else {
        // animate out then close
        setMediaVisible(false);
        setTimeout(() => {
          if (typeof onClose === "function") onClose();
        }, TRANSITION_MS);
      }
    };

    // PHOTO: use a fixed duration (default 5s) and update progress
    if (!currentStory || currentStory.type !== "video") {
      setMediaLoaded(false);
      setMediaError(false);
      const duration = (currentStory && currentStory.duration) || 5000; // ms
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
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    // VIDEO: sync progress to video playback and advance on ended
    const video = videoRef.current;
    if (video) {
      setMediaLoaded(false);
      setMediaError(false);
      setPlaybackBlocked(false);
      const onEnded = () => {
        setProgress(100);
        goNext();
      };

      const onPlay = () => {
        setIsPlaying(true);
        // ensure RAF loop is running to update progress
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
        // mute to allow autoplay in browsers
        video.muted = isMuted;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.then(() => {
            setIsPlaying(true);
            // start RAF loop to update progress
            if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
          }).catch(() => {
            // autoplay might be blocked; show play overlay so user can start
            setPlaybackBlocked(true);
            if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
          });
        } else {
          if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
        }
      };

      // If metadata is ready, start playback; otherwise wait for it
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

    return undefined;
  }, [currentIndex, stories, currentStory, onClose]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setMediaVisible(false);
      setTimeout(() => setCurrentIndex((i) => i - 1), TRANSITION_MS);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setMediaVisible(false);
      setTimeout(() => setCurrentIndex((i) => i + 1), TRANSITION_MS);
    } else {
      setMediaVisible(false);
      setTimeout(() => onClose(), TRANSITION_MS);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Top-left back button for easier access */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (typeof onClose === "function") onClose();
            navigate("/home");
          }}
          className="text-white bg-white/6 hover:bg-white/10 backdrop-blur-sm p-2 rounded-full shadow-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 w-full max-w-md px-4">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-white origin-left transform-gpu transition-transform duration-200 ease-linear"
              style={{
                transform: idx < currentIndex ? "scaleX(1)" : idx === currentIndex ? `scaleX(${Math.max(0, Math.min(1, progress / 100))})` : "scaleX(0)",
              }}
            />
            {/* small separator outline to match story style */}
            <div className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
          </div>
        ))}
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 w-full max-w-md px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (typeof onClose === "function") onClose();
            navigate("/home");
          }}
          className="text-white bg-white/6 hover:bg-white/10 backdrop-blur-sm p-2 rounded-full shadow-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarFallback className="gradient-sidebar text-white">
            {currentStory.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-white font-semibold">{currentStory.username}</p>
          <div className="flex items-center gap-2">
            <p className="text-white/70 text-xs">{currentStory.timestamp}</p>
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <Eye className="w-4 h-4" />
              <span>{currentStory.views ?? 0} views</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className={`w-full max-w-md aspect-[9/16] rounded-xl relative overflow-hidden bg-black`}>
        {currentStory && currentStory.type === "video" ? (
          <div className={`${mediaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-300 ease-out w-full h-full` }>
          <div className="w-full h-full relative">
            {!mediaLoaded && !mediaError && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {mediaError && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 text-white">Unable to load video</div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              onCanPlay={() => setMediaLoaded(true)}
              onError={() => setMediaError(true)}
            >
              {currentStory.src && <source src={currentStory.src} type="video/mp4" />}
            </video>
            {/* overlay play/pause when blocked or paused */}
            {(playbackBlocked || !isPlaying) && !mediaError && (
              <button
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  setPlaybackBlocked(false);
                  v.muted = isMuted;
                  v.play().then(() => setIsPlaying(true)).catch(() => setPlaybackBlocked(true));
                }}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/40 flex items-center justify-center text-white"
                aria-label="Play"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </button>
            )}
          </div>
          </div>
        ) : (
          // photo fallback
          <div className={`${mediaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-300 ease-out ${currentStory?.color || "bg-gray-600"} w-full h-full flex items-center justify-center relative`}>
            {!mediaLoaded && !mediaError && currentStory?.src && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {mediaError && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 text-white">Unable to load image</div>
            )}
            {currentStory && currentStory.src ? (
              <img
                src={currentStory.src}
                alt={currentStory.username + " story"}
                className="w-full h-full object-cover"
                onLoad={() => setMediaLoaded(true)}
                onError={() => setMediaError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-6xl font-bold opacity-20">STORY</span>
              </div>
            )}
          </div>
        )}

        {/* optional caption or overlay */}
        {currentStory?.caption && (
          <div className="absolute bottom-4 left-4 right-4 text-white text-sm bg-black/30 backdrop-blur-sm rounded-md px-3 py-2">
            {currentStory.caption}
          </div>
        )}
      </div>

      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="absolute left-4 text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="absolute right-4 text-white hover:bg-white/10"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 w-full max-w-md px-4 z-20">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full shadow-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={`text-white bg-black/0 p-2 rounded-md ${liked ? "text-red-400" : "text-white"}`}
            aria-label="Like"
          >
            <Heart className={`w-6 h-6 ${liked ? "fill-current" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const v = videoRef.current;
              setIsMuted((m) => {
                const next = !m;
                if (v) v.muted = next;
                return next;
              });
            }}
            className="text-white p-2 rounded-md bg-transparent"
            aria-label="Toggle sound"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </Button>
          <div className="flex items-center gap-2 text-white drop-shadow">
            <Eye className="w-5 h-5" />
            <span className="text-sm">{currentStory.views ?? 0} views</span>
          </div>
        </div>
      </div>
    </div>
  );
};
