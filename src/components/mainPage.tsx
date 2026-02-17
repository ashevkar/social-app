"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CreateTweet from "@/components/CreateTweet";
import Settings from "./ProfileView";
import NotificationPage from "@/components/NotificationPage";
import UserProfileContent from "@/components/UserProfileContent";
import { useSession } from "next-auth/react";
import Profile from "@/app/profile/page";
import MainSidebar from "@/components/MainSidebar";
import MainRightSidebar from "@/components/MainRightSidebar";

export default function Home() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profile");
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarColor, setSidebarColor] = useState("bg-purple-500");
  const isLoggedIn = status === "authenticated" && !!session;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedColor = localStorage.getItem("sidebarColor");
      if (storedColor) setSidebarColor(storedColor);
      const handler = () => {
        setSidebarColor(localStorage.getItem("sidebarColor") || "bg-purple-500");
      };
      window.addEventListener("sidebarColorChanged", handler);
      return () => window.removeEventListener("sidebarColorChanged", handler);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        if (profileId && isLoggedIn) {
          return <UserProfileContent userId={profileId} />;
        }
        return (
          <>
            <CreateTweet />
          </>
        );
      // case "explore":
      //   return (
      //     <div className="p-4 text-xl font-bold">Explore Page Coming Soon!</div>
      //   );
      case "notifications":
        return (
          <div className="p-4">
            <NotificationPage />
          </div>
        );
      case "settings":
        return (
          <div className="">
            {/* Profile Page (Under construction) */}
            <Settings />
          </div>
        );
      case "profile":
        return (
          <div className="">
            <Profile />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      <MainSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarColor={sidebarColor}
      />

      {/* Center Feed */}
      <div
        className={`min-h-screen m-auto
          ${
            activeTab === "home"
              ? "flex-1 max-w-4xl mx-auto border-x"
              : "flex-[2] w-full"
          }
          border-gray-200 p-3
          ${
            activeTab === "explore"
              ? "bg-amber-100"
              : activeTab === "notifications"
              ? "bg-purple-100"
              : activeTab === "settings"
              ? "bg-orange-100"
              : activeTab === "profile"
              ? "bg-blue-100"
              : "bg-white"
          }`}
      >
        {/* Login / Sign up prompt when not authenticated */}
        {!isLoggedIn && status !== "loading" && (
          <div className="mb-4 p-4 rounded-xl border-2 border-amber-400 bg-amber-50 shadow-md">
            <p className="text-center font-semibold text-gray-800 mb-3">
              Login or Sign up to post, like, and get the full experience.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg bg-amber-400 border-2 border-black font-semibold hover:bg-amber-500 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-lg bg-rose-500 text-white border-2 border-black font-semibold hover:bg-rose-600 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
        {renderContent()}
      </div>

      {activeTab === "home" && <MainRightSidebar />}
    </div>
  );
}
