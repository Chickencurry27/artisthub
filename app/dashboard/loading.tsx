export default function Loading() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="w-8 h-8" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 h-64 bg-gray-200 animate-pulse rounded" />
          <div className="col-span-3 h-64 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
