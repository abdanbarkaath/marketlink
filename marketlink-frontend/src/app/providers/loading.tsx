export default function LoadingProviders() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="h-6 w-40 rounded bg-gray-100" />
      <div className="mt-1 h-4 w-64 rounded bg-gray-100" />

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-gray-100" />
              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
              </div>
              <div className="text-right">
                <div className="h-3 w-10 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-14 rounded bg-gray-100" />
              </div>
            </div>
            <div className="mt-3 h-3 w-3/4 rounded bg-gray-100" />
            <div className="mt-3 flex gap-2">
              <div className="h-6 w-14 rounded-full border bg-gray-50" />
              <div className="h-6 w-16 rounded-full border bg-gray-50" />
              <div className="h-6 w-12 rounded-full border bg-gray-50" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
