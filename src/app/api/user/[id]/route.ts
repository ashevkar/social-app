import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET user profile by ID — only for logged-in users
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        profileImage: true,
        coverImage: true,
        _count: {
          select: {
            followers: true,
            following: true,
            tweets: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tweets = await prisma.tweet.findMany({
      where: { authorId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },
        likes: { select: { id: true, userId: true } },
        comments: {
          take: 5,
          include: {
            user: {
              select: { id: true, name: true, username: true },
            },
          },
        },
      },
    });

    const { _count, ...profile } = user;
    return NextResponse.json({
      ...profile,
      followersCount: _count.followers,
      followingCount: _count.following,
      tweetsCount: _count.tweets,
      tweets: tweets.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to load user' },
      { status: 500 }
    );
  }
}

// DELETE user by ID
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete likes by the user
      await tx.like.deleteMany({
        where: { userId: id }
      });

      // Delete comments by the user
      await tx.comment.deleteMany({
        where: { userId: id }
      });

      // Delete follow relationships where user is following or being followed
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: id },
            { followingId: id }
          ]
        }
      });

      // Delete tweets by the user (which will cascade delete related likes and comments)
      await tx.tweet.deleteMany({
        where: { authorId: id }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 