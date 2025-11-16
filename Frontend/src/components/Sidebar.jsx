import { Home, Search, MessageCircle, Bell, PlusCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

// Export navItems so other components can reuse icons/paths
export const navItems = [
  { icon: Home, label: "HOME", path: "/home" },
  { icon: Search, label: "SEARCH", path: "/search" },
  { icon: MessageCircle, label: "MESSAGES", path: "/messages" },
  { icon: Bell, label: "ACTIVITY", path: "/activity" },
  { icon: PlusCircle, label: "CREATE", path: "/create" },
  { icon: User, label: "PROFILE", path: "/profile" },
];

import { Badge } from "@/components/ui/badge";
import whiteTextLogo from "@/assets/white_text_logo1.png";
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

  // Touch handler for mobile bottom nav to update gradient position
  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  };

  // Toggle a `mobile-center` class on the document body when we're on a small viewport.
  // This lets us apply mobile-only centering styles globally without changing page markup.
  useEffect(() => {
    const root = document.documentElement || document.body;
    const check = () => {
      if (window.innerWidth < 768) {
        root.classList.add("mobile-center");
      } else {
        root.classList.remove("mobile-center");
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <aside 
        onMouseMove={handleMouseMove} 
        // Responsive width: 22rem on xl screens, scales down to 16rem on md, hidden on mobile
        className="hidden md:flex fixed left-0 top-0 h-screen p-4 transition-all duration-300 md:w-64 lg:w-72 xl:w-80 2xl:w-[22rem] md:p-6 gradient-sidebar flex-col shadow-xl z-50 overflow-y-auto"
      >
        <BackgroundGradientAnimation containerClassName="absolute inset-0" interactive={true} cursor={cursor}>
          
          {/* Inner Content Wrapper: MUST be h-full and flex-col to enable internal scrolling */}
          <div className="w-full h-full flex flex-col">
            
            {/* 1. Logo/Brand - Responsive sizing */}
            <div className="pt-2 pb-4 border-b border-white/20 flex items-center justify-center mb-8">
              <NavLink to="/home" onClick={() => window.location.href = '/home'}>
                <img 
                  src={whiteTextLogo} 
                  alt="ConnectIT" 
                  className="h-16 md:h-16 lg:h-18 xl:h-20 cursor-pointer hover:opacity-80 transition-opacity" 
                />
              </NavLink>
            </div>

            {/* 2. Navigation - Takes remaining space but doesn't grow */}
            <nav className="space-y-4 px-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl p-3 text-white font-semibold text-xs lg:text-sm transition-all relative md:justify-start md:px-3 lg:px-4 md:py-3 ${
                      isActive ? "bg-white/20 shadow-md" : "hover:bg-white/10"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
            
            {/* Spacer to push theme toggle to bottom */}
            <div className="flex-1"></div>
            
            {/* 3. Theme Toggle - Fixed at the very bottom */}
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-3 px-2 md:justify-start md:pl-3 lg:pl-4">
              <span className="text-white font-semibold text-xs lg:text-sm truncate">THEME</span>
              <div className="rounded-xl p-1 border border-black/60 bg-white/5 shadow-sm">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </BackgroundGradientAnimation>
      </aside>

      {/* Mobile bottom navigation - Fixed height, no bottom gap */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16" 
        onTouchMove={handleTouchMove}
      >
        <BackgroundGradientAnimation containerClassName="absolute inset-0" interactive={true} cursor={cursor}>
          {/* Fixed height container with centered icons */}
          <nav className="relative h-full bg-transparent border-t border-white/10 flex items-center justify-around px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path + "-mobile"}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-center w-12 h-12 transition-colors ${
                    isActive ? "text-white" : "text-white/70 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-6 h-6" />
              </NavLink>
            ))}
          </nav>
        </BackgroundGradientAnimation>
      </div>
    </>
  );
};