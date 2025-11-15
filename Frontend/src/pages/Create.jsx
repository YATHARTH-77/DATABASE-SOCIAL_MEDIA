import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Image, Film, Smile, X, Loader2 } from "lucide-react";
// import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"; // Removed

// --- Base URL for our API ---
const API_URL = "http://localhost:5000";

// --- Helper Component for File Preview ---
function MediaPreview({ fileUrl, fileType, onRemove }) {
  const isVideo = fileType && fileType.startsWith("video/");
  
  return (
    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
      {isVideo ? (
        <video src={fileUrl} className="w-full h-full object-cover" />
      ) : (
        <img src={fileUrl} alt="Preview" className="w-full h-full object-cover" />
      )}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 rounded-full"
        onClick={onRemove}
      >
        <X className="w-4 h-4" />
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
                        url: `${API_URL}${result.story.media_url}`,
                        type: result.story.media_type,
                        owner_username: result.story.owner_username
                    });
                    toast({
                      title: "Story Loaded",
                      description: `Reposting ${result.story.owner_username}'s story.`,
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

  // --- Handlers ---

  const handlePostFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
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
      let fileToUpload;
      
      if (momentFile) {
        // Case 1: New file upload
        fileToUpload = momentFile;
      } else if (repostMedia) {
        // Case 2: Reposting - Fetch the original media blob
        toast({ title: "Processing Repost", description: "Preparing media..." });
        const response = await fetch(repostMedia.url);
        const blob = await response.blob();
        
        const filename = repostMedia.url.split('/').pop();
        // Create a File object from the blob
        fileToUpload = new File([blob], filename, { type: repostMedia.type });
      }
      
      formData.append('media', fileToUpload);

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
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </main>
    );
  }

  // Determine which media to display (preview vs repost)
  const displayMedia = momentPreview ? { url: momentPreview, type: momentFile?.type } : repostMedia;

  return (
    <>
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
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
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="post">Create Post</TabsTrigger>
              <TabsTrigger value="moment">Create Moment</TabsTrigger>
            </TabsList>

            {/* --- POST TAB --- */}
            <TabsContent value="post">
              <Card className="shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-br from-[#4b0082] via-[#6a00a3] to-[#2e0051]">
                  <h1 className="text-2xl font-bold text-white">Create New Post</h1>
                </div>
                <div className="p-6 space-y-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    ref={postInputRef}
                    onChange={handlePostFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => postInputRef.current.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 md:p-12"
                  >
                    <div className="flex justify-center gap-4 mb-4">
                      <Image className="w-12 h-12 text-muted-foreground" />
                      <Film className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold mb-2">Upload Media</p>
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or click to select photos/videos (Max 10)
                    </p>
                  </div>
                  {postPreviews.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto p-2 bg-secondary/30 rounded-lg">
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
                    <label className="text-sm font-semibold mb-2 block">Caption</label>
                    <Textarea
                      placeholder="Write a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-[120px] rounded-xl"
                    />
                    <div className="flex items-center gap-2 mt-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                         <Smile className="w-4 h-4" />
                       </Button>
                       <span className="text-xs text-muted-foreground ml-auto">
                         {caption.length}/2200
                       </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Hashtags</label>
                    <Input
                      placeholder="#hashtags (separate with spaces)"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handlePost}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-br from-[#4b0082] via-[#6a00a3] to-[#2e0051] text-white font-semibold rounded-xl h-12"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-12"
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
              <Card className="shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-br from-[#4b0082] via-[#6a00a3] to-[#2e0051]">
                  <h1 className="text-2xl font-bold text-white">Create New Moment</h1>
                </div>

                <div className="p-6 space-y-6">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    ref={momentInputRef}
                    onChange={handleMomentFileChange}
                    className="hidden"
                  />
                  
                  {/* --- Upload Area (Changes based on Repost) --- */}
                  <div
                    onClick={() => momentInputRef.current.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 md:p-12"
                  >
                    <div className="flex justify-center gap-4 mb-4">
                      <Image className="w-12 h-12 text-muted-foreground" />
                      <Film className="w-12 h-12 text-muted-foreground" />
                    </div>
                    {repostMedia ? (
                        <>
                            <p className="text-lg font-semibold mb-2">
                                Reposting @{repostMedia.owner_username}'s Story
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Upload new media to override, or click "Share Moment" to repost this.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-semibold mb-2">Upload Moment Media</p>
                            <p className="text-sm text-muted-foreground">
                                Choose an image or video for your moment
                            </p>
                        </>
                    )}
                  </div>

                  {/* --- Preview Area (Shows uploaded OR reposted media) --- */}
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Preview</label>
                    <div className="flex justify-center">
                      {displayMedia ? (
                        <div className="relative w-48 aspect-[9/16] rounded-2xl shadow-lg overflow-hidden">
                          {displayMedia.type && displayMedia.type.startsWith("video/") ? (
                            <video src={displayMedia.url} autoPlay loop muted className="w-full h-full object-cover" />
                          ) : (
                            <img src={displayMedia.url} alt="Moment Preview" className="w-full h-full object-cover" />
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full z-10"
                            onClick={removeMomentPreview}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative w-48 aspect-[9/16] rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-[#4b0082] via-[#6a00a3] to-[#2e0051]">
                          <div className="absolute inset-0 bg-black/20 rounded-2xl z-10 pointer-events-none" />
                          <div className="relative z-20 flex items-center justify-center w-full h-full">
                            <span className="text-white text-4xl font-bold opacity-30">MOMENT</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* --- Tags Input --- */}
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Tag Users</label>
                    <Input
                      placeholder="username (separate with spaces)"
                      value={storyTags}
                      onChange={(e) => setStoryTags(e.target.value.replace(/@/g, ''))}
                      className="rounded-xl"
                    />
                  </div>
                  
                  {/* --- Buttons --- */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleMomentCreate}
                      // Enable button if we have a file OR we are reposting valid media
                      disabled={isLoading || (!momentFile && !repostMedia)}
                      className="flex-1 bg-gradient-to-br from-[#4b0082] via-[#6a00a3] to-[#2e0051] text-white font-semibold rounded-xl h-12"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Share Moment"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-12"
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