import { ClipsOverview } from '@/components/ClipsOverview'

export default function ClipsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clips Management</h1>
        <p className="mt-2 text-gray-600">
          Manage your video clips and select content for processing
        </p>
      </div>
      
      <ClipsOverview />
    </div>
  )
}