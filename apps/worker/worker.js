const { Worker } = require('bullmq');
const Redis = require('ioredis');

// Redis connection with fallback
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  lazyConnect: true,
}).on('error', (err) => {
  console.warn('Redis connection failed, using memory fallback:', err.message);
});

// Mock processors
async function processClip(clipId, job) {
  console.log(`Processing clip: ${clipId}`);
  
  // Update job progress
  await job.updateProgress(10);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await job.updateProgress(50);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await job.updateProgress(100);
  
  return {
    success: true,
    clipId,
    outputPath: `/processed/${clipId}_final.mp4`,
    duration: 30
  };
}

async function publishContent(clipId, platform, job) {
  console.log(`Publishing clip ${clipId} to ${platform}`);
  
  await job.updateProgress(25);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await job.updateProgress(75);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await job.updateProgress(100);
  
  return {
    success: true,
    clipId,
    platform,
    publishId: `${platform}_${clipId}_${Date.now()}`,
    publishedAt: new Date().toISOString()
  };
}

// Job processor
async function processJob(job) {
  console.log(`Processing job: ${job.id} (type: ${job.data.type})`);
  
  try {
    switch (job.data.type) {
      case 'process-clip':
        if (!job.data.clipId) {
          throw new Error('clipId is required for clip processing');
        }
        return await processClip(job.data.clipId, job);
        
      case 'process-drive-file':
        if (!job.data.fileId || !job.data.fileName) {
          throw new Error('fileId and fileName are required for Drive file processing');
        }
        return await processClip(job.data.clipId || job.data.fileId, job);
        
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