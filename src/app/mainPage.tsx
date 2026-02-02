"use client";
import { useState, useEffect } from "react";
import CreateTweet from "@/components/CreateTweet";
import Settings from "@/components/profileView";
import NotificationPage from "@/components/NotificationPage";
import { FiHome } from "react-icons/fi";
// import { FiSearch } from "react-icons/fi";
import { CiUser } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";
import { IconType } from "react-icons";
import Profile from "@/app/profile/page";

type Tweet = {
  id: string;
  content: string;
};

type User = {
  id: string;
  username: string;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{tweets: Tweet[], users: User[]} | null>(null);
  const [sidebarColor, setSidebarColor] = useState('bg-purple-500');

  useEffect(() => {
    // Replace with your actual fetch logic
    fetch('/api/tweets').then(res => res.json()).then(data => {
      // API returns { tweets, cursor, hasMore, count }
      setAllTweets(Array.isArray(data.tweets) ? data.tweets : []);
    });
    fetch('/api/users').then(res => res.json()).then(setAllUsers);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedColor = localStorage.getItem('sidebarColor');
      if (storedColor) setSidebarColor(storedColor);

      // Listen for sidebarColorChanged event
      const handler = () => {
        const newColor = localStorage.getItem('sidebarColor') || 'bg-purple-500';
        setSidebarColor(newColor);
      };
      window.addEventListener('sidebarColorChanged', handler);
      return () => window.removeEventListener('sidebarColorChanged', handler);
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length === 0) {
      setSearchResults(null);
      return;
    }

    // Simple case-insensitive search
    const filteredTweets = Array.isArray(allTweets) 
      ? allTweets.filter(tweet =>
          tweet.content.toLowerCase().includes(value.toLowerCase())
        )
      : [];
    const filteredUsers = Array.isArray(allUsers)
      ? allUsers.filter(user =>
          user.username.toLowerCase().includes(value.toLowerCase())
        )
      : [];

    setSearchResults({ tweets: filteredTweets, users: filteredUsers });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
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
          <div className="p-4 text-xl font-bold">
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
      {/* Left Sidebar */}
      <div className="w-64 h-screen sticky top-0 border-r border-gray-200 md:flex flex-col justify-between p-2 bg-white">
        <aside className="hidden md:block">
          <div className="text-4xl font-bold m-4 text-start">Orkut</div>
          <nav className="flex flex-col text-md p-2 ">
            <div className="flex flex-col space-y-3  ">
              <SidebarButton
                label="Home"
                Icon={FiHome}
                setActiveTab={() => setActiveTab("home")}
                active={activeTab === "home"}
                sidebarColor={sidebarColor}
              />
              {/* <SidebarButton
                label="Explore"
                Icon={FiSearch}
                setActiveTab={() => setActiveTab("explore")}
                active={activeTab === "explore"}
                sidebarColor={sidebarColor}
              /> */}
              <SidebarButton
                label="Notifications"
                Icon={IoMdNotificationsOutline}
                setActiveTab={() => setActiveTab("notifications")}
                active={activeTab === "notifications"}
                sidebarColor={sidebarColor}
              />
              <SidebarButton
                label="Profile"
                Icon={CiUser}
                setActiveTab={() => setActiveTab("profile")}
                active={activeTab === "profile"}
                sidebarColor={sidebarColor}
              />
              <SidebarButton
                label="Settings"
                Icon={IoSettingsOutline}
                setActiveTab={() => setActiveTab("settings")}
                active={activeTab === "settings"}
                sidebarColor={sidebarColor}
              />

              {/* Bottom Logout Button */}
              <div className="p-2">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-4 w-50 rounded-xl p-2 bg-amber-400  m-2  border-r-6 border-b-6  hover:bg-amber-400  border-black hover:border-r-4 hover:border-b-4 duration-300 justify-start  bottom-2 fixed"
                >
                  <FiLogOut className="text-xl" />
                  <span className="text-md font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </nav>
        </aside>
      </div>

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
        {renderContent()}
      </div>

      {/* Right Sidebar */}
      {activeTab === "home" && (
        <div className="w-auto h-screen border-x border-gray-200 sticky top-0 hidden lg:flex flex-col p-2 space-y-4 overflow-y-auto">
          <aside className="p-2 hidden lg:block">
            {/* Search */}
            <div className="mb-6 relative">
              <input
                type="text"
                placeholder="Search tweets or users"
                className="w-full rounded-full bg-gray-100 p-3 px-5 outline-none"
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchResults && (
                <div className="absolute left-0 right-0 bg-white border rounded-xl mt-2 z-10 max-h-64 overflow-y-auto shadow-lg">
                  <div className="p-2">
                    <div className="font-bold text-gray-700">Users</div>
                    {searchResults.users.length === 0 && <div className="text-gray-400 text-sm">No users found</div>}
                    {searchResults.users.map((user) => (
                      <div key={user.id} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                        @{user.username}
                      </div>
                    ))}
                  </div>
                  <div className="border-t p-2">
                    <div className="font-bold text-gray-700">Tweets</div>
                    {searchResults.tweets.length === 0 && <div className="text-gray-400 text-sm">No tweets found</div>}
                    {searchResults.tweets.map((tweet) => (
                      <div key={tweet.id} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                        {tweet.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trends */}
            <div className="bg-gray-100 rounded-xl p-4">
              <h2 className="text-lg font-bold mb-4">Trends for you</h2>
              <div className="mb-2">#Nextjs</div>
              <div className="mb-2">#React</div>
              <div className="mb-2">#WebDev</div>
              <div className="mb-2">#TailwindCSS</div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

type SidebarButtonProps = {
  label: string;
  Icon: IconType;
  setActiveTab: () => void;
  active: boolean;
  notificationCount?: number;
  sidebarColor: string;
};

function SidebarButton({
  label,
  Icon,
  setActiveTab,
  active,
  notificationCount = 0,
  sidebarColor,
}: SidebarButtonProps) {
  // Determine text color for contrast
  const isLight = sidebarColor === 'bg-white' || sidebarColor === 'bg-amber-400';
  const activeClass = active ? `${sidebarColor} ${isLight ? 'text-black' : 'text-white'} custom-border` : '';
  return (
    <button
      onClick={setActiveTab}
      className={`flex items-center gap-4 w-full rounded-xl p-2 
        ${activeClass}
        hover:${sidebarColor} 
        border-black relative`}
      style={active ? { fontWeight: 700 } : {}}
    >
      <Icon className="text-lg" />
      <span className="text-md font-semibold">{label}</span>
      {notificationCount > 0 && (
        <span className="absolute right-4 top-3 bg-green-500 text-black rounded-full px-2 py-0.5 text-xs font-bold">
          {notificationCount}
        </span>
      )}
    </button>
  );
}
