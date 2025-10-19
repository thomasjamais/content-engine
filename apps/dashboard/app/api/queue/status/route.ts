import { NextRequest, NextResponse } from 'next/server'
import { contentQueue } from '@/lib/queue'

export async function GET() {
  try {
    // Get jobs from BullMQ
    const [waiting, active, completed, failed] = await Promise.all([
      contentQueue.getJobs(['waiting'], 0, 50),
      contentQueue.getJobs(['active'], 0, 50),
      contentQueue.getJobs(['completed'], 0, 50),
      contentQueue.getJobs(['failed'], 0, 50),
    ])

    // Format jobs for API response
    const formatJob = (job: any) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      opts: {
        priority: job.opts.priority,
        delay: job.opts.delay,
      },
    })

    const jobs = [
      ...waiting.map(job => ({ ...formatJob(job), status: 'waiting' })),
      ...active.map(job => ({ ...formatJob(job), status: 'active' })),
      ...completed.map(job => ({ ...formatJob(job), status: 'completed' })),
      ...failed.map(job => ({ ...formatJob(job), status: 'failed' })),
    ]

    // Sort by creation time (newest first)
    jobs.sort((a, b) => parseInt(b.id) - parseInt(a.id))

    return NextResponse.json({ 
      jobs,
      count: jobs.length,
      stats: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      }
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}