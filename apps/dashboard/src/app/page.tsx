export default function Home() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Content Engine Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Manage your diving content and schedule posts to social media platforms
          </p>
          <div className="space-y-4">
            <a
              href="/clips"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Clips
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}