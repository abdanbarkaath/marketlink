'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formatServiceTokenLabel,
  getMarketingSubjectById,
  getServiceTokensForSubject,
  getServiceTokensForSubcategory,
  getSubcategoriesForSubject,
  marketingSubjects,
} from '@/lib/marketingTaxonomy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const budgetOptions = ['Under $1k', '$1k-$2k', '$2k-$5k', '$5k-$10k', '$10k+'] as const;
const timelineOptions = ['ASAP', 'This month', 'Next 30 days', 'Next quarter', 'Just researching'] as const;

type CustomerRequestFormProps = {
  returnHref?: string;
};

function getRequestServiceTokens(subjectId: string, subcategoryId: string) {
  return subcategoryId ? getServiceTokensForSubcategory(subjectId, subcategoryId) : getServiceTokensForSubject(subjectId);
}

export default function CustomerRequestForm({ returnHref = '/dashboard/customer/requests' }: CustomerRequestFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(marketingSubjects[0]?.id ?? '');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [zip, setZip] = useState('');
  const [budgetLabel, setBudgetLabel] = useState('');
  const [timelineLabel, setTimelineLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subject = getMarketingSubjectById(subjectId);
  const subcategories = getSubcategoriesForSubject(subjectId);
  const selectedServiceTokens = useMemo(() => getRequestServiceTokens(subjectId, subcategoryId), [subjectId, subcategoryId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanZip = zip.trim();

    if (!cleanTitle) {
      setError('Title is required.');
      return;
    }

    if (!cleanDescription) {
      setError('Description is required.');
      return;
    }

    if (!subjectId) {
      setError('Marketing area is required.');
      return;
    }

    if (!/^\d{5}$/.test(cleanZip)) {
      setError('ZIP must be 5 digits.');
      return;
    }

    if (!selectedServiceTokens.length) {
      setError('Choose a marketing area or specific help option.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDescription,
          marketingSubjectId: subjectId,
          serviceTokens: selectedServiceTokens,
          zip: cleanZip,
          budgetLabel: budgetLabel || undefined,
          timelineLabel: timelineLabel || undefined,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string; request?: { id?: string } };
      if (!response.ok || !body.request?.id) {
        throw new Error(body.error || `Failed to create request (${response.status})`);
      }

      router.push(`/dashboard/customer/requests/view?id=${encodeURIComponent(body.request.id)}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="request-title" className="text-sm font-medium text-slate-700">
          Request title
        </label>
        <input
          id="request-title"
          className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={140}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="request-description" className="text-sm font-medium text-slate-700">
          What do you need help with?
        </label>
        <textarea
          id="request-description"
          className="ml-input min-h-36 w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="request-subject" className="text-sm font-medium text-slate-700">
            Marketing area
          </label>
          <select
            id="request-subject"
            className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setSubcategoryId('');
            }}
          >
            {marketingSubjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {subject ? <p className="text-xs text-slate-500">{subject.shortDescription}</p> : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="request-subcategory" className="text-sm font-medium text-slate-700">
            Specific help
          </label>
          <select
            id="request-subcategory"
            className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
            value={subcategoryId}
            onChange={(event) => setSubcategoryId(event.target.value)}
          >
            <option value="">Keep it broad</option>
            {subcategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Optional. Choose this if you already know the exact kind of help you want.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <label htmlFor="request-zip" className="text-sm font-medium text-slate-700">
            ZIP
          </label>
          <input
            id="request-zip"
            inputMode="numeric"
            pattern="\d{5}"
            className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
            value={zip}
            onChange={(event) => setZip(event.target.value)}
            maxLength={5}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="request-budget" className="text-sm font-medium text-slate-700">
            Budget
          </label>
          <select
            id="request-budget"
            className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
            value={budgetLabel}
            onChange={(event) => setBudgetLabel(event.target.value)}
          >
            <option value="">Optional</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="request-timeline" className="text-sm font-medium text-slate-700">
            Timeline
          </label>
          <select
            id="request-timeline"
            className="ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900"
            value={timelineLabel}
            onChange={(event) => setTimelineLabel(event.target.value)}
          >
            <option value="">Optional</option>
            {timelineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="text-sm font-semibold text-slate-900">This request will be matched using</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedServiceTokens.map((token) => (
            <span
              key={token}
              className="inline-flex rounded-xl bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
            >
              {formatServiceTokenLabel(token)}
            </span>
          ))}
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={returnHref} className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900">
          Back
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Creating request...' : 'Create request'}
        </button>
      </div>
    </form>
  );
}
