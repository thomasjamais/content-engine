import { NextRequest, NextResponse } from 'next/server'

// Mock settings storage - in a real app, use a database
let settings = {
  platforms: {
    youtube: { enabled: false },
    tiktok: { enabled: false },
    meta: { enabled: false }
  },
  processing: {
    outputFormat: 'mp4',
    quality: 'high',
    maxDuration: 60
  }
}

export async function GET() {
  return NextResponse.json({ settings })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    settings = { ...settings, ...body }
    
    return NextResponse.json({ 
      success: true,
      settings 
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}