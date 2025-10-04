import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const StoryViewer = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    setLiked(false);
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, stories.length, onClose]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 w-full max-w-md px-4">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 w-full max-w-md px-4">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarFallback className="gradient-primary text-white">
            {currentStory.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-white font-semibold">{currentStory.username}</p>
          <p className="text-white/70 text-xs">{currentStory.timestamp}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className={`w-full max-w-md aspect-[9/16] ${currentStory.color} rounded-xl relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-6xl font-bold opacity-20">STORY</span>
        </div>
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 w-full max-w-md px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLike}
          className={`text-white hover:bg-white/10 ${liked ? "text-red-500" : ""}`}
        >
          <Heart className={`w-6 h-6 ${liked ? "fill-current" : ""}`} />
        </Button>
        {currentStory.isOwn && (
          <div className="flex items-center gap-2 text-white">
            <Eye className="w-5 h-5" />
            <span className="text-sm">{currentStory.views} views</span>
          </div>
        )}
      </div>
    </div>
  );
};
