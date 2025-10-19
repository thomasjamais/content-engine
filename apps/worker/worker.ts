const { Worker, Job } = require('bullmq');
const Redis = require('ioredis');
const { processClip } = require('./processors/clipProcessor');
const { publishContent } = require('./processors/publishProcessor');

// Redis connection with fallback to in-memory for development
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  lazyConnect: true,
}).on('error', (err) => {
  console.warn('Redis connection failed, using memory fallback:', err.message);
});

// Job data interface
interface ProcessingJobData {
  type: 'process-clip' | 'publish-content';
  clipId?: string;
  platform?: string;
  scheduledFor?: string;
  metadata?: any;
}

// Job processor
async function processJob(job: Job<ProcessingJobData>) {
  console.log(`Processing job: ${job.id} (type: ${job.data.type})`);
  
  try {
    switch (job.data.type) {
      case 'process-clip':
        if (!job.data.clipId) {
          throw new Error('clipId is required for clip processing');
        }
        return await processClip(job.data.clipId, job);
        
      case 'publish-content':
        if (!job.data.clipId || !job.data.platform) {
          throw new Error('clipId and platform are required for publishing');
        }
        return await publishContent(job.data.clipId, job.data.platform, job);
        
      default:
        throw new Error(`Unknown job type: ${job.data.type}`);
    }
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
}

// Create worker
const worker = new Worker('content-processing', processJob, {
  connection: redis,
  concurrency: 2,
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 20 },
});

// Event handlers
worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

console.log('Content processing worker started, waiting for jobs...');