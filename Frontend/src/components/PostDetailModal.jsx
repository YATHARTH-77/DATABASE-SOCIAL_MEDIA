import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, MoreHorizontal } from "lucide-react";
import { CommentSection } from "@/components/CommentSection";

export function PostDetailModal({ post, onClose, onUserClick }) {
  const [comments, setComments] = useState(post.comments || []);
  const [showMenu, setShowMenu] = useState(false);

  const handleAddComment = (postId, commentText) => {
    const newComment = {
      id: Date.now(),
      username: "current_user",
      avatar: "",
      text: commentText,
      timestamp: "Just now"
    };
    setComments([...comments, newComment]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* --- MODIFICATION START: The modal dialog now directly handles scrolling behavior --- */}
      <div className="relative w-full max-w-md md:max-w-4xl max-h-[90vh] bg-background rounded-xl flex overflow-y-auto md:overflow-y-hidden" onClick={(e) => e.stopPropagation()}>
      {/* --- MODIFICATION END --- */}
        
        {/* --- MODIFICATION START: This wrapper now has a defined height on desktop --- */}
        <div className="flex flex-col md:flex-row w-full md:h-full">
        {/* --- MODIFICATION END --- */}
          
          <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative flex-shrink-0">
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="bg-background/80 backdrop-blur-sm hover:bg-background rounded-full"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-10">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Report</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Share</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">Delete</button>
                </div>
              )}
            </div>
            
            <div className="w-full aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl md:text-6xl font-bold text-muted-foreground/20">MEDIA</span>
            </div>
          </div>

          {/* --- MODIFICATION START: This details column now handles its own scroll on desktop --- */}
          <div className="w-full md:w-1/2 flex flex-col bg-background md:overflow-y-auto">
          {/* --- MODIFICATION END --- */}
            <div className="p-4 bg-gray-100 border-b flex-shrink-0">
              <p className="text-sm break-words">
                {post.caption}
              </p>
            </div>

            {post.hashtags && post.hashtags.length > 0 && (
              <div className="p-4 bg-gray-100 border-b flex-shrink-0">
                <p className="font-semibold text-sm mb-2 text-gray-700">#Hashtags:</p>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* The CommentSection no longer needs a special scrolling wrapper */}
            <div>
              <CommentSection
                postId={post.id}
                comments={comments}
                onAddComment={handleAddComment}
                onClose={() => {}}
                onUserClick={(username) => {
                  onUserClick(username);
                  onClose();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}