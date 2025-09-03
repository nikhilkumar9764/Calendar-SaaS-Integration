export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Connected Calendars</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">This Week</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">0h</p>
          </div>
        </div>
      </div>
    </div>
  )
}