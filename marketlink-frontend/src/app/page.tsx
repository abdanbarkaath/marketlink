"use client";

import { useRouter } from "next/navigation";
import RadiusSlider from "@/components/RadiusSlider";
import { FormEvent } from "react";

export default function Home() {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const q = String(data.get("q") || "").trim();
    const radius = String(data.get("radius") || "25");
    const service = String(data.get("service") || "");
    const rating = String(data.get("minRating") || "");
    const verified = data.get("verifiedOnly") ? "1" : "";

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (radius) params.set("radius", radius);
    if (service) params.set("service", service);
    if (rating) params.set("minRating", rating);
    if (verified) params.set("verified", verified);

    router.push(`/providers?${params.toString()}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Find local marketing experts</h1>
      <p className="mt-2 text-gray-600">
        Search by city or ZIP. Adjust radius. Filter by service, rating, and verification.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <input
          name="q"
          placeholder="Enter city or ZIP (e.g., Chicago or 60601)"
          className="w-full rounded-xl border px-4 py-3"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm mb-1">Service</label>
            <select name="service" className="w-full rounded-xl border px-3 py-2">
              <option value="">Any</option>
              <option value="seo">SEO</option>
              <option value="ads">Ads</option>
              <option value="social">Social</option>
              <option value="video">Video</option>
              <option value="print">Print</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Min Rating</label>
            <select name="minRating" className="w-full rounded-xl border px-3 py-2">
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="verifiedOnly" className="h-4 w-4" />
              Verified only
            </label>
          </div>
        </div>

        <RadiusSlider defaultValue={25} />

        <button type="submit" className="rounded-xl border px-4 py-3 font-medium hover:bg-gray-50">
          Search providers
        </button>
      </form>
    </main>
  );
}
