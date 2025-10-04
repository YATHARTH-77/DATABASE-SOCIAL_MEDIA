import { Home, Search, MessageCircle, Bell, PlusCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import whiteTextLogo from "@/assets/white_text_logo.png";

export const Sidebar = () => {
  const navItems = [
    { icon: Home, label: "HOME", path: "/home" },
    { icon: Search, label: "SEARCH", path: "/search" },
    { icon: MessageCircle, label: "MESSAGES", path: "/messages" },
    { icon: Bell, label: "ACTIVITY", path: "/activity", hasNew: true },
    { icon: PlusCircle, label: "CREATE", path: "/create" },
    { icon: User, label: "PROFILE", path: "/profile" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 gradient-sidebar flex flex-col p-6 shadow-xl z-50">
      <div className="mb-10 flex items-center gap-4">
        {/* MODIFICATION START: Removed 'p-1' class */}
        <img 
          src={logo} 
          alt="ConnectIT Logo" 
          className="w-14 h-14 rounded-2xl border border-white/50 object-contain" 
        />
        {/* MODIFICATION END */}
        <img src={whiteTextLogo} alt="ConnectIT" className="h-12" />
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-white font-semibold text-sm transition-all relative ${
                isActive ? "bg-white/20 shadow-md" : "hover:bg-white/10"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
            {item.hasNew && (
              <Badge className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 font-bold">
                NEW
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};