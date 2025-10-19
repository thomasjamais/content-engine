'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Clip } from '../../../../packages/core/types';

interface ClipsResponse {
  clips: Clip[];
}

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClips();
  }, []);

  const fetchClips = async () => {
    try {
      const response = await fetch('/api/clips');
      if (!response.ok) throw new Error('Failed to fetch clips');
      const data: ClipsResponse = await response.json();
      setClips(data.clips);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchClips}
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
        <h1 className="text-3xl font-bold text-gray-800">Clips</h1>
        <Link
          href="/clips/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span>
          Add Clip
        </Link>
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📼</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No clips yet</h2>
          <p className="text-gray-500 mb-4">Upload your first clip to get started</p>
          <Link
            href="/clips/upload"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Upload Clip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map((clip) => (
            <div key={clip.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-100 h-48 flex items-center justify-center">
                <div className="text-gray-400 text-4xl">🎬</div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{clip.name}</h3>
                {clip.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{clip.description}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Duration: {formatDuration(clip.duration)}</span>
                  <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/schedule?clipId=${clip.id}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-center text-sm"
                  >
                    Schedule
                  </Link>
                  <Link
                    href={`/clips/${clip.id}`}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-center text-sm"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}