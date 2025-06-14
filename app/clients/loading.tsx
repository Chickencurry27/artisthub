export default function Loading() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="w-8 h-8" />
        <div className="flex items-center justify-between w-full">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-9 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
