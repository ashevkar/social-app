"use client";

import { useState, useEffect } from "react";
import MainSidebar from "@/components/MainSidebar";
import MainRightSidebar from "@/components/MainRightSidebar";

type AppLayoutProps = {
  children: React.ReactNode;
  /** Title shown at top of center content (e.g. "User profile") */
  title?: string;
};

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarColor, setSidebarColor] = useState("bg-purple-500");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSidebarColor(localStorage.getItem("sidebarColor") || "bg-purple-500");
      const handler = () => {
        setSidebarColor(localStorage.getItem("sidebarColor") || "bg-purple-500");
      };
      window.addEventListener("sidebarColorChanged", handler);
      return () => window.removeEventListener("sidebarColorChanged", handler);
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Same sidebar as main page – no activeTab/setActiveTab so nav items link to / */}
      <MainSidebar sidebarColor={sidebarColor} />

      {/* Center */}
      <div className="flex-1 max-w-4xl mx-auto border-x border-gray-200 min-h-screen bg-white p-3">
        {title && (
          <h1 className="text-3xl font-black italic mb-4 text-black">{title}</h1>
        )}
        {children}
      </div>

      {/* Same right sidebar as main page */}
      <MainRightSidebar />
    </div>
  );
}
