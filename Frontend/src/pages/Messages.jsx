import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Loader2 } from "lucide-react";
import { relativeTime } from "@/lib/time";

const API_URL = "http://localhost:5000";

export default function Messages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(null);
  
  // --- New Chat State ---
  const [newUser, setNewUser] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const inputRef = useRef(null);

  // --- Loading State ---
  const [isLoading, setIsLoading] = useState(true);

  // --- Get User & Fetch Conversations ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchConversations(parsedUser.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchConversations = async (userId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/conversations?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API Call to Start New Chat ---
  const handleCreateConversation = async () => {
    const name = newUser.trim();
    if (!name || !user) {
      setCreateError("Please enter a username");
      setTimeout(() => setCreateError(""), 3000);
      return;
    }
    
    // Check if conversation already exists with this user
    const existingConversation = conversations.find(
      conv => conv.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingConversation) {
      setNewUser("");
      setIsCreating(false);
      navigate(`/messages/${existingConversation.chat_id}`);
      return;
    }
    
    setCreateError("");
    setIsCreating(true); 

    try {
      const res = await fetch(`${API_URL}/api/conversations/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId1: user.id, username2: name }),
      });
      const data = await res.json();

      if (data.success) {
        setNewUser("");
        setIsCreating(false);
        navigate(`/messages/${data.chatId}`);
      } else {
        setCreateError(data.message || "Failed to start chat");
        setTimeout(() => setCreateError(""), 3000);
        setIsCreating(false);
      }
    } catch (err) {
      setCreateError("Server error");
      setTimeout(() => setCreateError(""), 3000);
      setIsCreating(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = conversations.filter((conversation) => {
    if (!normalizedQuery) return true; 
    return (conversation.name || "").toLowerCase().includes(normalizedQuery);
  });

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 md:ml-64 lg:ml-72 xl:ml-80 2xl:ml-[22rem] pb-20 md:pb-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg rounded-lg overflow-hidden border-2 border-purple-300">
            {/* Header Section */}
            <div className="p-3 sm:p-4 border-b-2 border-purple-300 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <Input
                  placeholder="Search by username"
                  aria-label="Search by username"
                  className="w-full pl-9 sm:pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredConversations.length > 0) {
                        navigate(`/messages/${filteredConversations[0].chat_id}`);
                      }
                    }
                  }}
                />
              </div>

              {/* --- NEW CHAT UI --- */}
              <div className="flex items-center gap-2">
                {isCreating ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      ref={inputRef}
                      placeholder="username"
                      aria-label="New username"
                      className="flex-1 sm:w-32 md:w-40 bg-white/10 text-white placeholder:text-white/60 rounded-md px-2 py-1 border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-8 sm:h-9"
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateConversation();
                        } else if (e.key === "Escape") {
                          setIsCreating(false);
                          setCreateError("");
                        }
                      }}
                    />
                    <button
                      className="text-white px-2 py-1 rounded-md hover:bg-white/10 text-xs sm:text-sm whitespace-nowrap"
                      onClick={() => { setIsCreating(false); setCreateError(""); }}
                      aria-label="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="bg-white/10 p-1.5 sm:p-2 rounded-md hover:bg-white/20"
                    onClick={() => { setIsCreating(true); setTimeout(()=> inputRef.current?.focus?.(), 40); }}
                    aria-label="Start new chat"
                    title="Start new chat"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                )}
              </div>
            </div>
            
            {createError && (
              <div className="p-2 text-xs sm:text-sm text-center text-white bg-gradient-to-r from-red-500 to-red-600 border-b-2 border-red-700">
                {createError}
              </div>
            )}

            {/* --- DYNAMIC LIST --- */}
            <div className="divide-y-2 divide-purple-200 bg-white">
              {isLoading ? (
                <div className="flex justify-center p-6 sm:p-8">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#5A0395]" />
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.chat_id}
                    className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-150 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150"
                    onClick={() => navigate(`/messages/${conversation.chat_id}`)}
                  >
                    <Avatar
                      className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer border-2 border-purple-200 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/${encodeURIComponent(conversation.name)}`);
                      }}
                      aria-label={`Open profile for ${conversation.name}`}
                      title={`View ${conversation.name}`}
                    >
                      <AvatarImage src={conversation.profile_pic_url ||''} />
                      <AvatarFallback className="bg-[#5A0395] text-white text-sm sm:text-base">
                        {conversation.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1 gap-2">
                        <h3 className="font-semibold truncate text-[#1D0C69] text-sm sm:text-base">
                          {conversation.name}
                        </h3>
                        <span className="text-[10px] sm:text-xs text-[#5A0395] flex-shrink-0">{relativeTime(conversation.time)}</span>
                      </div>
                      <p className="text-xs sm:text-sm truncate text-gray-600">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center text-gray-600 text-sm sm:text-base">
                  No conversations found.
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
  );
}