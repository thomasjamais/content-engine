'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Clip, CreateJobRequest, Platform } from '../../../packages/core/types';

interface JobsResponse {
  jobs: any[];
}

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const clipId = searchParams?.get('clipId');

  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<string>(clipId || '');
  const [platform, setPlatform] = useState<Platform>('YOUTUBE');
  const [scheduledAt, setScheduledAt] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClips();
  }, []);

  const fetchClips = async () => {
    try {
      const response = await fetch('/api/clips');
      if (!response.ok) throw new Error('Failed to fetch clips');
      const data = await response.json();
      setClips(data.clips);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clips');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const jobRequest: CreateJobRequest = {
        clipId: selectedClip,
        platform,
        scheduledAt: scheduledAt || undefined,
        title: title || undefined,
        caption: caption || undefined,
        hashtags: hashtags ? hashtags.split(',').map(h => h.trim()) : undefined
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule job');
      }

      setSuccess(true);
      // Reset form
      setTitle('');
      setCaption('');
      setHashtags('');
      setScheduledAt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Job Scheduled!</h2>
          <p className="text-green-700 mb-4">Your clip has been scheduled for publishing.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setSuccess(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Schedule Another
            </button>
            <a
              href="/jobs"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              View Jobs
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Schedule Publishing</h1>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clip Selection */}
          <div>
            <label htmlFor="clip" className="block text-sm font-medium text-gray-700 mb-2">
              Select Clip
            </label>
            <select
              id="clip"
              value={selectedClip}
              onChange={(e) => setSelectedClip(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a clip...</option>
              {clips.map((clip) => (
                <option key={clip.id} value={clip.id}>
                  {clip.name} ({Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, '0')})
                </option>
              ))}
            </select>
          </div>

          {/* Platform Selection */}
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="YOUTUBE">YouTube</option>
              <option value="TIKTOK">TikTok</option>
              <option value="META">Meta (Facebook/Instagram)</option>
            </select>
          </div>

          {/* Schedule Time */}
          <div>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Time (Optional)
            </label>
            <input
              type="datetime-local"
              id="scheduledAt"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to publish immediately</p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom title..."
            />
          </div>

          {/* Caption */}
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
              Caption (Optional)
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter caption..."
            />
          </div>

          {/* Hashtags */}
          <div>
            <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags (Optional)
            </label>
            <input
              type="text"
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3..."
            />
            <p className="text-xs text-gray-500 mt-1">Separate hashtags with commas</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedClip}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
          >
            {loading ? 'Scheduling...' : 'Schedule Publishing'}
          </button>
        </form>
      </div>
    </div>
  );
}