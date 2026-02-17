"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { FaTrash } from "react-icons/fa";
import LoadingPage from "./LoadingPage";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

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

type ApiResponse = {
  tweets: Tweet[];
  cursor: string | null;
  hasMore: boolean;
  count: number;
};

export default function TweetFeed({ tab }: { tab: 'popular' | 'mySeries' | 'recent' }) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newTweetsCount, setNewTweetsCount] = useState(0);
  const { data: session } = useSession();
  const abortControllerRef = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<string | null>(null);
  const lastFetchTimeRef = useRef<Date | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 500; // Minimum 500ms between fetches (reduced for better scroll responsiveness)

  // Fetch tweets with cursor-based pagination
  const fetchTweets = useCallback(async (
    options: { 
      reset?: boolean; 
      showLoading?: boolean;
      cursor?: string | null;
      checkNew?: boolean;
    } = {}
  ) => {
    const { reset = false, showLoading = false, cursor: cursorParam, checkNew = false } = options;
    
    // Prevent too frequent requests (except for initial load or manual refresh)
    const now = Date.now();
    if (!reset && !showLoading && !checkNew) {
      const timeSinceLastRequest = now - lastRequestTimeRef.current;
      if (timeSinceLastRequest < MIN_FETCH_INTERVAL) {
        console.log('Rate limited - too soon since last request:', timeSinceLastRequest, 'ms');
        return { hasNew: false };
      }
    }
    lastRequestTimeRef.current = now;
    console.log('Fetching tweets:', { reset, showLoading, checkNew, cursor: cursorParam || cursorRef.current });

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (showLoading) setIsRefreshing(true);
      if (!reset && !showLoading) setIsLoadingMore(true);
      
      const sortBy = tab === 'popular' ? 'popular' : 'recent';
      const currentCursor = cursorParam !== undefined ? cursorParam : (reset ? null : cursorRef.current);
      
      // Build query params
      const params = new URLSearchParams({
        sortBy,
        limit: '20',
      });
      
      if (checkNew && lastFetchTimeRef.current) {
        params.append('since', lastFetchTimeRef.current.toISOString());
      } else if (currentCursor && !checkNew) {
        params.append('cursor', currentCursor);
      }

      const res = await fetch(`/api/tweets?${params}`, {
        signal: abortControllerRef.current.signal,
        cache: 'no-store', // Always fetch fresh data for accurate pagination
      });

      if (!res.ok) throw new Error('Failed to fetch tweets');
      
      const data: ApiResponse = await res.json();
      
      // Ensure cursor and hasMore are defined
      const hasMoreValue = data.hasMore !== undefined ? data.hasMore : data.tweets.length > 0;
      const cursorValue = data.cursor || null;
      
      console.log('Fetched tweets response:', {
        count: data.tweets.length,
        hasMore: hasMoreValue,
        cursor: cursorValue,
        reset,
        checkNew,
        currentCursor: cursorRef.current,
        rawData: data
      });
      
      if (checkNew && data.tweets.length > 0) {
        // New tweets found - show notification
        setTweets(prev => [...data.tweets, ...prev]);
        setNewTweetsCount(prev => prev + data.tweets.length);
        lastFetchTimeRef.current = new Date();
        return { hasNew: true };
      } else if (reset) {
        setTweets(data.tweets);
        cursorRef.current = cursorValue;
        setHasMore(hasMoreValue && data.tweets.length > 0);
        console.log('Reset complete:', { cursor: cursorValue, hasMore: hasMoreValue && data.tweets.length > 0 });
      } else {
        // If we got no new tweets, there are no more to load
        if (data.tweets.length === 0) {
          console.log('No tweets returned, setting hasMore to false');
          setHasMore(false);
        } else {
          setTweets(prev => [...prev, ...data.tweets]);
          cursorRef.current = cursorValue;
          setHasMore(hasMoreValue);
          console.log('Appended tweets, updated state:', { 
            newCursor: cursorValue, 
            hasMore: hasMoreValue,
            appendedCount: data.tweets.length
          });
        }
      }
      
      lastFetchTimeRef.current = new Date();
      return { hasNew: false };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
        return { hasNew: false };
      }
      console.error("Error fetching tweets:", error);
      // Don't set hasMore to false on error - might be temporary
      return { hasNew: false };
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [tab]);

  // Real-time updates for likes and comments
  useRealtimeUpdates({
    enabled: !!session,
    onLike: (updates: Array<{ tweetId: string; userId: string; action: string }>) => {
      setTweets(prev => prev.map(tweet => {
        const update = updates.find((u) => u.tweetId === tweet.id);
        if (update) {
          const isLiked = tweet.likes.some(l => l.userId === update.userId);
          if (update.action === 'like' && !isLiked) {
            return {
              ...tweet,
              likes: [...tweet.likes, { id: 'temp', userId: update.userId }],
            };
          } else if (update.action === 'unlike' && isLiked) {
            return {
              ...tweet,
              likes: tweet.likes.filter(l => l.userId !== update.userId),
            };
          }
        }
        return tweet;
      }));
    },
    onComment: (updates: Array<{ tweetId: string; userId: string; commentId: string; content: string; username: string }>) => {
      // Update comment counts or add comments to tweets
      setTweets(prev => prev.map(tweet => {
        const update = updates.find((u) => u.tweetId === tweet.id);
        if (update) {
          return {
            ...tweet,
            comments: [...tweet.comments, {
              id: update.commentId,
              content: update.content,
              user: {
                id: update.userId,
                name: update.username,
                username: update.username,
              }
            }],
          };
        }
        return tweet;
      }));
    },
  });

  // Initial load
  useEffect(() => {
    fetchTweets({ reset: true, showLoading: true });
    cursorRef.current = null;
    lastFetchTimeRef.current = new Date();
  }, [tab, fetchTweets]); // Only refetch when tab changes

  // Conditional refresh: on window focus/visibility
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchTweets({ checkNew: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    
    // Listen for new tweet creation
    const handleTweetCreated = () => {
      fetchTweets({ checkNew: true });
    };
    window.addEventListener('tweetCreated', handleTweetCreated);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('tweetCreated', handleTweetCreated);
    };
  }, [fetchTweets]);

  // Use refs to avoid closure issues in intersection observer
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Infinite scroll with intersection observer
  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Only set up observer if we can load more
    if (!hasMore || isLoadingMore) {
      console.log('Observer not set up:', { hasMore, isLoadingMore });
      return;
    }

    console.log('Setting up intersection observer');

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log('Intersection observer triggered:', {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          hasMore: hasMoreRef.current,
          isLoadingMore: isLoadingMoreRef.current,
          cursor: cursorRef.current
        });
        
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          console.log('Fetching more tweets...');
          fetchTweets({});
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Start loading 200px before reaching the element (increased)
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
      console.log('Observer attached to element', {
        element: currentLoadMoreRef,
        hasMore,
        isLoadingMore
      });
    } else {
      console.warn('loadMoreRef.current is null! Observer cannot be attached.');
      // Try again after a short delay in case the element hasn't rendered yet
      timeoutId = setTimeout(() => {
        if (loadMoreRef.current && observerRef.current) {
          observerRef.current.observe(loadMoreRef.current);
          console.log('Observer attached on retry');
        }
      }, 100);
    }

    // Fallback: Also listen to scroll events as a backup
    const handleScroll = () => {
      if (!hasMoreRef.current || isLoadingMoreRef.current) return;
      
      const element = loadMoreRef.current;
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight + 200; // 200px threshold
      
      if (isVisible) {
        console.log('Scroll fallback triggered - loading more tweets');
        fetchTweets({});
      }
    };

    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      window.removeEventListener('scroll', throttledScroll);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [hasMore, isLoadingMore, fetchTweets]);

  const handleLike = async (tweetId: string) => {
    const userId = (session?.user as { id?: string })?.id;
    if (!session || !userId) return;

    // Optimistic update - update UI immediately
    const isLiked = tweets.find(t => t.id === tweetId)?.likes.some(
      (like) => like.userId === userId
    );
    
    setTweets(prevTweets => 
      prevTweets.map((tweet) => {
        if (tweet.id === tweetId) {
          return {
            ...tweet,
            likes: isLiked
              ? tweet.likes.filter((like) => like.userId !== userId)
              : [...tweet.likes, { id: "temp", userId }],
          };
        }
        return tweet;
      })
    );

    try {
      const res = await fetch(`/api/tweets/${tweetId}/like`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to like tweet");
      }

      // Refetch to get accurate data (or update from response)
      // For now, optimistic update is sufficient
    } catch (error) {
      console.error("Error liking tweet:", error);
      // Revert optimistic update on error
      fetchTweets({ checkNew: true });
    }
  };

  const handleDelete = async (tweetId: string) => {
    if (!window.confirm("Are you sure you want to delete this tweet?")) return;
    const res = await fetch(`/api/tweets/${tweetId}`, { method: "DELETE" });
    if (res.ok) {
      setTweets(tweets.filter(tweet => tweet.id !== tweetId));
    } else {
      alert("Failed to delete tweet.");
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">
        <LoadingPage />          
    </div>;
  }

  const userId = (session?.user as { id?: string })?.id;
  // Server handles sorting for 'popular' and 'recent' tabs
  // Only filter for 'mySeries' on client side
  let displayedTweets = tweets;
  if (tab === 'mySeries' && userId) {
    displayedTweets = tweets.filter(tweet => tweet.author.id === userId);
  }
  // 'popular' and 'recent' are already sorted by the server

  const handleRefresh = () => {
    setNewTweetsCount(0);
    fetchTweets({ reset: true, showLoading: true });
  };

  return (
    <div className="space-y-4">
      {/* Manual refresh button with new content indicator */}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <span className="animate-spin">🔄</span> Refreshing...
            </>
          ) : (
            <>
              <span>🔄</span> Refresh
              {newTweetsCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {newTweetsCount} new
                </span>
              )}
            </>
          )}
        </button>
      </div>
      {displayedTweets.map((tweet) => (
        <div key={tweet.id} className="custom-outline bg-white rounded-lg shadow p-4 relative">
          <div className="flex items-start space-x-3">
            {session ? (
              <Link
                href={`/?profile=${tweet.author.id}`}
                className="flex-shrink-0 rounded-full hover:opacity-90"
              >
                <Image
                  src={tweet.author.profileImage || "/avtar.jpg"}
                  alt={tweet.author.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full bg-blue-300"
                />
              </Link>
            ) : (
              <div className="flex-shrink-0 rounded-full">
                <Image
                  src={tweet.author.profileImage || "/avtar.jpg"}
                  alt={tweet.author.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full bg-blue-300"
                />
              </div>
            )}
            <div className="flex-1 text-gray-500">
              <div className="flex items-center space-x-1 flex-wrap">
                {session ? (
                  <Link
                    href={`/?profile=${tweet.author.id}`}
                    className="font-bold text-xl text-black hover:underline"
                  >
                    {tweet.author.name.charAt(0).toUpperCase() + tweet.author.name.slice(1)}
                  </Link>
                ) : (
                  <span className="font-bold text-xl text-black">
                    {tweet.author.name.charAt(0).toUpperCase() + tweet.author.name.slice(1)}
                  </span>
                )}
                {session ? (
                  <Link
                    href={`/?profile=${tweet.author.id}`}
                    className="text-sm hover:underline"
                  >
                    @{tweet.author.username}
                  </Link>
                ) : (
                  <span className="text-sm">@{tweet.author.username}</span>
                )}
                <span className="">-</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(tweet.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="mt-1">{tweet.content}</p>
              <div className="flex items-center space-x-4 mt-2">
                <button
                  onClick={() => handleLike(tweet.id)}
                  className={`flex items-center space-x-1 ${
                    tweet.likes.some((like) => like.userId === userId)
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{tweet.likes.length}</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{tweet.comments.length}</span>
                </button>
                {tweet.author.id === userId && (
                  <button
                    className="absolute bottom-3 right-3 text-zinc-400 hover:text-red-500"
                    onClick={() => handleDelete(tweet.id)}
                    title="Delete Tweet"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoadingMore ? (
            <div className="text-gray-500">Loading more tweets...</div>
          ) : (
            <div className="text-gray-400 text-sm">Scroll for more</div>
          )}
        </div>
      )}
      
      {!hasMore && tweets.length > 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          No more tweets to load
        </div>
      )}
    </div>
  );
}