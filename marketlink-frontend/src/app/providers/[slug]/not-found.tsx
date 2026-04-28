import Link from 'next/link';

export default function ProviderNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Expert not found</h1>
      <p className="mt-2 text-gray-600">We couldn&apos;t find that expert profile. It may have been removed or is awaiting verification.</p>
      <Link href="/experts" className="mt-6 inline-block rounded-xl border px-4 py-2 hover:bg-gray-50">
        Back to experts
      </Link>
    </main>
  );
}
