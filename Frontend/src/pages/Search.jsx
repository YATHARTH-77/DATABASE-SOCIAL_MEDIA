import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, TrendingUp } from "lucide-react";

const trendingHashtags = [
  { tag: "#nature", posts: "2.4M posts" },
  { tag: "#foodie", posts: "1.8M posts" },
  { tag: "#travel", posts: "3.1M posts" },
  { tag: "#fitness", posts: "1.5M posts" },
];

const suggestedUsers = [
  { username: "photographer_pro", followers: "12.5K" },
  { username: "tech_guru", followers: "8.2K" },
  { username: "artist_life", followers: "15.8K" },
];

export default function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHashtags = trendingHashtags.filter((item) =>
    item.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = suggestedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* --- MODIFICATION START --- */}
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
      {/* --- MODIFICATION END --- */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* --- MODIFICATION START: Added responsive padding --- */}
          <Card className="p-4 sm:p-6 shadow-lg">
          {/* --- MODIFICATION END --- */}
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for users, posts, hashtags..."
                className="pl-12 h-12 text-md sm:text-lg rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Trending Hashtags</h2>
            </div>
            <div className="space-y-3">
              {filteredHashtags.length > 0 ? (
                filteredHashtags.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/hashtag/${item.tag.slice(1)}`)}
                >
                  {/* --- MODIFICATION START: Added min-w-0 for robust text wrapping --- */}
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">{item.tag}</p>
                  {/* --- MODIFICATION END --- */}
                    <p className="text-sm text-muted-foreground">{item.posts}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg gradient-primary flex-shrink-0 ml-2" />
                </div>
              ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No hashtags found</p>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Suggested Users</h2>
            <div className="space-y-3">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors gap-2"
                >
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => navigate(`/user/${user.username}`)}
                  >
                    <Avatar>
                      <AvatarFallback className="gradient-primary text-white">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* --- MODIFICATION START: Added min-w-0 for robust text wrapping --- */}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user.username}</p>
                    {/* --- MODIFICATION END --- */}
                      <p className="text-sm text-muted-foreground">{user.followers} followers</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 gradient-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0">
                    Follow
                  </button>
                </div>
              ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}