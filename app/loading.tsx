export default function Loading() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Skeleton */}
      <div className="w-[280px] border-r border-gray-200 p-4 hidden md:flex flex-col space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-lg w-full animate-pulse" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 bg-gradient-to-b from-blue-400 to-blue-600 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 bg-white/20 rounded w-48 animate-pulse" />
            <div className="h-10 bg-white/20 rounded w-10 animate-pulse" />
          </div>

          {/* Task Cards */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 h-24 animate-pulse opacity-90" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
