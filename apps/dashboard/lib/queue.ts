import { Queue } from 'bullmq'
import Redis from 'ioredis'

// Redis connection for dashboard (same as worker)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  lazyConnect: true,
})

// Create queue instance
export const contentQueue = new Queue('content-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

// Job creation helpers
export async function createProcessClipJob(clipId: string, priority: number = 0) {
  return await contentQueue.add(
    'process-clip',
    {
      type: 'process-clip',
      clipId,
    },
    {
      priority,
      delay: 0,
    }
  )
}

export async function createPublishJob(
  clipId: string, 
  platform: string, 
  scheduledFor?: Date,
  priority: number = 0
) {
  const delay = scheduledFor ? scheduledFor.getTime() - Date.now() : 0
  
  return await contentQueue.add(
    'publish-content',
    {
      type: 'publish-content',
      clipId,
      platform,
      scheduledFor: scheduledFor?.toISOString(),
    },
    {
      priority,
      delay: Math.max(0, delay),
    }
  )
}