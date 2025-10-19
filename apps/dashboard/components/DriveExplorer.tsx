'use client'

import { useState, useEffect } from 'react'
import { FolderIcon, VideoIcon, DownloadIcon, PlayIcon, SearchIcon, RefreshCwIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  modifiedTime?: string
  webViewLink?: string
  thumbnailLink?: string
}

export function DriveExplorer() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [folderId, setFolderId] = useState<string | undefined>()
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFiles()
  }, [folderId])

  const loadFiles = async (pageToken?: string, query?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (folderId) params.append('folderId', folderId)
      if (pageToken) params.append('pageToken', pageToken)
      if (query) params.append('query', query)
      
      const response = await fetch(`/api/drive?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to load files')
      }
      
      if (pageToken) {
        setFiles(prev => [...prev, ...data.files])
      } else {
        setFiles(data.files || [])
      }
      
      setNextPageToken(data.nextPageToken)
    } catch (err: any) {
      setError(err.message)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadFiles(undefined, searchQuery)
  }

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    setSelectedFiles(newSelection)
  }

  const processSelectedFiles = async () => {
    if (selectedFiles.size === 0) return

    const selectedFilesList = files.filter(file => selectedFiles.has(file.id))
    
    try {
      for (const file of selectedFilesList) {
        // Create processing job for this Drive file
        const response = await fetch('/api/queue/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'process-drive-file',
            fileId: file.id,
            fileName: file.name,
            driveFile: file,
            priority: 1
          })
        })
        
        if (!response.ok) {
          console.error(`Failed to create job for ${file.name}`)
        } else {
          console.log(`Processing job created for ${file.name}`)
        }
      }
      
      alert(`Processing jobs created for ${selectedFiles.size} files!`)
      setSelectedFiles(new Set()) // Clear selection
    } catch (error) {
      console.error('Failed to create processing jobs:', error)
      alert('Failed to create processing jobs')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`
    }
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString()
  }

  if (error && error.includes('not configured')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">
          Google Drive Configuration Required
        </h3>
        <p className="text-yellow-700 mb-4">
          To browse your Google Drive files, please configure the GOOGLE_APPLICATION_CREDENTIALS environment variable with your service account key.
        </p>
        <div className="bg-yellow-100 p-3 rounded text-sm text-yellow-800 font-mono">
          export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search videos in Google Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Google Drive Videos ({files.length})
          </h2>
          {selectedFiles.size > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedFiles.size} files selected
              </span>
              <button
                onClick={processSelectedFiles}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Process Selected ({selectedFiles.size})
              </button>
            </div>
          )}
        </div>

        {loading && files.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-600">
            <p className="font-medium">Error loading files</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => loadFiles()}
              className="mt-3 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {files.length === 0 && !loading && !error && (
          <div className="p-6 text-center text-gray-500">
            No video files found. Try searching or check your Drive permissions.
          </div>
        )}

        {files.length > 0 && (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div
                key={file.id}
                className={clsx(
                  'p-4 cursor-pointer transition-colors hover:bg-gray-50',
                  {
                    'bg-blue-50 border-l-4 border-l-blue-500': selectedFiles.has(file.id)
                  }
                )}
                onClick={() => toggleFileSelection(file.id)}
              >
                <div className="flex items-start space-x-4">
                  {file.thumbnailLink ? (
                    <img
                      src={file.thumbnailLink}
                      alt={file.name}
                      className="w-16 h-12 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <VideoIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </h3>
                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                      <div>Size: {formatFileSize(file.size)}</div>
                      <div>Modified: {formatDate(file.modifiedTime)}</div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DownloadIcon className="h-3 w-3 mr-1" />
                          View in Drive
                        </a>
                      )}
                    </div>
                  </div>

                  <div className={clsx(
                    'w-5 h-5 rounded border flex items-center justify-center',
                    {
                      'bg-blue-600 border-blue-600': selectedFiles.has(file.id),
                      'border-gray-300': !selectedFiles.has(file.id),
                    }
                  )}>
                    {selectedFiles.has(file.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {nextPageToken && (
          <div className="p-4 border-t border-gray-200 text-center">
            <button
              onClick={() => loadFiles(nextPageToken)}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}