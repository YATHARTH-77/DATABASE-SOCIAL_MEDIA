import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { relativeTime } from "@/lib/time";

const API_URL = "https://backend-sm-seven.vercel.app";

export default function Conversation() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef(null);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    if (listRef.current) {
      setTimeout(() => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 100);
    }
  }, [messages]);

  // --- Load user & initial messages ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchMessages(parsedUser.id);
    } else {
      navigate("/login");
    }

    // --- Poll for new messages ---
    const interval = setInterval(() => {
      if (user) fetchMessages(user.id, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [chatId, navigate, user?.id]);

  // --- Fetch messages ---
  const fetchMessages = async (userId, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/conversations/${chatId}?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setOtherUser(data.otherUser);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // --- Send message with optimistic UI ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !user) return;

    const optimisticMessage = {
      message_id: `temp-${Date.now()}`,
      sender_id: user.id,
      message_text: text,
      created_at: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    
    // Scroll to bottom after sending
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 100);

    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          senderId: user.id,
          messageText: text,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev =>
          prev.map(m =>
            m.message_id === optimisticMessage.message_id ? data.message : m
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages(prev => prev.filter(m => m.message_id !== optimisticMessage.message_id));
    }
  };

  // --- Handle Enter key ---
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!user || (!otherUser && !isLoading)) {
    return (
      <main className="flex-1 p-0 sm:p-4 md:p-6 lg:p-8 md:ml-64 lg:ml-72 xl:ml-80 2xl:ml-[22rem] md:pb-8 transition-all duration-300">
        <div className="max-w-2xl mx-auto text-center p-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Conversation not found</h1>
          <Button onClick={() => navigate("/messages")}>Back to Messages</Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 p-0 sm:p-4 md:p-6 lg:p-8 md:ml-64 lg:ml-72 xl:ml-80 2xl:ml-[22rem] md:pb-8 pb-16 transition-all duration-300">
        <div className="max-w-2xl mx-auto h-[calc(100vh-4rem)] sm:h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
          <Card className="shadow-lg h-full flex flex-col rounded-none sm:rounded-lg">
            {/* --- HEADER --- */}
            <div className="p-2 sm:p-3 md:p-4 border-b gradient-sidebar flex items-center gap-2 sm:gap-3 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/messages")}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {otherUser ? (
                <Link
                  to={`/user/${encodeURIComponent(otherUser.username)}`}
                  className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1"
                >
                  <Avatar
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 cursor-pointer transition-transform duration-150 transform hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/10 flex-shrink-0"
                    title={`View ${otherUser.username}`}
                    aria-label={`Open profile for ${otherUser.username}`}
                  >
                    <AvatarImage
                      src={otherUser.profile_pic_url ||''}
                    />
                    <AvatarFallback className="bg-white text-primary text-xs sm:text-sm">
                      {otherUser.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xs sm:text-sm md:text-lg font-bold text-white truncate">
                    {otherUser.username}
                  </h2>
                </Link>
              ) : (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin ml-2" />
              )}
            </div>

            {/* --- MESSAGES AREA --- */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin" />
                </div>
              ) : (
                <div ref={listRef} className="space-y-3 sm:space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                          msg.sender_id === user.id
                            ? "gradient-sidebar text-white"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-xs sm:text-sm break-words">{msg.message_text}</p>
                        <div className="flex items-center gap-1 sm:gap-2 mt-1">
                          <span
                            className={`text-[10px] sm:text-xs ${
                              msg.sender_id === user.id ? "text-white/70" : "text-muted-foreground"
                            }`}
                          >
                            {relativeTime(msg.created_at)}
                          </span>
                          {msg.sender_id === user.id && (
                            <span className="text-[10px] sm:text-xs text-white/60">
                              {msg.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- INPUT AREA --- */}
            <div className="p-2 sm:p-3 md:p-4 border-t">
              <form className="flex gap-2 items-center" onSubmit={handleSendMessage}>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-w-0 text-sm sm:text-base h-9 sm:h-10 focus-visible:ring-purple-500 focus-visible:ring-2"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="gradient-sidebar text-white h-9 w-9 sm:h-10 sm:w-10 p-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}