import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, UserPlus, Bookmark, Loader2, AtSign } from "lucide-react";

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
    case "story_tag":
      return <AtSign className="w-4 h-4 text-purple-500" />;
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
    case "story_tag": return "tagged you in their story.";
    default: return "";
  }
};

export default function Activity() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  const handleFollowBack = async (e, actorId) => {
    e.stopPropagation(); 
    if (!user) return;

    e.target.disabled = true;
    e.target.innerText = "Following";

    try {
      await fetch(`${API_URL}/api/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: user.id,   
          followingId: actorId   
        }),
      });
    } catch (err) {
      console.error("Failed to follow back:", err);
      e.target.disabled = false;
      e.target.innerText = "Follow Back";
    }
  };
  
  const handleRepost = (e, storyId) => {
    e.stopPropagation();
    navigate(`/create?tab=moment&repost_id=${storyId}`);
  };

  const handleRowClick = (activity) => {
    if (activity.actor_username) {
      navigate(`/user/${activity.actor_username}`);
    }
  };

  return (
    <>
      <main className="flex-1 p-4 md:p-8 ml-28 md:ml-[22rem] transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg overflow-hidden border-2 border-purple-300">
            {/* Header */}
            <div className="p-6 border-b-2 border-purple-300 bg-gradient-to-r from-[#1D0C69] to-[#5A0395]">
              <h1 className="text-2xl font-bold text-white">Activity</h1>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-20 bg-white">
                <Loader2 className="w-10 h-10 text-[#5A0395] animate-spin" />
              </div>
            ) : error ? (
              <div className="p-20 text-center text-red-500 bg-white">
                <p>Error: {error}</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-20 text-center text-gray-600 bg-white">
                <p>No new activity yet.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-purple-200 bg-white">
                {activities.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.actor_id}-${activity.created_at}`}
                    className="p-4 flex flex-wrap items-center gap-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 transition-all cursor-pointer"
                    onClick={() => handleRowClick(activity)}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-purple-200">
                        <AvatarImage src={activity.actor_pic ? `${API_URL}${activity.actor_pic}` : ''} />
                        <AvatarFallback className="bg-[#5A0395] text-white">
                          {activity.actor_username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-purple-200">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                      <p className="text-sm break-words">
                        <span className="font-semibold text-[#1D0C69]">{activity.actor_username}</span>{" "}
                        <span className="text-gray-600">{getActivityAction(activity)}</span>
                      </p>
                      <p className="text-xs text-[#5A0395] mt-1">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>

                    {/* "Follow Back" Button */}
                    {activity.type === "follow" && (
                      <button 
                        className="px-4 py-1.5 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity ml-auto"
                        onClick={(e) => handleFollowBack(e, activity.actor_id)}
                      >
                        Follow Back
                      </button>
                    )}
                    
                    {/* "Add to Story" Button */}
                    {activity.type === "story_tag" && (
                       <button 
                        className="px-4 py-1.5 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity ml-auto"
                        onClick={(e) => handleRepost(e, activity.story_id)}
                      >
                        Add to Your Story
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}