"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_PROVIDERS, Provider } from "@/lib/mockProviders";
import ProviderCard from "@/components/ProviderCard";

function matchesFilters(p: Provider, params: URLSearchParams) {
  const q = (params.get("q") || "").toLowerCase();
  const service = params.get("service") || "";
  const minRating = parseFloat(params.get("minRating") || "0");
  const verified = params.get("verified") === "1";

  const inQuery =
    !q ||
    p.city.toLowerCase().includes(q) ||
    p.state.toLowerCase().includes(q) ||
    p.slug.includes(q);

  const hasService = !service || p.services.includes(service);
  const meetsRating = !minRating || (p.rating ?? 0) >= minRating;
  const meetsVerified = !verified || p.verified === true;

  return inQuery && hasService && meetsRating && meetsVerified;
}

export default function ProvidersPage() {
  const params = useSearchParams();

  const list = useMemo(() => {
    const filtered = MOCK_PROVIDERS.filter((p) => matchesFilters(p, params));
    // Distance is real in Pass B; for now it's a placeholder.
    return filtered;
  }, [params]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Providers</h1>
      <p className="mt-1 text-gray-600">
        Showing results for <span className="font-medium">{params.get("q") || "anywhere"}</span>
        {params.get("radius") ? ` within ${params.get("radius")} mi` : ""}
      </p>

      {list.length === 0 ? (
        <div className="mt-8 rounded-xl border p-6 text-gray-700">
          No providers found. Try expanding the radius (e.g., 50 mi) or clearing filters.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProviderCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
