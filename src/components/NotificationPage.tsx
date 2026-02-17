"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
// import { Tweet } from "@/types/Tweet"; // Adjust path if needed
import Image from "next/image";

// Define the session user type
type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
};

type Tweet = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
  };
  likes: {
    id: string;
    userId: string;
  }[];
  comments: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      username: string;
    };
  }[];
};

type LikeNotification = {
  id: string;
  user: { name?: string; username: string };
  tweet: { content: string };
};

export default function NotificationPage() {
  const { data: session } = useSession();
  const [taggedTweets, setTaggedTweets] = useState<Tweet[]>([]);
  const [likeNotifications, setLikeNotifications] = useState<
    LikeNotification[]
  >([]);
  const [activeTab, setActiveTab] = useState<"all" | "mentions" | "likes">(
    "all"
  );

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/tweets/liked")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setLikeNotifications(Array.isArray(data) ? data : []))
      .catch(() => setLikeNotifications([]));
  }, [session]);

  useEffect(() => {
    const username = session?.user && (session.user as SessionUser).username;
    if (!username) {
      setTaggedTweets([]);
      return;
    }
    fetch(`/api/tweets/tagged?username=${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setTaggedTweets(Array.isArray(data) ? data : []))
      .catch(() => setTaggedTweets([]));
  }, [session]);

  return (
    <div className="bg-zinc-50  min-h-screen font-sans text-black rounded-2xl">
      <div className="p-6">
        <h1 className="text-3xl font-black italic mb-2">NOTIFICATIONS</h1>
        <p className="text-lg text-gray-500">
          Stay updated with all your Orkut activity!
        </p>

        <div className="text-right mb-4 text-sm">
          <button
            className="custom-border py-2 px-4 hover:bg-blue-500 hover:text-white "
            onClick={() => {
              setTaggedTweets([]);
              setLikeNotifications([]);
            }}
          >
            Mark All as Read
          </button>
        </div>
        {/* Tabs */}
        <div className="flex bg-[#fef9f1] rounded overflow-hidden mb-4  border-b-2 border-black">
          <button
            className={`flex-1 py-3 font-bold text-center ${
              activeTab === "all"
                ? "text-white bg-amber-400 border-2 border-black rounded-t-2xl"
                : "text-gray-700 hover:text-black"
            }`}
            onClick={() => setActiveTab("all")}
          >
            ALL
          </button>
          <button
            className={`flex-1 py-3 font-bold text-center ${
              activeTab === "mentions"
                ? "text-white bg-purple-600 border-2 border-black rounded-t-2xl"
                : "text-gray-700 hover:text-black"
            }`}
            onClick={() => setActiveTab("mentions")}
          >
            MENTIONS
          </button>
          <button
            className={`flex-1 py-3 font-bold text-center ${
              activeTab === "likes"
                ? "text-white bg-green-600 border-2 border-black rounded-t-2xl"
                : "text-gray-700 hover:text-black"
            }`}
            onClick={() => setActiveTab("likes")}
          >
            LIKES
          </button>
        </div>

        {/* Notifications */}
        {activeTab === "all" && (
          <>
            {/* Mentions */}
            {taggedTweets.length === 0 && likeNotifications.length === 0 ? (
              <div className="text-gray-500 mb-3 text-center py-8 ">
                No new notifications!
              </div>
            ) : (
              <>
                {taggedTweets.map((tweet) => (
                  <div
                    key={tweet.id}
                    className="border-2 mb-3 border-black rounded-xl p-4 flex items-start space-x-4 "
                  >
                    <Image
                      src="/avtar.jpg"
                      width={50}
                      height={50}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full border-2 border-black"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-lg font-bold">
                          {tweet.author.name || tweet.author.username}
                        </div>
                        <span className="text-sm text-gray-600">
                          mentioned you in a comment
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-800">
                        {tweet.content}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Likes */}
                {likeNotifications.map((like) => (
                  <div
                    key={like.id}
                    className="border-2 mb-3 border-green-500 rounded-xl p-4 flex items-start space-x-4"
                  >
                    <Image
                      src="/avtar.jpg"
                      width={50}
                      height={50}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full border-2 border-black"
                    />

                    <div>
                      <div className="flex mb-3 items-center gap-2">
                        <div className="text-lg font-bold">
                          {like.user.name || like.user.username}
                        </div>
                        <span className="text-sm text-green-600">
                          liked your tweet
                        </span>
                      </div>
                      <div className="bg-green-50 rounded-lg px-4 py-2 text-gray-800">
                        {like.tweet.content}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === "mentions" &&
          (taggedTweets.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No mention notifications!
            </div>
          ) : (
            taggedTweets.map((tweet) => (
              <div
                key={tweet.id}
                className="border-2 mb-3 border-black rounded-xl p-4 flex items-start space-x-4"
              >
                    <Image src="/avtar.jpg" width={50} height={50} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-black " />
                    <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-lg font-bold">
                      {tweet.author.name || tweet.author.username}
                    </div>
                    <span className="text-sm text-gray-600">
                      mentioned you in a comment
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-800">
                    {tweet.content}
                  </div>
                </div>
              </div>
            ))
          ))}

        {activeTab === "likes" &&
          (likeNotifications.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No like notifications!
            </div>
          ) : (
            likeNotifications.map((like) => (
              <div
                key={like.id}
                className="border-2 mb-3 border-green-500 rounded-xl p-4 flex items-start space-x-4"
              >
                    <Image src="/avtar.jpg" width={50} height={50} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-black" />
                    <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-lg font-bold">
                      {like.user.name || like.user.username}
                    </div>
                    <span className="text-sm text-green-600">
                      liked your tweet
                    </span>
                  </div>
                  <div className="bg-green-50 rounded-lg px-4 py-2 text-gray-800">
                    {like.tweet.content}
                  </div>
                </div>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}
