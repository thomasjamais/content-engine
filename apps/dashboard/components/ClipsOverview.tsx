'use client'

import { useState, useEffect } from 'react'
import { PlayIcon, CheckIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface Clip {
  id: string
  name: string
  description?: string
  duration: number
  filePath: string
  createdAt: string
  updatedAt: string
  selected?: boolean
}

export function ClipsOverview() {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClips()
  }, [])

  const fetchClips = async () => {
    try {
      const response = await fetch('/api/clips')
      if (response.ok) {
        const data = await response.json()
        setClips(data.clips || [])
      }
    } catch (error) {
      console.error('Failed to fetch clips:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClipSelection = async (clipId: string) => {
    try {
      const response = await fetch(`/api/clips/${clipId}/toggle`, {
        method: 'POST',
      })
      
      if (response.ok) {
        setClips(clips.map(clip => 
          clip.id === clipId ? { ...clip, selected: !clip.selected } : clip
        ))
      }
    } catch (error) {
      console.error('Failed to toggle clip selection:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const processSelectedClips = async () => {
    const selectedClips = clips.filter(clip => clip.selected)
    
    try {
      for (const clip of selectedClips) {
        const response = await fetch('/api/queue/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'process-clip',
            clipId: clip.id,
            priority: 1
          })
        })
        
        if (!response.ok) {
          console.error(`Failed to create job for clip ${clip.id}`)
        } else {
          console.log(`Job created for clip ${clip.id}`)
        }
      }
      
      alert(`Processing jobs created for ${selectedClips.length} clips!`)
    } catch (error) {
      console.error('Failed to create processing jobs:', error)
      alert('Failed to create processing jobs')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Available Clips ({clips.length})
        </h2>
        
        {clips.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No clips found. Add some video clips to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className={clsx(
                  'border rounded-lg p-4 cursor-pointer transition-colors',
                  {
                    'border-blue-500 bg-blue-50': clip.selected,
                    'border-gray-200 hover:border-gray-300': !clip.selected,
                  }
                )}
                onClick={() => toggleClipSelection(clip.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {clip.name}
                    </h3>
                    {clip.description && (
                      <p className="mt-1 text-xs text-gray-500 truncate">
                        {clip.description}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <PlayIcon className="h-3 w-3 mr-1" />
                        {formatDuration(clip.duration)}
                      </div>
                      <div className="truncate">
                        Path: {clip.filePath}
                      </div>
                    </div>
                  </div>
                  
                  <div className={clsx(
                    'ml-3 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center',
                    {
                      'bg-blue-600 border-blue-600': clip.selected,
                      'border-gray-300': !clip.selected,
                    }
                  )}>
                    {clip.selected && (
                      <CheckIcon className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {clips.some(clip => clip.selected) && (
          <div className="mt-6 pt-4 border-t">
            <button 
              onClick={processSelectedClips}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Process Selected Clips ({clips.filter(clip => clip.selected).length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}