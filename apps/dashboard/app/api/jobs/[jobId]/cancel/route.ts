import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId
  
  try {
    // In a real app, cancel the job in BullMQ
    return NextResponse.json({ 
      success: true,
      message: `Job ${jobId} cancelled`
    })
  } catch (error) {
    console.error('Error cancelling job:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    )
  }
}