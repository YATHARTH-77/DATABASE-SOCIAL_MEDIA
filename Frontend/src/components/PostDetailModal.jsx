import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ThumbsUp, Bookmark } from "lucide-react";
import { CommentSection } from "@/components/CommentSection";

export function PostDetailModal({
  post,
  onClose,
  onUserClick,
  variant = "viewer",
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  isSavedPostView = false,
}) {
  const [comments, setComments] = useState(post.comments || []);
  const [showMenu, setShowMenu] = useState(false);

  const handleAddComment = (postId, commentText) => {
    const newComment = {
      id: Date.now(),
      username: "current_user",
      avatar: "",
      text: commentText,
      timestamp: "Just now",
    };
    setComments([...comments, newComment]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-md md:max-w-4xl max-h-[90vh] bg-background rounded-xl flex overflow-y-auto md:overflow-y-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row w-full md:h-full">
          <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative flex-shrink-0">
            <div className="absolute top-4 right-4 z-20">
              {variant === 'owner' ? (
                isSavedPostView ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSave}
                    className="bg-background/80 backdrop-blur-sm rounded-full text-[#5A0395] hover:text-[#1D0C69]"
                  >
                    <Bookmark className="w-5 h-5 fill-current" />
                  </Button>
                ) : (
                  <>
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
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">Delete</button>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onLike} 
                    className={`bg-background/80 backdrop-blur-sm rounded-full hover:bg-purple-100 ${isLiked ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onSave} 
                    className={`bg-background/80 backdrop-blur-sm rounded-full hover:bg-purple-100 ${isSaved ? "text-[#5A0395]" : "hover:text-[#5A0395]"}`}
                  >
                    <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="w-full aspect-square bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl md:text-6xl font-bold text-muted-foreground/20">MEDIA</span>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col bg-background md:overflow-y-auto">
            {isSavedPostView && (
              <div className="p-3 bg-gradient-to-r from-[#1D0C69] to-[#5A0395] border-b border-purple-600 flex items-center gap-3 flex-shrink-0">
                 <Avatar className="w-8 h-8">
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {post.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p 
                      className="font-semibold truncate text-white cursor-pointer hover:opacity-80" 
                      onClick={() => onUserClick(post.username)}
                    >
                      {post.username}
                    </p>
                    <p className="text-xs text-white/70">{post.timestamp || "3d ago"}</p>
                  </div>
              </div>
            )}

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-b border-purple-200 flex-shrink-0">
              <p className="text-sm break-words text-gray-800">
                {post.caption}
              </p>
            </div>
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-b border-purple-200 flex-shrink-0">
                <p className="font-semibold text-sm mb-2 text-[#1D0C69]">#Hashtags:</p>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag, idx) => (
                    <span key={idx} className="text-sm text-[#5A0395] hover:underline cursor-pointer font-medium">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
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