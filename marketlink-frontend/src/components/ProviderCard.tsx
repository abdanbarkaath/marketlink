import { Provider } from "@/lib/mockProviders";
import Link from "next/link";

export default function ProviderCard({ p }: { p: Provider }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.logo ?? "https://placehold.co/80x80"}
          alt={p.businessName}
          className="h-14 w-14 rounded-xl object-cover"
        />

        <div>
          <Link
            href={`/providers/${p.slug}`}
            className="font-semibold hover:underline"
          >
            {p.businessName}
          </Link>
          <div className="text-sm text-gray-500">
            {p.city}, {p.state}
          </div>
        </div>

        <div className="ml-auto text-right">
          <div className="text-sm">
            {p.rating ? `${p.rating.toFixed(1)} ★` : "—"}
          </div>
          <div className="text-xs text-gray-500">
            {p.verified ? "Verified" : ""}
          </div>
          <div className="text-xs text-gray-500">
            {p.distance != null ? `${p.distance.toFixed(1)} mi` : "— mi"}
          </div>
        </div>
      </div>

      {p.tagline && <p className="mt-3 text-sm">{p.tagline}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {p.services.map((s) => (
          <span
            key={s}
            className="text-xs rounded-full border px-2 py-1"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
