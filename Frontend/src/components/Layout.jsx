import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <Outlet />
    </div>
  );
}
