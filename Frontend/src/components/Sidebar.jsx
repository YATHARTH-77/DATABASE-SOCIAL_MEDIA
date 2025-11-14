import { Home, Search, MessageCircle, Bell, PlusCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
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
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation.jsx";
import ThemeToggle from "@/components/ui/theme-toggle";

export const Sidebar = () => {

  // cursor state tracked at the aside level so we can pass coordinates to the gradient
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // x/y relative to the aside (so the gradient can use same coordinate space)
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <aside onMouseMove={handleMouseMove} className="fixed left-0 top-0 h-screen w-28 bg-green-500 p-4 transition-all duration-300 md:w-[22rem] md:p-6 gradient-sidebar flex flex-col shadow-xl z-50">
      <BackgroundGradientAnimation containerClassName="absolute inset-0" interactive={true} cursor={cursor}>
        {/* sidebar content rendered above the gradient */}
        <div className="w-full h-full">
          <div className="mb-10 flex items-center justify-center">
            <img 
              src={logo} 
              alt="ConnectIT Logo" 
              className="w-12 h-12 rounded-2xl  md:w-28 md:h-28" 
            />
            <img 
              src={whiteTextLogo} 
              alt="ConnectIT" 
              className="hidden md:block h-29 -ml-24 " 
            />
          </div>

          <nav className="flex-1 space-y-2 -mt-5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-5 rounded-xl p-5 text-white font-semibold text-sm transition-all relative justify-center md:justify-start md:px-6 md:py-5 ${
                    isActive ? "bg-white/20 shadow-md" : "hover:bg-white/10"
                  }`
                }
              >
                <item.icon className="w-7 h-7" />
                <span className="hidden md:inline">{item.label}</span>
                {item.hasNew && (
                  <Badge className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 font-bold">
                    NEW
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-center md:justify-start">
            <div className="rounded-xl p-1 border border-black/60 bg-white/5 shadow-sm transform -translate-y-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </BackgroundGradientAnimation>
    </aside>
  );
};