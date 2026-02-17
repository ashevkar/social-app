"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import TweetFeed from "./TweetFeed";
import Image from "next/image";

export default function CreateTweet({
  onTweetCreated,
}: {
  onTweetCreated?: () => void;
}) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"recent" | "mySeries">(
    "recent"
  );
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = (data as { error?: string }).error || res.statusText || "Failed to create tweet";
        setError(message);
        return;
      }

      setContent("");
      if (onTweetCreated) onTweetCreated();
      window.dispatchEvent(new CustomEvent("tweetCreated"));
    } catch (err) {
      console.error("Error creating tweet:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full text-black  mt-6 mb-3">
      {/* Orkut Feed Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-black italic mb-2">ORKUT FEED</h1>
        <div className="mt-3 text-lg flex border-2 border-black rounded-lg overflow-hidden ">
          <button
            className={`w-1/2 font-bold m-0.5 rounded-lg border-black ${
              selectedTab === "recent"
                ? "bg-rose-500 text-white"
                : "text-zinc-600 bg-white"
            }`}
            onClick={() => setSelectedTab("recent")}
            type="button"
          >
            ⚡ Recent Tweets
          </button>

          <button
            className={`w-1/2 font-semibold m-0.5 py-1.5 rounded-lg border-black ${
              selectedTab === "mySeries"
                ? "bg-blue-400 text-white"
                : "text-zinc-600 bg-white"
            }`}
            onClick={() => setSelectedTab("mySeries")}
            type="button"
          >
            ☆ My Series
          </button>
        </div>
      </div>

      <hr className=" h-1.5 p-0 border-0  md:my-4 bg-black" />

      {/* 📝 Post Form */}
      <div className="border-r-10 border-b-10 bg-white text-black p-4 rounded-xl shadow-md border-2 mb-4">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-0 border-black">
              <Image
                src="/avtar.jpg"
                width={40}
                height={40}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 relative">
              {/* Banner */}
              <div className="absolute -top-3 left-0 bg-yellow-300 text-black px-2 py-0.5 text-xs font-bold rotate-[-5deg] border border-black shadow-sm">
                SHARE YOUR THOUGHTS!
              </div>

              {/* Textarea */}
              <textarea
                className="w-full mt-3 p-3 border-2 border-black rounded-xl bg-gray-100 text-black focus:outline-none"
                rows={3}
                placeholder="What's happening in your orkut world?"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 font-medium" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            {/* Icons Row */}
            <div className="flex justify-start gap-6 mt-4 px-3">
              <IconButton icon="🖼️" />
              <IconButton icon="😊" />
              <IconButton icon="📅" />
              <IconButton icon="📍" />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="custom-border bg-blue-500 text-white px-6 py-2 rounded-xl shadow-md font-bold border-2 border-black hover:bg-pink-400 disabled:opacity-50"
              >
                {isLoading ? "Posting..." : "SHARE!"}
              </button>
            </div>
          </div>
        </form>
      </div>
      {/* Render TweetFeed below the form */}
      <TweetFeed tab={selectedTab} />
    </div>
  );
}

// 🧩 Reusable Icon Button
function IconButton({ icon }: { icon: string }) {
  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-black text-xl bg-white hover:bg-gray-100 cursor-pointer">
      {icon}
    </div>
  );
}
