import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Grid, Bookmark } from "lucide-react";

const profileStats = [
  { label: "posts", value: 42 },
  { label: "followers", value: 1234 },
  { label: "following", value: 567 },
];

const mockPosts = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  gradient: `from-${["sky", "blue", "cyan", "indigo", "teal", "blue"][i]}-400 via-${["green", "emerald", "lime", "green", "green", "emerald"][i]}-400 to-${["yellow", "amber", "gold", "yellow", "yellow", "amber"][i]}-400`,
}));

export default function Profile() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-48 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="gradient-primary text-white text-3xl">U</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Username</h1>
                  <div className="flex gap-8 text-sm">
                    {profileStats.map((stat) => (
                      <div key={stat.label}>
                        <span className="font-bold text-lg">{stat.value}</span>{" "}
                        <span className="text-muted-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-xl">
              <p className="font-semibold mb-1">Display name</p>
              <p className="text-sm text-muted-foreground">
                Bio text goes here. Share a bit about yourself! ✨
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
                <div className="grid grid-cols-3 gap-4">
                  {mockPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`aspect-square bg-gradient-to-br ${post.gradient} rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md`}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="saved" className="mt-0">
                <div className="text-center py-12 text-muted-foreground">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No saved posts yet</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
