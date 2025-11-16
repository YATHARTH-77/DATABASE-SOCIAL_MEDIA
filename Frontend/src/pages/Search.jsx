import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, SearchIcon, Hash, User } from "lucide-react";

// --- Base URL for our API ---
const API_URL = "https://backend-socialmedia-omega.vercel.app/";

// --- Helper Component for User Cards (MODIFIED) ---
function UserCard({ user, onUserClick }) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onUserClick(user.username)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.profile_pic_url ? `${API_URL}${user.profile_pic_url}` : ''} />
          <AvatarFallback className="bg-[#5A0395] text-white">{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold truncate text-[#1D0C69]">{user.username}</p>
          <p className="text-sm text-[#5A0395] truncate">{user.follower_count} Followers</p>
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
      // Get logged-in user
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      
      // Fetch trending hashtags
      const hashRes = await fetch(`${API_URL}/api/search/trending-hashtags`);
      const hashData = await hashRes.json();
      if (hashData.success) {
        setTrendingHashtags(hashData.hashtags);
      }

      // Fetch suggested users (pass userId if available)
      const userRes = user 
        ? await fetch(`${API_URL}/api/search/suggested-users?userId=${user.id}`)
        : await fetch(`${API_URL}/api/search/suggested-users`);
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
      <Card className="overflow-hidden border-2 border-purple-300 shadow-md">
        <div className="bg-gradient-to-r from-[#1D0C69] to-[#5A0395] p-4">
          <h2 className="text-lg font-semibold flex items-center text-white">
            <Hash className="w-5 h-5 mr-2" />
            Trending Hashtags
          </h2>
        </div>
        <div className="bg-white p-4">
          {isLoadingInitial ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#5A0395]" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {trendingHashtags.map((tag) => (
                <div
                  key={tag.hashtag_text}
                  onClick={() => handleHashtagClick(tag.hashtag_text)}
                  className="p-3 rounded-lg cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md transition-shadow border border-purple-200"
                >
                  <p className="font-semibold text-[#1D0C69]">#{tag.hashtag_text}</p>
                  <p className="text-sm text-[#5A0395]">{tag.post_count} posts</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* --- Suggested Users --- */}
      <Card className="overflow-hidden border-2 border-purple-300 shadow-md">
        <div className="bg-gradient-to-r from-[#1D0C69] to-[#5A0395] p-4">
          <h2 className="text-lg font-semibold flex items-center text-white">
            <User className="w-5 h-5 mr-2" />
            Suggested For You
          </h2>
        </div>
        <div className="bg-white p-4">
          {isLoadingInitial ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#5A0395]" />
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
      <h2 className="text-lg font-semibold text-[#1D0C69]">Search Results</h2>
      {isSearching && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#5A0395]" />
        </div>
      )}
      {!isSearching && searchResults.length === 0 && (
        <p className="text-gray-600 text-center py-4">
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
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* --- Search Bar --- */}
          <div className="relative rounded-xl overflow-hidden border-2 border-[#5A0395]">
            <div className="relative bg-white">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A0395]" />
              <Input
                type="text"
                placeholder="Search for users..."
                className="w-full pl-10 h-12 text-lg rounded-xl bg-white text-[#1D0C69] placeholder:text-purple-400 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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