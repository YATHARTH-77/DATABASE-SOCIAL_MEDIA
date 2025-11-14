import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Loader2 } from "lucide-react";
import { relativeTime } from "@/lib/time"; // Assuming this is a helper you have

const API_URL = "http://localhost:5000";

export default function Messages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(null); // Logged in user
  
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

  // --- API Call to Start New Chat (*** MODIFIED ***) ---
  const handleCreateConversation = async () => {
    const name = newUser.trim();
    if (!name || !user) {
      // --- CHANGE 1: Updated error message ---
      setCreateError("Please enter a username");
      return;
    }
    setCreateError("");
    setIsCreating(true); 

    try {
      const res = await fetch(`${API_URL}/api/conversations/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // --- CHANGE 2: Send 'username2' instead of 'displayName2' ---
        body: JSON.stringify({ userId1: user.id, username2: name }),
      });
      const data = await res.json();

      if (data.success) {
        setNewUser("");
        setIsCreating(false);
        navigate(`/messages/${data.chatId}`);
      } else {
        setCreateError(data.message || "Failed to start chat");
        setIsCreating(false);
      }
    } catch (err) {
      setCreateError("Server error");
      setIsCreating(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = conversations.filter((conversation) => {
    if (!normalizedQuery) return true; 
    return (conversation.name || "").toLowerCase().includes(normalizedQuery);
  });

  return (
    <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg rounded-lg">
            <div className="p-4 border-b gradient-sidebar flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
                <Input
                  placeholder="Search by username"
                  aria-label="Search by username"
                  className="w-full pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-full"
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

              {/* --- NEW CHAT UI (*** MODIFIED ***) --- */}
              <div className="flex items-center gap-2">
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      // --- CHANGE 3: Updated placeholder ---
                      placeholder="username"
                      aria-label="New username"
                      className="w-40 bg-white/10 text-white placeholder:text-white/60 rounded-md px-2 py-1"
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
                      className="text-white px-2 py-1 rounded-md hover:bg-white/10"
                      onClick={() => { setIsCreating(false); setCreateError(""); }}
                      aria-label="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="bg-white/10 p-2 rounded-md hover:bg-white/20"
                    onClick={() => { setIsCreating(true); setTimeout(()=> inputRef.current?.focus?.(), 40); }}
                    aria-label="Start new chat"
                    title="Start new chat"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
            {createError && <div className="p-2 text-xs text-center text-red-500 bg-red-100">{createError}</div>}

            {/* --- DYNAMIC LIST --- */}
            <div className="divide-y">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.chat_id}
                    className="p-4 flex items-center gap-4 cursor-pointer transition-transform duration-150 transform rounded-lg hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/10"
                    onClick={() => navigate(`/messages/${conversation.chat_id}`)}
                  >
                    <Avatar
                      className="w-10 h-10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/${encodeURIComponent(conversation.name)}`);
                      }}
                      aria-label={`Open profile for ${conversation.name}`}
                      title={`View ${conversation.name}`}
                    >
                      <AvatarImage src={conversation.profile_pic_url ? `${API_URL}${conversation.profile_pic_url}` : ''} />
                      <AvatarFallback className="gradient-sidebar text-white">
                        {conversation.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">{relativeTime(conversation.time)}</span>
                      </div>
                      <p className="text-sm truncate text-muted-foreground">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No conversations found.
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
  );
}