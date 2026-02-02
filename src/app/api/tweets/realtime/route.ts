import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Server-Sent Events endpoint for real-time updates
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      send({ type: 'connected', timestamp: new Date().toISOString() });

      // Poll for updates (this would be replaced with database triggers/pubsub in production)
      const pollInterval = setInterval(async () => {
        try {
          // Check for new likes/comments on visible tweets
          // In production, use database triggers or message queue
          const recentLikes = await prisma.like.findMany({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 5000), // Last 5 seconds
              }
            },
            include: {
              tweet: {
                select: { id: true }
              },
              user: {
                select: { id: true, username: true }
              }
            },
            take: 10,
          });

          if (recentLikes.length > 0) {
            send({
              type: 'likes',
              data: recentLikes.map(like => ({
                tweetId: like.tweetId,
                userId: like.userId,
                username: like.user.username,
                action: 'like',
              }))
            });
          }

          const recentComments = await prisma.comment.findMany({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 5000),
              }
            },
            include: {
              tweet: {
                select: { id: true }
              },
              user: {
                select: { id: true, username: true }
              }
            },
            take: 10,
          });

          if (recentComments.length > 0) {
            send({
              type: 'comments',
              data: recentComments.map(comment => ({
                tweetId: comment.tweetId,
                userId: comment.userId,
                username: comment.user.username,
                commentId: comment.id,
                content: comment.content,
              }))
            });
          }
        } catch (error) {
          console.error('SSE error:', error);
          send({ type: 'error', message: 'Update check failed' });
        }
      }, 2000); // Check every 2 seconds

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}
