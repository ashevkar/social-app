import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Add proper types for NextAuth session
type SessionUserWithId = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// GET tweets with cursor-based pagination and heavy caching
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor'); // ISO timestamp or tweet ID
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50
    const sortBy = searchParams.get('sortBy') || 'recent'; // 'recent' or 'popular'
    const since = searchParams.get('since'); // For fetching new tweets since timestamp

    // Build where clause for cursor-based pagination
    const where: {
      createdAt?: {
        lt?: Date;
        gt?: Date;
      };
    } = {};
    
    // For "new tweets since" queries (push notification check)
    if (since) {
      where.createdAt = {
        gt: new Date(since)
      };
    } else if (cursor) {
      // Cursor is the createdAt timestamp of the last tweet
      where.createdAt = {
        lt: new Date(cursor)
      };
    }

    // For cursor pagination, fetch limit+1 to determine if there are more tweets
    const takeLimit = limit + 1;

    // Fetch tweets with optimized query
    let tweets = await prisma.tweet.findMany({
      where,
      take: takeLimit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          }
        },
        likes: {
          select: {
            id: true,
            userId: true,
          }
        },
        comments: {
          take: 5, // Only fetch first 5 comments for preview
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
    });

    // Sort by popularity if needed
    if (sortBy === 'popular') {
      tweets = tweets
        .sort((a, b) => b.likes.length - a.likes.length);
    }

    // Determine if there are more tweets (we fetched limit+1)
    const hasMore = tweets.length > limit;
    
    // Slice to the actual limit (remove the extra one we fetched)
    tweets = tweets.slice(0, limit);

    // Generate next cursor (timestamp of the last tweet)
    const nextCursor = tweets.length > 0 
      ? tweets[tweets.length - 1].createdAt.toISOString()
      : null;

    // Debug logging
    console.log('API Response:', {
      cursor: cursor,
      sortBy,
      limit,
      fetchedCount: tweets.length,
      hasMore,
      nextCursor,
      whereClause: where
    });

    // Heavy caching strategy - different cache times based on query type
    const cacheControl = since 
      ? 'public, s-maxage=5, stale-while-revalidate=10' // Shorter cache for "new" queries
      : 'public, s-maxage=30, stale-while-revalidate=120'; // Longer cache for regular pagination

    return NextResponse.json(
      {
        tweets,
        cursor: nextCursor,
        hasMore,
        count: tweets.length,
      },
      {
        headers: {
          'Cache-Control': cacheControl,
          'ETag': `"${tweets.length}-${nextCursor || 'end'}"`, // For cache validation
        }
      }
    );
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new tweet
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content, image } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const tweet = await prisma.tweet.create({
      data: {
        content,
        image,
        authorId: (session.user as SessionUserWithId).id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          }
        }
      }
    });

    return NextResponse.json(tweet, { status: 201 });
  } catch (error) {
    console.error('Error creating tweet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 