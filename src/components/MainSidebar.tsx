"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { FiHome } from "react-icons/fi";
import { CiUser } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { IconType } from "react-icons";

/** When provided, sidebar uses tab buttons (main page). When not, uses Links to / (e.g. user profile page). */
type MainSidebarProps = {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  sidebarColor?: string;
};

export default function MainSidebar({
  activeTab,
  setActiveTab,
  sidebarColor = "bg-purple-500",
}: MainSidebarProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session;
  const isMainPage = setActiveTab != null && activeTab != null;

  const navItems: { tab: string; label: string; Icon: IconType; showWhenLoggedIn?: boolean }[] = [
    { tab: "home", label: "Home", Icon: FiHome },
    { tab: "notifications", label: "Notifications", Icon: IoMdNotificationsOutline, showWhenLoggedIn: true },
    { tab: "profile", label: "Profile", Icon: CiUser },
    { tab: "settings", label: "Settings", Icon: IoSettingsOutline },
  ];

  return (
    <div className="w-64 h-screen sticky top-0 border-r border-gray-200 md:flex flex-col justify-between p-2 bg-white">
      <aside className="hidden md:block">
        <div className="text-4xl font-bold m-4 text-start">
          <Link href="/" className="text-black hover:opacity-90">
            Orkut
          </Link>
        </div>
        <nav className="flex flex-col text-md p-2">
          <div className="flex flex-col space-y-3">
            {navItems.map(({ tab, label, Icon, showWhenLoggedIn }) => {
              if (showWhenLoggedIn && !isLoggedIn) return null;
              const active = isMainPage && activeTab === tab;
              if (isMainPage && setActiveTab) {
                return (
                  <SidebarButton
                    key={tab}
                    label={label}
                    Icon={Icon}
                    onClick={() => setActiveTab(tab)}
                    active={active}
                    sidebarColor={sidebarColor}
                  />
                );
              }
              return (
                <SidebarLink key={tab} label={label} Icon={Icon} href="/" />
              );
            })}

            <div className="p-2 space-y-2">
              {isLoggedIn ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-4 w-50 rounded-xl p-2 bg-amber-400 m-2 border-r-6 border-b-6 hover:bg-amber-400 border-black hover:border-r-4 hover:border-b-4 duration-300 justify-start bottom-2 fixed"
                >
                  <FiLogOut className="text-xl" />
                  <span className="text-md font-semibold">Logout</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-xl p-2 bg-amber-400 border-2 border-black hover:bg-amber-500 font-semibold text-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-2 rounded-xl p-2 bg-rose-500 text-white border-2 border-black hover:bg-rose-600 font-semibold text-center"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </div>
  );
}

type SidebarButtonProps = {
  label: string;
  Icon: IconType;
  onClick: () => void;
  active: boolean;
  sidebarColor: string;
  notificationCount?: number;
};

function SidebarButton({
  label,
  Icon,
  onClick,
  active,
  sidebarColor,
  notificationCount = 0,
}: SidebarButtonProps) {
  const isLight = sidebarColor === "bg-white" || sidebarColor === "bg-amber-400";
  const activeClass = active
    ? `${sidebarColor} ${isLight ? "text-black" : "text-white"} custom-border`
    : "";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 w-full rounded-xl p-2 ${activeClass} hover:${sidebarColor} border-black relative`}
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

function SidebarLink({
  label,
  Icon,
  href,
}: {
  label: string;
  Icon: IconType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 w-full rounded-xl p-2 hover:bg-gray-100 border-black relative"
    >
      <Icon className="text-lg" />
      <span className="text-md font-semibold">{label}</span>
    </Link>
  );
}
