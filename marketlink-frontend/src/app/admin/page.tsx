import React from 'react';
import { apiJSON } from '../../lib/serverApi';

type StatsResponse = {
  ok: true;
  providers: {
    total: number;
    active: number;
    pending: number;
    disabled: number;
    verified: number;
  };
};

export default async function AdminOverviewPage() {
  const data = await apiJSON<StatsResponse>('/admin/stats');
  const { total, active, pending, disabled, verified } = data.providers;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card label="Total" value={total} />
        <Card label="Active" value={active} />
        <Card label="Pending" value={pending} />
        <Card label="Disabled" value={disabled} />
        <Card label="Verified" value={verified} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
