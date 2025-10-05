import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send } from "lucide-react";
import { getById, addMessage, markAsRead } from "@/lib/conversations";
import { relativeTime } from "@/lib/time";
import { useRef } from "react";

// conversations are loaded from the conversations lib (localStorage)

export default function ChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const listRef = useRef(null);

  useEffect(() => {
    const conv = getById(conversationId);
    if (conv) {
      setConversation(conv);
      setMessages(conv.messages || []);
      // mark messages as read when opening the conversation
      markAsRead(conversationId);
    } else {
      setConversation(null);
      setMessages([]);
    }
  }, [conversationId]);

  // auto-scroll when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg = addMessage(conversationId, {
      text: message,
      sender: "me",
      time: "Just now",
    });
    if (newMsg) {
      setMessages((m) => [...m, newMsg]);
      setMessage("");
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Conversation not found</h1>
            <Button onClick={() => navigate("/messages")}>Back to Messages</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-2xl mx-auto h-[calc(100vh-4rem)]">
          <Card className="shadow-lg h-full flex flex-col">
            <div className="p-3 md:p-4 border-b gradient-primary flex items-center gap-3 md:gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/messages")} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar
                className="w-8 h-8 md:w-10 md:h-10 cursor-pointer transition-transform duration-150 transform hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/10"
                onClick={() => navigate(`/user/${encodeURIComponent(conversation.name)}`)}
                title={`View ${conversation.name}`}
                aria-label={`Open profile for ${conversation.name}`}
              >
                <AvatarFallback className="bg-white text-primary">
                  {conversation.name[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-sm md:text-lg font-bold text-white truncate">{conversation.name}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <div ref={listRef} className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.sender === "me"
                          ? "gradient-primary text-white"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${msg.sender === "me" ? "text-white/70" : "text-muted-foreground"}`}>{relativeTime(msg.time)}</span>
                        {msg.sender === "me" && (
                          <span className="text-xs text-white/60">{msg.read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 md:p-4 border-t">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-w-0"
                />
                <Button onClick={handleSend} className="gradient-primary text-white">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
