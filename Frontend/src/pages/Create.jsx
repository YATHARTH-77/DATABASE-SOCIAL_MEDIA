import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Image, Film, Smile, X, Loader2 } from "lucide-react";

// --- Base URL for our API ---
const API_URL = "https://backend-sm-seven.vercel.app";

// --- Emoji Picker Component ---
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
  '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩',
  '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵',
  '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫',
  '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
  '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮',
  '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '👍', '👎', '👏', '🙌',
  '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨',
  '⭐', '🌟', '💫', '💥', '💯', '🎉', '🎊', '🎈', '🎁', '🏆'
];

function EmojiPicker({ onEmojiSelect, onClose }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-12 left-0 bg-white border-2 border-purple-300 rounded-lg shadow-lg p-2 sm:p-3 z-20 w-60 sm:w-72 max-h-40 sm:max-h-48 overflow-y-auto emoji-picker-scrollbar"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#9333ea #f3e8ff'
      }}
    >
      <style>{`
        .emoji-picker-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .emoji-picker-scrollbar::-webkit-scrollbar-track {
          background: #f3e8ff;
          border-radius: 4px;
        }
        
        .emoji-picker-scrollbar::-webkit-scrollbar-thumb {
          background: #9333ea;
          border-radius: 4px;
        }
        
        .emoji-picker-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7e22ce;
        }
      `}</style>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-0.5 sm:gap-1">
        {EMOJI_LIST.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onEmojiSelect(emoji)}
            className="text-xl sm:text-2xl hover:bg-purple-100 rounded p-0.5 sm:p-1 transition-colors flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Allowed file types ---
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 
  'video/webm', 
  'video/quicktime', // MOV
  'video/x-msvideo', // AVI
  'video/x-matroska', // MKV
  'video/mpeg',
  'video/ogg',
  'video/3gpp',
  'video/3gpp2'
];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// --- Helper Component for File Preview ---
function MediaPreview({ fileUrl, fileType, onRemove }) {
  const isVideo = fileType && fileType.startsWith("video/");
  
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-purple-200">
      {isVideo ? (
        <video src={fileUrl} className="w-full h-full object-cover" />
      ) : (
        <img src={fileUrl} alt="Preview" className="w-full h-full object-cover" />
      )}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full"
        onClick={onRemove}
      >
        <X className="w-3 h-3 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
}

export default function Create() {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  
  const [postFiles, setPostFiles] = useState([]);
  const [postPreviews, setPostPreviews] = useState([]);
  
  const [momentFile, setMomentFile] = useState(null);
  const [momentPreview, setMomentPreview] = useState(null);
  
  // --- NEW: State for reposting ---
  const [repostMedia, setRepostMedia] = useState(null); // { url, type, owner_username }
  const [repostLoading, setRepostLoading] = useState(false);
  
  // --- NEW: Tag Users & Repost ID ---
  const [storyTags, setStoryTags] = useState("");
  const [searchParams] = useSearchParams();
  const repostStoryId = searchParams.get('repost_id');

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // --- Emoji Picker State ---
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const captionTextareaRef = useRef(null);
  
  const postInputRef = useRef(null);
  const momentInputRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const tabParam = params.get("tab") || "post";
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      toast({ title: "Error", description: "You must be logged in to create a post.", variant: "destructive" });
      navigate("/login");
    }
  }, [navigate, toast]);

  // --- NEW: Handle repost ID logic ---
  useEffect(() => {
    // Ensure we are on the 'moment' tab if repost_id is present
    if (repostStoryId && tabParam !== 'moment') {
      navigate(`/create?tab=moment&repost_id=${repostStoryId}`, { replace: true });
      return;
    }

    // Fetch the story details if we have an ID but haven't loaded the media yet
    if (repostStoryId && user && !repostMedia && !repostLoading) {
        setRepostLoading(true);
        toast({
            title: "Loading Story",
            description: `Fetching story details...`,
        });

        const fetchRepostStory = async () => {
            try {
                const response = await fetch(`${API_URL}/api/stories/${repostStoryId}`);
                const result = await response.json();

                if (response.ok && result.success) {
                    setRepostMedia({
                      url: result.story.media_url,
                      type: result.story.media_type,
                      owner_username: result.story.username
                  });
                    toast({
                      title: "Story Loaded",
                      description: `Reposting ${result.story.username}'s story.`,
                    });
                } else {
                    throw new Error(result.message || "Failed to fetch original story.");
                }
            } catch (error) {
                console.error("Error fetching repost story:", error);
                toast({
                    title: "Error",
                    description: `Could not load story: ${error.message}`,
                    variant: "destructive",
                });
                // Clear invalid repost ID
                navigate('/create?tab=moment', { replace: true });
            } finally {
                setRepostLoading(false);
            }
        };
        fetchRepostStory();
    }
  }, [repostStoryId, user, repostMedia, repostLoading, tabParam, navigate, toast]);

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      postPreviews.forEach((url) => URL.revokeObjectURL(url));
      if (momentPreview) {
        URL.revokeObjectURL(momentPreview);
      }
    };
  }, [postPreviews, momentPreview]);

  // --- File validation helper ---
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return false;
    }
    return true;
  };

  // --- Handlers ---

  const handlePostFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Validate file types
    const invalidFiles = files.filter(file => !validateFile(file));
    if (invalidFiles.length > 0) {
      toast({ 
        title: "Invalid File Type", 
        description: "Only image and video files are allowed.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (files.length + postFiles.length > 10) {
      toast({ title: "Error", description: "Max 10 files allowed.", variant: "destructive" });
      return;
    }
    setPostFiles((prev) => [...prev, ...files]);
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setPostPreviews((prev) => [...prev, ...previewUrls]);
  };

  const handleMomentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!validateFile(file)) {
      toast({ 
        title: "Invalid File Type", 
        description: "Only image and video files are allowed.", 
        variant: "destructive" 
      });
      return;
    }
    
    // If user uploads a new file, it overrides the repost media
    setRepostMedia(null); 
    setMomentFile(file);
    
    if (momentPreview) URL.revokeObjectURL(momentPreview);
    setMomentPreview(URL.createObjectURL(file));
  };
  
  const removePostPreview = (index) => {
    setPostFiles((prev) => prev.filter((_, i) => i !== index));
    setPostPreviews((prev) => {
      const urlToRemove = prev[index];
      URL.revokeObjectURL(urlToRemove); 
      return prev.filter((_, i) => i !== index);
    });
  };
  
  const removeMomentPreview = () => {
    setMomentFile(null);
    if (momentPreview) URL.revokeObjectURL(momentPreview);
    setMomentPreview(null);
    
    // Also clear repost state
    setRepostMedia(null);
    if (repostStoryId) {
      navigate('/create?tab=moment', { replace: true });
    }
  };
  
  const clearPostForm = () => {
    setCaption("");
    setHashtags("");
    setPostFiles([]);
    postPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPostPreviews([]);
    setShowEmojiPicker(false);
  };

  const clearMomentForm = () => {
    setMomentFile(null);
    if (momentPreview) URL.revokeObjectURL(momentPreview);
    setMomentPreview(null);
    setStoryTags("");
    
    setRepostMedia(null);
    if (repostStoryId) {
      navigate('/create?tab=moment', { replace: true });
    }
  };

  // --- API Calls ---

  const handleEmojiSelect = (emoji) => {
    const textarea = captionTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newCaption = caption.substring(0, start) + emoji + caption.substring(end);
    
    setCaption(newCaption);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handlePost = async () => {
    if (!user) return;
    if (postFiles.length === 0) {
      toast({ title: "Error", description: "Please upload media.", variant: "destructive" });
      return;
    }
    if (!caption) {
      toast({ title: "Error", description: "Please add a caption.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('user_id', user.id); 
    formData.append('caption', caption);
    formData.append('hashtags', hashtags);
    postFiles.forEach((file) => formData.append('media', file));

    try {
      const response = await fetch(`${API_URL}/api/posts/create`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      toast({ title: "Post created!", description: "Your post is now live." });
      clearPostForm();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMomentCreate = async () => {
    if (!user) return;
    // Must have either a new file OR repost media
    if (!momentFile && !repostMedia) {
      toast({ title: "Error", description: "Please upload a file or select a story to repost.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('user_id', user.id);

    try {
      if (momentFile) {
      // Case 1: New file upload
      formData.append('media', momentFile);
    } else if (repostMedia && repostStoryId) {
      // Case 2: Reposting - just send the story ID
      formData.append('repost_story_id', repostStoryId);
    }

      if (storyTags) {
        formData.append('tags', storyTags);
      }

      const response = await fetch(`${API_URL}/api/stories/create`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      toast({ title: "Moment created!", description: "Your moment is now live for 24 hours." });
      clearMomentForm();
      navigate('/home'); 

    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user || repostLoading) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 md:ml-64 lg:ml-72 xl:ml-80 2xl:ml-[22rem] pb-20 md:pb-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#5A0395] animate-spin" />
      </main>
    );
  }

  // Determine which media to display (preview vs repost)
  const displayMedia = momentPreview ? { url: momentPreview, type: momentFile?.type } : repostMedia;

  return (
    <>
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 md:ml-64 lg:ml-72 xl:ml-80 2xl:ml-[22rem] pb-20 md:pb-8 transition-all duration-300">
        <div className="max-w-2xl mx-auto">
          <Tabs value={tabParam} onValueChange={(value) => {
             // Clear repost_id when switching away from moment tab
             if (repostStoryId && value !== 'moment') {
               navigate('/create', { replace: true });
             } else {
               const url = repostStoryId ? `/create?tab=moment&repost_id=${repostStoryId}` : `/create?tab=${value}`;
               navigate(url, { replace: true });
             }
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-gradient-to-r from-purple-100 to-purple-50 border-2 border-purple-300">
              <TabsTrigger value="post" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1D0C69] data-[state=active]:to-[#5A0395] data-[state=active]:text-white">Create Post</TabsTrigger>
              <TabsTrigger value="moment" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1D0C69] data-[state=active]:to-[#5A0395] data-[state=active]:text-white">Create Moment</TabsTrigger>
            </TabsList>

            {/* --- POST TAB --- */}
            <TabsContent value="post">
              <Card className="shadow-lg overflow-hidden border-2 border-purple-300">
                <div className="p-4 sm:p-5 md:p-6 border-b-2 border-purple-300 bg-gradient-to-r from-[#1D0C69] to-[#5A0395]">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Create New Post</h1>
                </div>
                <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-white">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.heic,.heif"
                    ref={postInputRef}
                    onChange={handlePostFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => postInputRef.current.click()}
                    className="border-2 border-dashed border-purple-300 rounded-xl p-4 sm:p-6 md:p-8 lg:p-12 text-center hover:border-[#5A0395] transition-colors cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100"
                  >
                    <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <Image className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#5A0395]" />
                      <Film className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#5A0395]" />
                    </div>
                    <p className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-[#1D0C69]">Upload Media</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      All image & video formats supported (Max 10 files)
                    </p>
                  </div>
                  {postPreviews.length > 0 && (
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      {postPreviews.map((url, index) => (
                        <MediaPreview
                          key={index}
                          fileUrl={url}
                          fileType={postFiles[index]?.type || 'image/jpeg'}
                          onRemove={() => removePostPreview(index)}
                        />
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="text-xs sm:text-sm font-semibold mb-2 block text-[#1D0C69]">Caption</label>
                    <Textarea
                      ref={captionTextareaRef}
                      placeholder="Write a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-[100px] sm:min-h-[120px] rounded-xl border-2 border-purple-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#5A0395] text-sm sm:text-base"
                    />
                    <div className="flex items-center gap-2 mt-2 relative">
                       <Button 
                         type="button"
                         variant="ghost" 
                         size="icon" 
                         className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-purple-100 hidden md:flex"
                         onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                       >
                         <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5A0395]" />
                       </Button>
                       {showEmojiPicker && (
                         <EmojiPicker 
                           onEmojiSelect={handleEmojiSelect}
                           onClose={() => setShowEmojiPicker(false)}
                         />
                       )}
                       <span className="text-[10px] sm:text-xs text-gray-600 ml-auto">
                         {caption.length}/2200
                       </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-semibold mb-2 block text-[#1D0C69]">Hashtags</label>
                    <Input
                      placeholder="#hashtags (separate with spaces)"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      className="rounded-xl border-2 border-purple-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#5A0395] text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                    <Button
                      onClick={handlePost}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] text-white font-semibold rounded-xl h-10 sm:h-12 hover:opacity-90 text-sm sm:text-base"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : "Post"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-10 sm:h-12 border-2 border-purple-300 hover:bg-purple-50 text-sm sm:text-base"
                      onClick={clearPostForm}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* --- MOMENT TAB --- */}
            <TabsContent value="moment">
              <Card className="shadow-lg overflow-hidden border-2 border-purple-300">
                <div className="p-4 sm:p-5 md:p-6 border-b-2 border-purple-300 bg-gradient-to-r from-[#1D0C69] to-[#5A0395]">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Create New Moment</h1>
                </div>

                <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 bg-white">
                  <input
                    type="file"
                    accept="image/*,video/*,.heic,.heif"
                    ref={momentInputRef}
                    onChange={handleMomentFileChange}
                    className="hidden"
                  />
                  
                  {/* --- Upload Area (Changes based on Repost) --- */}
                  <div
                    onClick={() => momentInputRef.current.click()}
                    className="border-2 border-dashed border-purple-300 rounded-xl p-4 sm:p-6 md:p-8 lg:p-12 text-center hover:border-[#5A0395] transition-colors cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100"
                  >
                    <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <Image className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#5A0395]" />
                      <Film className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#5A0395]" />
                    </div>
                    {repostMedia ? (
                        <>
                            <p className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-[#1D0C69]">
                                Reposting @{repostMedia.owner_username}'s Story
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                                Upload new media to override, or click "Share Moment" to repost this.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-[#1D0C69]">Upload Moment Media</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                                All image & video formats supported
                            </p>
                        </>
                    )}
                  </div>

                  {/* --- Preview Area (Shows uploaded OR reposted media) --- */}
                  <div>
                    <label className="text-xs sm:text-sm font-semibold mb-2 block text-[#1D0C69]">Preview</label>
                    <div className="flex justify-center">
                      {displayMedia ? (
                        <div className="relative w-36 sm:w-44 md:w-48 aspect-[9/16] rounded-2xl shadow-lg overflow-hidden border-2 border-purple-300">
                          {displayMedia.type && displayMedia.type.startsWith("video/") ? (
                            <video src={displayMedia.url} autoPlay loop muted className="w-full h-full object-cover" />
                          ) : (
                            <img src={displayMedia.url} alt="Moment Preview" className="w-full h-full object-cover" />
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full z-10"
                            onClick={removeMomentPreview}
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative w-36 sm:w-44 md:w-48 aspect-[9/16] rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-[#1D0C69] to-[#5A0395] border-2 border-purple-300">
                          <div className="absolute inset-0 bg-black/20 rounded-2xl z-10 pointer-events-none" />
                          <div className="relative z-20 flex items-center justify-center w-full h-full">
                            <span className="text-white text-2xl sm:text-3xl md:text-4xl font-bold opacity-30">MOMENT</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* --- Tags Input --- */}
                  <div>
                    <label className="text-xs sm:text-sm font-semibold mb-2 block text-[#1D0C69]">Tag Users</label>
                    <Input
                      placeholder="username (separate with spaces)"
                      value={storyTags}
                      onChange={(e) => setStoryTags(e.target.value.replace(/@/g, ''))}
                      className="rounded-xl border-2 border-purple-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#5A0395] text-sm sm:text-base"
                    />
                  </div>
                  
                  {/* --- Buttons --- */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                    <Button
                      onClick={handleMomentCreate}
                      // Enable button if we have a file OR we are reposting valid media
                      disabled={isLoading || (!momentFile && !repostMedia)}
                      className="flex-1 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] text-white font-semibold rounded-xl h-10 sm:h-12 hover:opacity-90 text-sm sm:text-base"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : "Share Moment"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-10 sm:h-12 border-2 border-purple-300 hover:bg-purple-50 text-sm sm:text-base"
                      onClick={clearMomentForm}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}