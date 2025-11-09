import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Image, Film, Smile, X, Loader2 } from "lucide-react";

// --- Helper Component for File Preview ---
function MediaPreview({ fileUrl, fileType, onRemove }) {
  const isVideo = fileType.startsWith("video/");
  
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
  
  // --- New State for Files and Previews ---
  const [postFiles, setPostFiles] = useState([]); // For Post (array)
  const [postPreviews, setPostPreviews] = useState([]); // For Post (array)
  
  const [momentFile, setMomentFile] = useState(null); // For Moment (single)
  const [momentPreview, setMomentPreview] = useState(null); // For Moment (single)

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // --- Refs for Hidden File Inputs ---
  const postInputRef = useRef(null);
  const momentInputRef = useRef(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tabParam = params.get("tab") || "post";
  
  // --- Cleanup for Preview URLs ---
  useEffect(() => {
    // This is crucial to prevent memory leaks
    return () => {
      postPreviews.forEach((url) => URL.revokeObjectURL(url));
      if (momentPreview) {
        URL.revokeObjectURL(momentPreview);
      }
    };
  }, [postPreviews, momentPreview]);

  // --- File Handler for POSTS (multiple) ---
  const handlePostFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Simple validation (e.g., max 10 files)
    if (files.length + postFiles.length > 10) {
      toast({
        title: "Error",
        description: "You can only upload up to 10 files for a post.",
        variant: "destructive",
      });
      return;
    }

    setPostFiles((prev) => [...prev, ...files]);

    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setPostPreviews((prev) => [...prev, ...previewUrls]);
  };

  // --- File Handler for MOMENT (single) ---
  const handleMomentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMomentFile(file);
    
    // Revoke old preview if it exists
    if (momentPreview) {
      URL.revokeObjectURL(momentPreview);
    }
    setMomentPreview(URL.createObjectURL(file));
  };
  
  // --- Remove Handlers ---
  const removePostPreview = (index) => {
    setPostFiles((prev) => prev.filter((_, i) => i !== index));
    setPostPreviews((prev) => {
      const urlToRemove = prev[index];
      URL.revokeObjectURL(urlToRemove); // Revoke immediately
      return prev.filter((_, i) => i !== index);
    });
  };
  
  const removeMomentPreview = () => {
    setMomentFile(null);
    if (momentPreview) {
      URL.revokeObjectURL(momentPreview);
    }
    setMomentPreview(null);
  };
  
  // --- Clear All Inputs ---
  const clearPostForm = () => {
    setCaption("");
    setHashtags("");
    setPostFiles([]);
    postPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPostPreviews([]);
  };

  // --- 🚀 API Call: Create Post ---
  const handlePost = async () => {
    if (postFiles.length === 0) {
      toast({ title: "Error", description: "Please upload at least one media file.", variant: "destructive" });
      return;
    }
    if (!caption) {
      toast({ title: "Error", description: "Please add a caption.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    
    // !! IMPORTANT: Replace '1' with the actual logged-in user's ID
    formData.append('user_id', '1'); 
    formData.append('caption', caption);
    formData.append('hashtags', hashtags);
    postFiles.forEach((file) => {
      formData.append('media', file); // 'media' must match server
    });

    try {
      const response = await fetch('http://localhost:5000/api/posts/create', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create post.");
      }

      toast({ title: "Post created!", description: "Your post is now live." });
      clearPostForm();

    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 🚀 API Call: Create Moment ---
  const handleMomentCreate = async () => {
    if (!momentFile) {
      toast({ title: "Error", description: "Please upload a file for your moment.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    
    // !! IMPORTANT: Replace '1' with the actual logged-in user's ID
    formData.append('user_id', '1');
    formData.append('media', momentFile); // 'media' must match server

    try {
      const response = await fetch('http://localhost:5000/api/stories/create', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create moment.");
      }

      toast({ title: "Moment created!", description: "Your moment is now live for 24 hours." });
      removeMomentPreview(); // Clear the form

    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue={tabParam} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="post">Create Post</TabsTrigger>
              <TabsTrigger value="moment">Create Moment</TabsTrigger>
            </TabsList>

            {/* --- POST TAB --- */}
            <TabsContent value="post">
              <Card className="shadow-lg overflow-hidden">
                <div className="p-6 border-b gradient-primary">
                  <h1 className="text-2xl font-bold text-white">Create New Post</h1>
                </div>

                <div className="p-6 space-y-6">
                  {/* --- Hidden File Input --- */}
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    ref={postInputRef}
                    onChange={handlePostFileChange}
                    className="hidden"
                  />
                  
                  {/* --- Clickable Upload Zone --- */}
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
                  
                  {/* --- Post Preview Area --- */}
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

                  {/* --- Caption & Hashtags (Unchanged) --- */}
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Caption</label>
                    <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} />
                    ...
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Hashtags</label>
                    <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handlePost}
                      disabled={isLoading}
                      className="flex-1 gradient-primary text-white font-semibold rounded-xl h-12"
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
                <div className="p-6 border-b gradient-primary">
                  <h1 className="text-2xl font-bold text-white">Create New Moment</h1>
                </div>

                <div className="p-6 space-y-6">
                  {/* --- Hidden File Input --- */}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    ref={momentInputRef}
                    onChange={handleMomentFileChange}
                    className="hidden"
                  />
                  
                  {/* --- Clickable Upload Zone --- */}
                  <div
                    onClick={() => momentInputRef.current.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 md:p-12"
                  >
                    <div className="flex justify-center gap-4 mb-4">
                      <Image className="w-12 h-12 text-muted-foreground" />
                      <Film className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold mb-2">Upload Moment Media</p>
                    <p className="text-sm text-muted-foreground">
                      Choose an image or video for your moment
                    </p>
                  </div>

                  {/* --- Moment Preview Area --- */}
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Preview</label>
                    <div className="flex justify-center">
                      {momentPreview ? (
                        <div className="relative w-48 aspect-[9/16] rounded-2xl shadow-lg overflow-hidden">
                          {momentFile?.type.startsWith("video/") ? (
                            <video src={momentPreview} autoPlay loop muted className="w-full h-full object-cover" />
                          ) : (
                            <img src={momentPreview} alt="Moment Preview" className="w-full h-full object-cover" />
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
                        <div className={`w-48 aspect-[9/16] bg-gradient-to-br from-emerald-400 via-green-500 to-lime-400 rounded-2xl flex items-center justify-center shadow-lg`}>
                          <span className="text-white text-4xl font-bold opacity-30">MOMENT</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleMomentCreate}
                      disabled={isLoading || !momentFile}
                      className="flex-1 gradient-primary text-white font-semibold rounded-xl h-12"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Share Moment"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-12"
                      onClick={removeMomentPreview}
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
    </div>
  );
}