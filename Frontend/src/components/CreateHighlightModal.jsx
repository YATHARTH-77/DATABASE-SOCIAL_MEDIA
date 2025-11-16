import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, CheckSquare, Square } from "lucide-react";

const API_URL = "https://backend-sm-seven.vercel.app";

export function CreateHighlightModal({ onClose, onCreate, userId }) {
  const [archivedStories, setArchivedStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // 1. Fetch all archived stories for the user
  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/stories/archived?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setArchivedStories(data.stories);
        }
      } catch (err) {
        console.error("Failed to fetch stories", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, [userId]);

  // 2. Toggle story selection
  const handleSelectStory = (storyId) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    );
  };

  // 3. Handle highlight creation
  const handleCreate = async () => {
    if (!title) {
      // You can add a toast here
      return;
    }
    if (selectedStoryIds.length === 0) {
      // You can add a toast here
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/highlights/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          title: title,
          storyIds: selectedStoryIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Find the cover story URL to pass back
        const coverStory = archivedStories.find(s => s.story_id === selectedStoryIds[0]);
        onCreate({
          highlight_id: data.highlightId,
          title: title,
          cover_media_url: coverStory?.media_url || ''
        });
      }
    } catch (err) {
      console.error("Failed to create highlight", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg bg-background rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">New Highlight</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-purple-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="highlight-title">Title</Label>
            <Input
              id="highlight-title"
              placeholder="Highlight Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus-visible:ring-[#5A0395]"
            />
          </div>

          <Label>Select Stories</Label>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : archivedStories.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>You have no stories to add.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-2 bg-muted/50 rounded-lg">
              {archivedStories.map((story) => {
                const isSelected = selectedStoryIds.includes(story.story_id);
                return (
                  <div
                    key={story.story_id}
                    className="aspect-square rounded-md overflow-hidden relative cursor-pointer"
                    onClick={() => handleSelectStory(story.story_id)}
                  >
                    {/* Media */}
                    {story.media_type && story.media_type.startsWith("video") ? (
                      <video src={`${API_URL}${story.media_url}`} className="w-full h-full object-cover" />
                    ) : (
                      <img src={`${API_URL}${story.media_url}`} alt="Story" className="w-full h-full object-cover" />
                    )}
                    
                    {/* Selection Overlay */}
                    <div className={`absolute inset-0 ${isSelected ? "bg-black/40" : "bg-black/0"} transition-colors`}>
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6 text-white absolute top-2 right-2 bg-primary rounded-md" />
                      ) : (
                        <Square className="w-6 h-6 text-white absolute top-2 right-2 bg-black/30 rounded-md" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={isCreating || !title || selectedStoryIds.length === 0}
            className="gradient-sidebar text-white"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}