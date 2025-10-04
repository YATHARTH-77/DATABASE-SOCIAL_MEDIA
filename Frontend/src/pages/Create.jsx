import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Image, Film, Smile } from "lucide-react";

export default function Create() {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [momentColor, setMomentColor] = useState("bg-gradient-to-br from-sky-400 via-green-400 to-yellow-400");
  const { toast } = useToast();

  const handlePost = () => {
    if (!caption) {
      toast({
        title: "Error",
        description: "Please add a caption to your post",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Post created!",
      description: "Your post has been shared successfully.",
    });
    setCaption("");
    setHashtags("");
  };

  const handleMomentCreate = () => {
    toast({
      title: "Moment created!",
      description: "Your moment has been shared successfully.",
    });
  };

  const momentColors = [
    "bg-gradient-to-br from-sky-400 via-green-400 to-yellow-400",
    "bg-gradient-to-br from-blue-400 via-emerald-400 to-amber-400",
    "bg-gradient-to-br from-cyan-400 via-lime-400 to-gold-400",
    "bg-gradient-to-br from-indigo-400 via-green-400 to-yellow-400",
    "bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500",
    "bg-gradient-to-br from-teal-400 via-green-400 to-yellow-400",
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-48 flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="post" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="post">Create Post</TabsTrigger>
              <TabsTrigger value="moment">Create Moment</TabsTrigger>
            </TabsList>

            <TabsContent value="post">
              <Card className="shadow-lg overflow-hidden">
                <div className="p-6 border-b gradient-primary">
                  <h1 className="text-2xl font-bold text-white">Create New Post</h1>
                </div>

                <div className="p-6 space-y-6">
                  <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                    <div className="flex justify-center gap-4 mb-4">
                      <Image className="w-12 h-12 text-muted-foreground" />
                      <Film className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold mb-2">Upload Media</p>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to select photos/videos
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports JPG, PNG, GIF, MP4 (Max 10MB)
                    </p>
                  </div>

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

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handlePost}
                      className="flex-1 gradient-primary text-white font-semibold rounded-xl h-12"
                    >
                      Post
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-12"
                      onClick={() => {
                        setCaption("");
                        setHashtags("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="moment">
              <Card className="shadow-lg overflow-hidden">
                <div className="p-6 border-b gradient-primary">
                  <h1 className="text-2xl font-bold text-white">Create New Moment</h1>
                </div>

                <div className="p-6 space-y-6">
                  <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                    <div className="flex justify-center gap-4 mb-4">
                      <Image className="w-12 h-12 text-muted-foreground" />
                      <Film className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold mb-2">Upload Moment Media</p>
                    <p className="text-sm text-muted-foreground">
                      Choose an image or video for your moment (24 hour duration)
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports JPG, PNG, GIF, MP4 (Max 10MB)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Background Theme</label>
                    <div className="grid grid-cols-6 gap-3">
                      {momentColors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMomentColor(color)}
                          className={`w-full aspect-square rounded-xl ${color} transition-all hover:scale-110 ${
                            momentColor === color ? "ring-4 ring-primary ring-offset-2" : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Preview</label>
                    <div className="flex justify-center">
                      <div className={`w-48 aspect-[9/16] ${momentColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <span className="text-white text-4xl font-bold opacity-30">MOMENT</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleMomentCreate}
                      className="flex-1 gradient-primary text-white font-semibold rounded-xl h-12"
                    >
                      Share Moment
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-12"
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
