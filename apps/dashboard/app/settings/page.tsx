import { SettingsManager } from '@/components/SettingsManager'

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your content engine preferences
        </p>
      </div>
      
      <SettingsManager />
    </div>
  )
}