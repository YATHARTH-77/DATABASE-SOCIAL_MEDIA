import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";

const API_URL = "http://localhost:5000";

export function FollowerModal({ type, users, onClose, onRemoveFollower, onUnfollow, onUserClick, isOwnProfile = false }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-background rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{searchQuery ? "No users found" : `No ${title.toLowerCase()} yet`}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    onClick={() => {
                      onUserClick(user.username);
                      onClose();
                    }}
                  >
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={user.profile_pic_url ? `${API_URL}${user.profile_pic_url}` : ''} />
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{user.username}</p>
                      {user.full_name && (
                        <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Button - Renders only if isOwnProfile is true */}
                  {isOwnProfile && (
                    type === "followers" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveFollower(user.user_id)}
                        className="ml-2 flex-shrink-0"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnfollow(user.user_id)}
                        className="ml-2 flex-shrink-0"
                      >
                        Unfollow
                      </Button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}