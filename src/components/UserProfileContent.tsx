"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import LoadingPage from "./LoadingPage";

export type UserProfileData = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  profileImage: string | null;
  coverImage: string | null;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  tweets: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      username: string;
      profileImage: string | null;
    };
    likes: { id: string; userId: string }[];
    comments: Array<{
      id: string;
      content: string;
      user: { id: string; name: string; username: string };
    }>;
  }>;
};

type UserProfileContentProps = {
  userId: string;
};

export default function UserProfileContent({ userId }: UserProfileContentProps) {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/user/${userId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) setError("User not found");
          else setError("Failed to load profile");
          return null;
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingPage />;
  if (error || !user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 mb-4">{error || "User not found"}</p>
        <Link href="/" className="text-blue-600 hover:underline font-medium">
          ← Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline font-medium">
          ← Back to feed
        </Link>
      </div>
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        {user.coverImage ? (
          <div className="h-32 bg-gray-200 relative">
            <Image
              src={user.coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-r from-amber-200 to-rose-200" />
        )}

        <div className="px-4 pb-6 -mt-12 relative">
          <div className="inline-block rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
            <Image
              src={user.profileImage || "/avtar.jpg"}
              alt={user.name}
              width={96}
              height={96}
              className="w-24 h-24 object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold mt-4 text-black">
            {user.name.charAt(0).toUpperCase() + user.name.slice(1)}
          </h2>
          <p className="text-gray-500">@{user.username}</p>
          {user.bio && <p className="mt-3 text-gray-700">{user.bio}</p>}
          <div className="flex gap-6 mt-4 text-gray-600">
            <span>
              <strong className="text-black">{user.followersCount}</strong> Followers
            </span>
            <span>
              <strong className="text-black">{user.followingCount}</strong> Following
            </span>
            <span>
              <strong className="text-black">{user.tweetsCount}</strong> Tweets
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <h3 className="px-4 py-3 font-bold text-lg border-b border-gray-100">
            Tweets
          </h3>
          {user.tweets.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No tweets yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {user.tweets.map((tweet) => (
                <li key={tweet.id} className="p-4 hover:bg-gray-50/50">
                  <div className="flex gap-3">
                    <Image
                      src={tweet.author.profileImage || "/avtar.jpg"}
                      alt={tweet.author.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-bold text-black">
                          {tweet.author.name}
                        </span>
                        <span className="text-gray-500 text-sm">
                          @{tweet.author.username}
                        </span>
                        <span className="text-gray-400 text-sm">
                          · {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-800 whitespace-pre-wrap">
                        {tweet.content}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>❤️ {tweet.likes.length}</span>
                        <span>💬 {tweet.comments.length}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
