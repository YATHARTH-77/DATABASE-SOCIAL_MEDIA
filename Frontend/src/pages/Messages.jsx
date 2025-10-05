import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { getAll, addConversation } from "@/lib/conversations";
import { relativeTime } from "@/lib/time";

export default function Messages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [newUser, setNewUser] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setConversations(getAll());
    const onChanged = () => setConversations(getAll());
    window.addEventListener('conversations:changed', onChanged);
    return () => window.removeEventListener('conversations:changed', onChanged);
  }, []);

  const handleCreateConversation = () => {
    const name = newUser.trim();
    if (!name) {
      setCreateError("Please enter a username");
      return;
    }
    // check duplicates by name or slugified username
    const existing = conversations.find(
      (c) => (c.name || "").toLowerCase() === name.toLowerCase() || (c.username || "").toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setCreateError("A conversation with this name already exists");
      // navigate to existing conversation
      navigate(`/messages/${existing.id}`);
      return;
    }
    const conv = addConversation(name);
    setConversations(getAll());
    setNewUser("");
    setIsCreating(false);
    setCreateError("");
    navigate(`/messages/${conv.id}`);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredConversations = conversations.filter((conversation) => {
    if (!normalizedQuery) return true; // show all when query is empty
    // Only match against the conversation name (username)
    return (conversation.name || "").toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <div className="p-4 border-b gradient-primary flex items-center gap-3">
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
                      // Open the first matching conversation on Enter
                      if (filteredConversations.length > 0) {
                        navigate(`/messages/${filteredConversations[0].id}`);
                      }
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
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
                    {/* Creation is handled via Enter key to keep the UI compact */}
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
                {createError && <div className="text-xs text-red-400">{createError}</div>}
              </div>
            </div>

            <div className="divide-y">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      conversation.unread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => navigate(`/messages/${conversation.id}`)}
                  >
                    <Avatar
                      className="w-10 h-10 cursor-pointer"
                      onClick={(e) => {
                          // prevent the parent row click (which opens the chat) when avatar is clicked
                          e.stopPropagation();
                          const username = conversation.username || conversation.name;
                          navigate(`/user/${encodeURIComponent(username)}`);
                        }}
                      aria-label={`Open profile for ${conversation.name}`}
                      title={`View ${conversation.name}`}
                    >
                      <AvatarFallback className="gradient-primary text-white">
                        {conversation.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${conversation.unread ? "text-primary" : ""}`}>
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">{relativeTime(conversation.time)}</span>
                      </div>
                      <p className={`text-sm truncate ${conversation.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread && (
                      <div className="ml-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                    {Array.isArray(conversation.messages) && (
                      (() => {
                        const unreadCount = conversation.messages.filter(m => !m.read).length;
                        return unreadCount > 0 ? (
                          <div className="ml-3 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No conversations found
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
