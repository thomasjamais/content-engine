'use client'

import { useState, useEffect } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  CheckIcon, 
  XIcon, 
  ClockIcon,
  RefreshCwIcon 
} from 'lucide-react'
import { clsx } from 'clsx'

interface Job {
  id: string
  clipId: string
  platform: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: string
  completedAt?: string
  error?: string
}

const statusIcons = {
  pending: ClockIcon,
  processing: RefreshCwIcon,
  completed: CheckIcon,
  failed: XIcon
}

const statusColors = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500'
}

export function JobsOverview() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const retryJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/retry`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchJobs() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to retry job:', error)
    }
  }

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/cancel`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchJobs() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to cancel job:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            Active Jobs ({jobs.length})
          </h2>
          <button
            onClick={fetchJobs}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No jobs found. Schedule some content to see jobs here.
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const StatusIcon = statusIcons[job.status]
              const statusColor = statusColors[job.status]

              return (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className={clsx('h-5 w-5', statusColor)} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Job #{job.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Clip: {job.clipId} → {job.platform}
                          </p>
                        </div>
                      </div>

                      {job.status === 'processing' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {job.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {job.error}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-500">
                        <div>Created: {formatDate(job.createdAt)}</div>
                        {job.completedAt && (
                          <div>Completed: {formatDate(job.completedAt)}</div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex space-x-2">
                      {job.status === 'failed' && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Retry
                        </button>
                      )}
                      
                      {job.status === 'processing' && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'processing', 'completed', 'failed'].map((status) => {
          const count = jobs.filter(job => job.status === status).length
          const StatusIcon = statusIcons[status as keyof typeof statusIcons]
          const colorClass = statusColors[status as keyof typeof statusColors]

          return (
            <div key={status} className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <StatusIcon className={clsx('h-6 w-6', colorClass)} />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 capitalize">
                    {status}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {count}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}