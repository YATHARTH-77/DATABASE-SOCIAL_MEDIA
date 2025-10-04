import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send } from "lucide-react";

const conversations = {
  "1": {
    name: "Person-1",
    messages: [
      { id: 1, text: "Hey! How are you doing?", sender: "them", time: "8h ago" },
      { id: 2, text: "I'm doing great! Thanks for asking 😊", sender: "me", time: "8h ago" },
      { id: 3, text: "That's awesome! Want to grab coffee this weekend?", sender: "them", time: "8h ago" },
    ],
  },
  "2": {
    name: "Person-2",
    messages: [
      { id: 1, text: "Heyy", sender: "them", time: "1h ago" },
      { id: 2, text: "Hey! What's up?", sender: "me", time: "1h ago" },
      { id: 3, text: "Not much, just saw your latest post. Looks amazing!", sender: "them", time: "1h ago" },
    ],
  },
  "3": {
    name: "Person-3",
    messages: [
      { id: 1, text: "wassup", sender: "them", time: "12h ago" },
      { id: 2, text: "Hey! All good here. You?", sender: "me", time: "12h ago" },
    ],
  },
  "4": {
    name: "Person-4",
    messages: [
      { id: 1, text: "Thanks for the help yesterday!", sender: "them", time: "3h ago" },
      { id: 2, text: "No problem at all! Happy to help 👍", sender: "me", time: "3h ago" },
      { id: 3, text: "bye", sender: "them", time: "3h ago" },
    ],
  },
  "5": {
    name: "Person-5",
    messages: [
      { id: 1, text: "Had a great time today!", sender: "them", time: "1d ago" },
      { id: 2, text: "Me too! Let's do it again soon", sender: "me", time: "1d ago" },
      { id: 3, text: "See you later!", sender: "them", time: "1d ago" },
    ],
  },
};

export default function ChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(
    conversations[conversationId]?.messages || []
  );

  const conversation = conversations[conversationId];

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          text: message,
          sender: "me",
          time: "Just now",
        },
      ]);
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
        <main className="ml-48 flex-1 p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Conversation not found</h1>
            <Button onClick={() => navigate("/messages")}>Back to Messages</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-48 flex-1 p-8">
        <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)]">
          <Card className="shadow-lg h-full flex flex-col">
            <div className="p-4 border-b gradient-primary flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/messages")} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-white text-primary">
                  {conversation.name[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold text-white">{conversation.name}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender === "me"
                        ? "gradient-primary text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-white/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
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
