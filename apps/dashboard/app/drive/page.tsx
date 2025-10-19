import { DriveExplorer } from '@/components/DriveExplorer'

export default function DrivePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Google Drive Integration</h1>
        <p className="mt-2 text-gray-600">
          Browse, select, and process videos directly from your Google Drive
        </p>
      </div>
      
      <DriveExplorer />
    </div>
  )
}