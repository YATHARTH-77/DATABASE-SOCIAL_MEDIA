import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

const conversations = [
  { id: 1, name: "Person-1", lastMessage: "How are you?", time: "8h ago", unread: false },
  { id: 2, name: "Person-2", lastMessage: "Heyy", time: "1h ago", unread: true },
  { id: 3, name: "Person-3", lastMessage: "wassup", time: "12h ago", unread: false },
  { id: 4, name: "Person-4", lastMessage: "bye", time: "3h ago", unread: false },
  { id: 5, name: "Person-5", lastMessage: "See you later!", time: "1d ago", unread: false },
];

export default function Messages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-48 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <div className="p-4 border-b gradient-primary">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
                <Input
                  placeholder="Search"
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                  <Avatar>
                    <AvatarFallback className="gradient-primary text-white">
                      {conversation.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold ${conversation.unread ? "text-primary" : ""}`}>
                        {conversation.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">{conversation.time}</span>
                    </div>
                    <p className={`text-sm ${conversation.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
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
