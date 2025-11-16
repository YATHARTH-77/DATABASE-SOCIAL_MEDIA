import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";

const API_URL = "https://backend-sm-seven.vercel.app";

export function FollowerModal({ type, users, onClose, onRemoveFollower, onUnfollow, onUserClick, isOwnProfile = false }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl border-2 border-purple-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1D0C69] to-[#5A0395]">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white border-b border-purple-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A0395]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A0395] text-[#1D0C69] placeholder:text-purple-400"
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-[400px] overflow-y-auto bg-white">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-[#5A0395]">
              <p>{searchQuery ? "No users found" : `No ${title.toLowerCase()} yet`}</p>
            </div>
          ) : (
            <div className="divide-y divide-purple-100">
              {filteredUsers.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md transition-shadow border-b border-purple-200">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    onClick={() => {
                      onUserClick(user.username);
                      onClose();
                    }}
                  >
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={user.profile_pic_url || ''} />
                      <AvatarFallback className="bg-[#5A0395] text-white text-sm">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate text-[#1D0C69]">{user.username}</p>
                      {user.full_name && (
                        <p className="text-xs text-[#5A0395] truncate">{user.full_name}</p>
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
                        className="ml-2 flex-shrink-0 border-2 border-[#5A0395] text-[#5A0395] hover:bg-[#5A0395] hover:text-white"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnfollow(user.user_id)}
                        className="ml-2 flex-shrink-0 border-2 border-[#5A0395] text-[#5A0395] hover:bg-[#5A0395] hover:text-white"
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