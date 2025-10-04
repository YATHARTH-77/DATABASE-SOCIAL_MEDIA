import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const mockUsers = {
  adventurer: {
    displayName: "Adventure Seeker",
    bio: "Exploring the world one trail at a time 🌲🏔️",
    posts: 42,
    followers: 1234,
    following: 567,
    postCount: 6,
  },
  foodie: {
    displayName: "Food Lover",
    bio: "Home chef | Recipe creator | Food photography 🍝✨",
    posts: 89,
    followers: 3421,
    following: 234,
    postCount: 8,
  },
  photographer_pro: {
    displayName: "Pro Photographer",
    bio: "Professional photographer | Available for bookings 📸",
    posts: 156,
    followers: 12500,
    following: 89,
    postCount: 9,
  },
  tech_guru: {
    displayName: "Tech Enthusiast",
    bio: "Tech reviews & tutorials | DM for collabs 💻",
    posts: 234,
    followers: 8200,
    following: 456,
    postCount: 12,
  },
  artist_life: {
    displayName: "Digital Artist",
    bio: "Creating art daily | Commissions open 🎨",
    posts: 301,
    followers: 15800,
    following: 123,
    postCount: 15,
  },
};

const mockPosts = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  gradient: `from-${["sky", "blue", "cyan", "indigo", "teal", "blue", "sky", "blue", "cyan", "indigo", "teal", "blue"][i]}-400 via-${["green", "emerald", "lime", "green", "green", "emerald", "green", "emerald", "lime", "green", "green", "emerald"][i]}-400 to-${["yellow", "amber", "gold", "yellow", "yellow", "amber", "yellow", "amber", "gold", "yellow", "yellow", "amber"][i]}-400`,
}));

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  
  const user = mockUsers[username?.toLowerCase()];

  if (!user) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="ml-48 flex-1 p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">User not found</h1>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-48 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Card className="p-8 shadow-lg">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="gradient-primary text-white text-3xl">
                  {username?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{username}</h1>
                <div className="flex gap-8 text-sm mb-4">
                  <div>
                    <span className="font-bold text-lg">{user.posts}</span>{" "}
                    <span className="text-muted-foreground">posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-lg">{user.followers}</span>{" "}
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-lg">{user.following}</span>{" "}
                    <span className="text-muted-foreground">following</span>
                  </div>
                </div>
                <Button className="gradient-primary text-white">Follow</Button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-xl">
              <p className="font-semibold mb-1">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-bold mb-4">Posts</h2>
              <div className="grid grid-cols-3 gap-4">
                {mockPosts.slice(0, user.postCount).map((post) => (
                  <div
                    key={post.id}
                    className={`aspect-square bg-gradient-to-br ${post.gradient} rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
