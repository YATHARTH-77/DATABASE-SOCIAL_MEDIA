import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, UserPlus, Bookmark } from "lucide-react";

const activities = [
  { id: 1, type: "like", username: "john_doe", action: "liked your post", time: "5m ago", isNew: true },
  { id: 2, type: "comment", username: "jane_smith", action: 'commented: "Amazing photo!"', time: "15m ago", isNew: true },
  { id: 3, type: "follow", username: "mike_wilson", action: "started following you", time: "1h ago", isNew: true },
  { id: 4, type: "like", username: "sarah_jones", action: "liked your post", time: "2h ago", isNew: false },
  { id: 5, type: "save", username: "alex_brown", action: "saved your post", time: "3h ago", isNew: false },
];

const getActivityIcon = (type) => {
  switch (type) {
    case "like":
      return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
    case "comment":
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "follow":
      return <UserPlus className="w-4 h-4 text-green-500" />;
    case "save":
      return <Bookmark className="w-4 h-4 text-yellow-500" />;
    default:
      return null;
  }
};

export default function Activity() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* --- MODIFICATION START: Made main container responsive --- */}
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
      {/* --- MODIFICATION END --- */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <div className="p-6 border-b gradient-primary">
              <h1 className="text-2xl font-bold text-white">Activity</h1>
            </div>

            <div className="divide-y">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  // --- MODIFICATION START: Made list items flexible ---
                  className={`p-4 flex flex-wrap items-center gap-4 hover:bg-muted/50 transition-colors ${
                  // --- MODIFICATION END ---
                    activity.isNew ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="gradient-primary text-white">
                        {activity.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>

                  {/* --- MODIFICATION START: Ensured text container can shrink and wrap --- */}
                  <div className="flex-1 min-w-[150px]">
                    <p className="text-sm break-words">
                  {/* --- MODIFICATION END --- */}
                      <span className="font-semibold">{activity.username}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>

                  {activity.isNew && (
                    <div className="w-2 h-2 rounded-full bg-primary ml-auto" />
                  )}

                  {activity.type === "follow" && (
                    <button className="px-4 py-1.5 gradient-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity ml-auto">
                      Follow Back
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}