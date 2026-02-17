"use client";
// import { VscAccount } from "react-icons/vsc";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LoadingPage from "./LoadingPage";
import { IoMdColorWand } from "react-icons/io";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session;
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    username: "",
    bio: "",
    profileImage: "",
  });
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sidebarColor, setSidebarColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarColor') || 'bg-purple-500';
    }
    return 'bg-purple-500';
  });

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarColor', sidebarColor);
      window.dispatchEvent(new Event('sidebarColorChanged'));
    }
  }, [sidebarColor]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      alert("Password changed successfully!");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      alert(data.message || "Failed to change password.");
    }
  };

  if (loading) return <div>
    <LoadingPage/>
  </div>;

  return (
    <div className="font-sans font-bold m-4 p-6 bg-white rounded-2xl text-black shadow-lg">
      
        <h1 className="text-3xl font-black italic mb-2">SETTINGS</h1>
        <p className="text-lg text-gray-500 mb-6"> Customize your Orkut experience!</p>
        <div className="border-4 rounded-2xl p-6">
      <div className="flex items-center space-x-4 mb-6  ">
        
        {profile.profileImage ? (
          <Image
            src={profile.profileImage}
            alt="Profile"
            width={30}
            height={30}
            className="w-20 h-20 rounded-full border-2 border-black"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-black text-4xl">
            <Image
            src="/avtar.jpg"
            alt="Profile"
            width={30}
            height={30}
            className="w-20 h-20 rounded-full border-2 border-black"
          />
          </div>
        )}
       
        <div>
          <h2 className="text-2xl font-bold">{profile.name.charAt(0).toUpperCase() + profile.name.slice(1)}</h2>
          <p className="text-gray-600">@{profile.username}</p>
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-semibold">Bio</label>
        <p className="text-gray-700">{profile.bio || "No bio yet."}</p>
      </div>
      <div className="mb-4">
        <label className="block font-semibold">Email</label>
        <p className="text-gray-700">{profile.email}</p>
      </div>
      {/* Change password - only for logged-in users */}
      {isLoggedIn && (
        <>
          <button
            className="w-50 rounded-xl p-2 custom-border hover:bg-amber-400"
            onClick={() => setShowPasswordForm(true)}
          >
            Change Password
          </button>
          {showPasswordForm && (
            <div className="mt-4 p-4 border-4 rounded-xl bg-gray-50">
              <div className="mb-2">
                <label className="block font-semibold">Current Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-2 py-1"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold">New Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-2 py-1"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="mb-2">
                <label className="block font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full border rounded px-2 py-1"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-between pt-2">
                <button
                  className="custom-border w-50 p-2 pl-3 hover:bg-green-500"
                  onClick={handlePasswordChange}
                >
                  Save Password
                </button>
                <button
                  className="custom-border w-50 p-2 hover:bg-zinc-500 hover:text-white"
                  onClick={() => setShowPasswordForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
       </div>
            <div className="border-4 rounded-2xl p-2 mt-2 ">
        <div className="flex p-3 gap-3 items-center font-extrabold ">
        <div>
            <IoMdColorWand
            className="text-3xl text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl font-black italic ">APPEARANCE</h1>
          </div>

          </div>
          <p className="text-lg text-zinc-700 mt-2 pl-4"> Color Theme</p>

          {/* Color Theme Selector */}
          <div className="flex gap-3 p-3">
            {[
              { name: 'Red', value: 'bg-rose-500' },
              { name: 'Yellow', value: 'bg-amber-400' },
              { name: 'Blue', value: 'bg-blue-500' },
              { name: 'Green', value: 'bg-green-500' },
              { name: 'Purple', value: 'bg-purple-500' },
            ].map((color) => (
              <button
                key={color.value}
                className={`w-30 h-8 rounded-2xl border-0.5 focus:outline-none focus:ring-2.5 focus:ring-black ${color.value} ${sidebarColor === color.value ? 'ring-2 ring-black' : ''}`}
                onClick={() => setSidebarColor(color.value)}
                aria-label={`Set sidebar color to ${color.name}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 px-3 pb-2">Sidebar color will update next time you visit the main page.</p>
          </div>
    </div>
   
  );
}
