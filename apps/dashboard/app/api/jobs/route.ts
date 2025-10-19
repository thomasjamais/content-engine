import { NextRequest, NextResponse } from 'next/server';
import { contentQueue } from '@/lib/queue';

export async function GET() {
  try {
    // Get jobs from BullMQ
    const [waiting, active, completed, failed] = await Promise.all([
      contentQueue.getJobs(['waiting'], 0, 50),
      contentQueue.getJobs(['active'], 0, 50),
      contentQueue.getJobs(['completed'], 0, 50),
      contentQueue.getJobs(['failed'], 0, 50),
    ]);

    // Format jobs for API response
    const formatJob = (job: any) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress || 0,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      createdAt: new Date(parseInt(job.id)).toISOString(),
      opts: {
        priority: job.opts?.priority || 0,
        delay: job.opts?.delay || 0,
      },
    });

    const jobs = [
      ...waiting.map(job => ({ ...formatJob(job), status: 'waiting' })),
      ...active.map(job => ({ ...formatJob(job), status: 'processing' })),
      ...completed.map(job => ({ ...formatJob(job), status: 'completed' })),
      ...failed.map(job => ({ ...formatJob(job), status: 'failed' })),
    ];

    // Sort by creation time (newest first)
    jobs.sort((a, b) => parseInt(b.id) - parseInt(a.id));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, clipId, platform, scheduledFor, priority = 0 } = body;

    if (!type || !clipId) {
      return NextResponse.json(
        { error: 'Type and clipId are required' },
        { status: 400 }
      );
    }

    // Create job in BullMQ
    let job;
    const { createProcessClipJob, createPublishJob } = await import('@/lib/queue');
    
    switch (type) {
      case 'process-clip':
        job = await createProcessClipJob(clipId, priority);
        break;
        
      case 'publish-content':
        if (!platform) {
          return NextResponse.json(
            { error: 'Platform is required for publish jobs' },
            { status: 400 }
          );
        }
        
        const scheduleDate = scheduledFor ? new Date(scheduledFor) : undefined;
        job = await createPublishJob(clipId, platform, scheduleDate, priority);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid job type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}