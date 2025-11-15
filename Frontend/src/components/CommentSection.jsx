import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Send } from "lucide-react";

export function CommentSection({ postId, comments, onAddComment, onClose, onUserClick }) {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = () => {
    if (commentText.trim()) {
      onAddComment(postId, commentText.trim());
      setCommentText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleUsernameClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUserClick) {
      onUserClick(username);
    }
  };

  return (
    <div className="bg-white border-t border-gray-300 animate-in slide-in-from-top duration-300 flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="font-semibold text-gray-800">Comments ({comments.length})</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div 
                className="cursor-pointer hover:opacity-80 flex-shrink-0"
                onClick={(e) => handleUsernameClick(e, comment.username)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.avatar} />
                  <AvatarFallback className="bg-[#5A0395] text-white text-xs">
                    {comment.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-purple-50 rounded-2xl px-3 py-2 border border-purple-100">
                  <p 
                    className="font-semibold text-sm text-[#5A0395] cursor-pointer hover:underline inline-block"
                    onClick={(e) => handleUsernameClick(e, comment.username)}
                  >
                    {comment.username}
                  </p>
                  <p className="text-sm text-gray-700 break-words">{comment.text}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-3">{comment.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex gap-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-[#5A0395] text-white text-xs">
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-[#5A0395] focus:ring-1 focus:ring-[#5A0395] text-sm"
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              size="icon"
              disabled={!commentText.trim()}
              className="rounded-full bg-[#5A0395] hover:bg-[#1D0C69] disabled:opacity-50 disabled:cursor-not-allowed h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}