'use client'

import { useState, useEffect } from 'react'
import { SaveIcon, TestTubeIcon } from 'lucide-react'

interface Settings {
  platforms: {
    youtube: {
      enabled: boolean
      apiKey?: string
      channelId?: string
    }
    tiktok: {
      enabled: boolean
      accessToken?: string
    }
    meta: {
      enabled: boolean
      accessToken?: string
      pageId?: string
    }
  }
  processing: {
    outputFormat: string
    quality: string
    maxDuration: number
  }
}

const defaultSettings: Settings = {
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

export function SettingsManager() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data.settings })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (platform: string) => {
    try {
      const response = await fetch(`/api/platforms/${platform}/test`, {
        method: 'POST'
      })
      
      const result = await response.json()
      alert(result.success ? 'Connection successful!' : `Connection failed: ${result.error}`)
    } catch (error) {
      alert('Connection test failed')
    }
  }

  return (
    <div className="space-y-8">
      {/* Platform Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Platform Settings</h2>
        
        {/* YouTube */}
        <div className="space-y-4 border-b pb-6 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">YouTube</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.platforms.youtube.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    youtube: { ...settings.platforms.youtube, enabled: e.target.checked }
                  }
                })}
                className="mr-2"
              />
              Enable
            </label>
          </div>
          
          {settings.platforms.youtube.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="API Key"
                value={settings.platforms.youtube.apiKey || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    youtube: { ...settings.platforms.youtube, apiKey: e.target.value }
                  }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Channel ID"
                value={settings.platforms.youtube.channelId || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    youtube: { ...settings.platforms.youtube, channelId: e.target.value }
                  }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => testConnection('youtube')}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                <TestTubeIcon className="h-4 w-4 mr-2" />
                Test Connection
              </button>
            </div>
          )}
        </div>

        {/* TikTok */}
        <div className="space-y-4 border-b pb-6 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">TikTok</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.platforms.tiktok.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    tiktok: { ...settings.platforms.tiktok, enabled: e.target.checked }
                  }
                })}
                className="mr-2"
              />
              Enable
            </label>
          </div>
          
          {settings.platforms.tiktok.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="Access Token"
                value={settings.platforms.tiktok.accessToken || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    tiktok: { ...settings.platforms.tiktok, accessToken: e.target.value }
                  }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => testConnection('tiktok')}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                <TestTubeIcon className="h-4 w-4 mr-2" />
                Test Connection
              </button>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">Meta (Facebook/Instagram)</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.platforms.meta.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    meta: { ...settings.platforms.meta, enabled: e.target.checked }
                  }
                })}
                className="mr-2"
              />
              Enable
            </label>
          </div>
          
          {settings.platforms.meta.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="Access Token"
                value={settings.platforms.meta.accessToken || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    meta: { ...settings.platforms.meta, accessToken: e.target.value }
                  }
                })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Page ID"
                value={settings.platforms.meta.pageId || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  platforms: {
                    ...settings.platforms,
                    meta: { ...settings.platforms.meta, pageId: e.target.value }
                  }
                })}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={() => testConnection('meta')}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                <TestTubeIcon className="h-4 w-4 mr-2" />
                Test Connection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Processing Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Processing Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Output Format
            </label>
            <select
              value={settings.processing.outputFormat}
              onChange={(e) => setSettings({
                ...settings,
                processing: { ...settings.processing, outputFormat: e.target.value }
              })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="webm">WebM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality
            </label>
            <select
              value={settings.processing.quality}
              onChange={(e) => setSettings({
                ...settings,
                processing: { ...settings.processing, quality: e.target.value }
              })}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Duration (seconds)
            </label>
            <input
              type="number"
              value={settings.processing.maxDuration}
              onChange={(e) => setSettings({
                ...settings,
                processing: { ...settings.processing, maxDuration: parseInt(e.target.value) }
              })}
              className="border rounded px-3 py-2 w-full"
              min="15"
              max="300"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded text-white font-medium ${
            saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          } ${loading ? 'opacity-50' : ''}`}
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}