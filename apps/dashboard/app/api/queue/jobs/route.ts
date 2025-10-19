import { NextRequest, NextResponse } from 'next/server'
import { createProcessClipJob, createPublishJob } from '@/lib/queue'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, clipId, platform, scheduledFor, priority = 0 } = body

    if (!type || !clipId) {
      return NextResponse.json(
        { error: 'Type and clipId are required' },
        { status: 400 }
      )
    }

    let job
    
    switch (type) {
      case 'process-clip':
        job = await createProcessClipJob(clipId, priority)
        break
        
      case 'publish-content':
        if (!platform) {
          return NextResponse.json(
            { error: 'Platform is required for publish jobs' },
            { status: 400 }
          )
        }
        
        const scheduleDate = scheduledFor ? new Date(scheduledFor) : undefined
        job = await createPublishJob(clipId, platform, scheduleDate, priority)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid job type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}