import { Home, Search, MessageCircle, Bell, PlusCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
// Export navItems so other components can reuse icons/paths
export const navItems = [
  { icon: Home, label: "HOME", path: "/home" },
  { icon: Search, label: "SEARCH", path: "/search" },
  { icon: MessageCircle, label: "MESSAGES", path: "/messages" },
  { icon: Bell, label: "ACTIVITY", path: "/activity", hasNew: true },
  { icon: PlusCircle, label: "CREATE", path: "/create" },
  { icon: User, label: "PROFILE", path: "/profile" },
];
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import whiteTextLogo from "@/assets/white_text_logo.png";

export const Sidebar = () => {

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-green-500 p-4 transition-all duration-300 md:w-64 md:p-6 gradient-sidebar flex flex-col shadow-xl z-50">
      
      {/* MODIFICATION START: Changed flex-col to flex, removed gap, and centered the items */}
      <div className="mb-10 flex items-center justify-center -mb-10">
        
        <img 
          src={logo} 
          alt="ConnectIT Logo" 
          className="w-12 h-12 rounded-2xl  md:w-28 md:h-28" 
        />
        
        {/* MODIFICATION START: Increased size (h-16) and added a negative margin (-ml-4) on medium screens */}
        <img 
          src={whiteTextLogo} 
          alt="ConnectIT" 
          className="hidden md:block h-29 -ml-14 " 
        />
        {/* MODIFICATION END */}
      </div>
      {/* MODIFICATION END */}

      <nav className="flex-1 space-y-2 -mt-5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl p-3 text-white font-semibold text-sm transition-all relative justify-center md:justify-start md:px-4 md:py-3 ${
                isActive ? "bg-white/20 shadow-md" : "hover:bg-white/10"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="hidden md:inline">{item.label}</span>
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