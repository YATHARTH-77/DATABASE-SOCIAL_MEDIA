import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, UserPlus, Bookmark, Loader2 } from "lucide-react";

// --- Base URL for our API ---
const API_URL = "http://localhost:5000";

// --- Helper: Format timestamp (e.g., "5m ago") ---
function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

// --- Helper: Get Icon ---
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

// --- Helper: Get Action Text ---
const getActivityAction = (activity) => {
  const textPreview = activity.text_preview 
    ? `: "${activity.text_preview.substring(0, 20)}..."` 
    : "";
    
  switch (activity.type) {
    case "like": return "liked your post.";
    case "comment": return `commented${textPreview}`;
    case "follow": return "started following you.";
    case "save": return "saved your post.";
    default: return "";
  }
};

export default function Activity() {
  const navigate = useNavigate();
  
  // --- Dynamic State ---
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- Get User & Fetch Activity ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchActivity(parsedUser.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // --- API Call: Fetch Activity Feed ---
  const fetchActivity = async (userId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/activity/${userId}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API Call: Follow Back ---
  const handleFollowBack = async (e, actorId) => {
    e.stopPropagation(); // Prevents navigating to user page
    if (!user) return;

    // TODO: You can add logic to change the button text to "Following"
    e.target.disabled = true;
    e.target.innerText = "Following";

    try {
      await fetch(`${API_URL}/api/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: user.id,   // You are the follower
          followingId: actorId   // You are following them back
        }),
      });
    } catch (err) {
      console.error("Failed to follow back:", err);
      e.target.disabled = false;
      e.target.innerText = "Follow Back";
    }
  };
  
  const handleRowClick = (username) => {
    if (username) {
      navigate(`/user/${username}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 ml-20 md:ml-64 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <div className="p-6 border-b gradient-primary">
              <h1 className="text-2xl font-bold text-white">Activity</h1>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="p-20 text-center text-red-500">
                <p>Error: {error}</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground">
                <p>No new activity yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {activities.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.actor_id}-${activity.created_at}`}
                    className="p-4 flex flex-wrap items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(activity.actor_username)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={activity.actor_pic ? `${API_URL}${activity.actor_pic}` : ''} />
                        <AvatarFallback className="gradient-primary text-white">
                          {activity.actor_username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <p className="text-sm break-words">
                        <span className="font-semibold">{activity.actor_username}</span>{" "}
                        <span className="text-muted-foreground">{getActivityAction(activity)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>

                    {/* isNew not implemented in DB, you can add a 'read' column later */}
                    {/* {activity.isNew && (
                      <div className="w-2 h-2 rounded-full bg-primary ml-auto" />
                    )} */}

                    {activity.type === "follow" && (
                      <button 
                        className="px-4 py-1.5 gradient-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity ml-auto"
                        onClick={(e) => handleFollowBack(e, activity.actor_id)}
                      >
                        Follow Back
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}