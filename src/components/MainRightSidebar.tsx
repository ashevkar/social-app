"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Tweet = { id: string; content: string };
type User = { id: string; username: string };

export default function MainRightSidebar() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session;
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    tweets: Tweet[];
    users: User[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/tweets")
      .then((res) => res.json())
      .then((data) => setAllTweets(Array.isArray(data?.tweets) ? data.tweets : []));
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setAllUsers(data) : setAllUsers([])))
      .catch(() => setAllUsers([]));
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length === 0) {
      setSearchResults(null);
      return;
    }
    const filteredTweets = allTweets.filter((t) =>
      t.content.toLowerCase().includes(value.toLowerCase())
    );
    const filteredUsers = allUsers.filter((u) =>
      u.username.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults({ tweets: filteredTweets, users: filteredUsers });
  };

  return (
    <div className="w-auto h-screen border-x border-gray-200 sticky top-0 hidden lg:flex flex-col p-2 space-y-4 overflow-y-auto">
      <aside className="p-2 hidden lg:block">
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
                {searchResults.users.length === 0 && (
                  <div className="text-gray-400 text-sm">No users found</div>
                )}
                {searchResults.users.map((user) =>
                  isLoggedIn ? (
                    <Link
                      key={user.id}
                      href={`/?profile=${user.id}`}
                      className="block p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      @{user.username}
                    </Link>
                  ) : (
                    <div
                      key={user.id}
                      className="block p-2 rounded text-gray-400 cursor-not-allowed"
                      title="Log in to view profile"
                    >
                      @{user.username}
                    </div>
                  )
                )}
              </div>
              <div className="border-t p-2">
                <div className="font-bold text-gray-700">Tweets</div>
                {searchResults.tweets.length === 0 && (
                  <div className="text-gray-400 text-sm">No tweets found</div>
                )}
                {searchResults.tweets.map((tweet) => (
                  <div
                    key={tweet.id}
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    {tweet.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-gray-100 rounded-xl p-4">
          <h2 className="text-lg font-bold mb-4">Trends for you</h2>
          <div className="mb-2">#Nextjs</div>
          <div className="mb-2">#React</div>
          <div className="mb-2">#WebDev</div>
          <div className="mb-2">#TailwindCSS</div>
        </div>
      </aside>
    </div>
  );
}
