export default function ProviderNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Provider not found</h1>
      <p className="mt-2 text-gray-600">
        We couldn’t find that provider. It may have been removed or is awaiting verification.
      </p>
      <a
        href="/providers"
        className="mt-6 inline-block rounded-xl border px-4 py-2 hover:bg-gray-50"
      >
        Back to listings
      </a>
    </main>
  );
}
