import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, SearchIcon, Hash, User } from "lucide-react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

// --- Base URL for our API ---
const API_URL = "http://localhost:5000";

// --- Helper Component for User Cards (MODIFIED) ---
function UserCard({ user, onUserClick }) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-transparent rounded-lg border border-white/10 cursor-pointer hover:bg-white/5"
      onClick={() => onUserClick(user.username)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.profile_pic_url ? `${API_URL}${user.profile_pic_url}` : ''} />
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold truncate text-white">{user.username}</p>
          <p className="text-sm text-white/80 truncate">{user.follower_count} Followers</p>
        </div>
      </div>
    </div>
  );
}
// --- End of UserCard Component ---

export default function Search() {
  const navigate = useNavigate();
  
  // --- State for Search Page ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  
  // --- Loading States ---
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // --- Fetch Trending and Suggested Data on Load ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingInitial(true);
      try {
        // Fetch trending hashtags
        const hashRes = await fetch(`${API_URL}/api/search/trending-hashtags`);
        const hashData = await hashRes.json();
        if (hashData.success) {
          setTrendingHashtags(hashData.hashtags);
        }

        // Fetch suggested users
        const userRes = await fetch(`${API_URL}/api/search/suggested-users`);
        const userData = await userRes.json();
        if (userData.success) {
          setSuggestedUsers(userData.users);
        }
      } catch (error) {
        console.error("Failed to fetch initial search data:", error);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- Debounced Search Effect ---
  useEffect(() => {
    // Clear results if search is empty
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    // Set a timer to avoid searching on every keystroke
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/search/users?q=${searchTerm}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.users);
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms delay

    // Cleanup function to clear the timer
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const handleHashtagClick = (tag) => {
    // This function now works because you have a backend route for it
    navigate(`/hashtag/${tag}`);
  };

  // --- Render Functions for Clarity ---
  const renderInitialContent = () => (
    <div className="space-y-6">
      {/* --- Trending Hashtags --- */}
      <Card className="p-4 relative overflow-hidden">
        <BackgroundGradientAnimation
          containerClassName="absolute inset-0 rounded-lg"
          interactive={false}
          gradientBackgroundStart="#4b0082"
          gradientBackgroundEnd="#2e0051"
          firstColor="75,0,130"
          secondColor="106,0,163"
          thirdColor="46,0,81"
          fourthColor="160,60,170"
          fifthColor="120,80,200"
        />
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-white">
            <Hash className="w-5 h-5 mr-2 text-white/90" />
            Trending Hashtags
          </h2>
          {isLoadingInitial ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {trendingHashtags.map((tag) => (
                <div
                  key={tag.hashtag_text}
                  onClick={() => handleHashtagClick(tag.hashtag_text)}
                  className="p-2 rounded-lg cursor-pointer"
                >
                  <p className="font-semibold text-white">#{tag.hashtag_text}</p>
                  <p className="text-sm text-white/80">{tag.post_count} posts</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* --- Suggested Users --- */}
      <Card className="p-4 relative overflow-hidden">
        <BackgroundGradientAnimation
          containerClassName="absolute inset-0 rounded-lg"
          interactive={false}
          gradientBackgroundStart="#4b0082"
          gradientBackgroundEnd="#2e0051"
          firstColor="75,0,130"
          secondColor="106,0,163"
          thirdColor="46,0,81"
          fourthColor="160,60,170"
          fifthColor="120,80,200"
        />
        <div className="relative z-10">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-white">
            <User className="w-5 h-5 mr-2 text-white/90" />
            Suggested For You
          </h2>
          {isLoadingInitial ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {suggestedUsers.map((user) => (
                <UserCard key={user.user_id} user={user} onUserClick={handleUserClick} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderSearchResults = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Search Results</h2>
      {isSearching && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      {!isSearching && searchResults.length === 0 && (
        <p className="text-muted-foreground text-center py-4">
          No users found for "{searchTerm}"
        </p>
      )}
      {!isSearching && searchResults.length > 0 && (
        <div className="flex flex-col gap-3">
          {searchResults.map((user) => (
            <UserCard key={user.user_id} user={user} onUserClick={handleUserClick} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* --- Search Bar --- */}
          <div className="relative">
            <BackgroundGradientAnimation
              containerClassName="absolute inset-0 rounded-xl z-0"
              interactive={false}
              gradientBackgroundStart="#4b0082"
              gradientBackgroundEnd="#2e0051"
              firstColor="75,0,130"
              secondColor="106,0,163"
              thirdColor="46,0,81"
              fourthColor="160,60,170"
              fifthColor="120,80,200"
            />
            {/* subtle dark overlay for improved contrast */}
            <div className="absolute inset-0 bg-black/20 rounded-xl z-10 pointer-events-none" />
            <div className="relative z-20">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
              <Input
                type="text"
                placeholder="Search for users..."
                className="w-full pl-10 h-12 text-lg rounded-xl bg-transparent text-white placeholder:text-white/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* --- Conditional Content --- */}
          {searchTerm.trim() === "" ? renderInitialContent() : renderSearchResults()}
          
        </div>
      </main>
  );
}