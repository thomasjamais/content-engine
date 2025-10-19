'use client';

import { useEffect, useState } from 'react';
import type { Job, Clip, JobStatus } from '../../../packages/core/types';

interface JobWithClip extends Job {
  clip: Clip;
}

interface JobsResponse {
  jobs: JobWithClip[];
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data: JobsResponse = await response.json();
      setJobs(data.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'QUEUED': return 'bg-blue-100 text-blue-800';
      case 'RUNNING': return 'bg-yellow-100 text-yellow-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformEmoji = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE': return '📺';
      case 'TIKTOK': return '🎵';
      case 'META': return '📘';
      default: return '🌐';
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchJobs}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Jobs</h1>
        <div className="flex items-center gap-4">
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          )}
          <a
            href="/schedule"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>+</span>
            Schedule Job
          </a>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⏰</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No jobs yet</h2>
          <p className="text-gray-500 mb-4">Schedule your first publishing job to get started</p>
          <a
            href="/schedule"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Schedule Job
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.clip.name}</div>
                        <div className="text-sm text-gray-500">
                          Duration: {Math.floor(job.clip.duration / 60)}:{(job.clip.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPlatformEmoji(job.platform)}</span>
                        <span className="text-sm text-gray-900">{job.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      {job.error && (
                        <div className="text-xs text-red-600 mt-1" title={job.error}>
                          Error: {job.error.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : 'Immediate'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.publishedAt ? new Date(job.publishedAt).toLocaleString() : '-'}
                      {job.externalId && (
                        <div className="text-xs text-gray-500">ID: {job.externalId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && jobs.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Failed to refresh jobs: {error}
        </div>
      )}
    </div>
  );
}