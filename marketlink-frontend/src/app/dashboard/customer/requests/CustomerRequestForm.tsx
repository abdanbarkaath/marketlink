'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMarketingSubjectById,
  getServiceTokensForSubject,
  getServiceTokensForSubcategory,
  getSubcategoriesForSubject,
  marketingSubjects,
} from '@/lib/marketingTaxonomy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const budgetOptions = ['Under $1k', '$1k-$2k', '$2k-$5k', '$5k-$10k', '$10k+'] as const;
const timelineOptions = ['ASAP', 'This month', 'Next 30 days', 'Next quarter', 'Just researching'] as const;
const radiusOptions = [5, 10, 20, 50, 100] as const;

type CustomerRequestFormProps = {
  returnHref?: string;
};

type IntakeMode = 'specific' | 'unsure';

function getRequestServiceTokens(subjectId: string, subcategoryId: string) {
  if (!subjectId) return [];

  return subcategoryId
    ? getServiceTokensForSubcategory(subjectId, subcategoryId)
    : getMarketingSubjectById(subjectId)?.serviceTokens ?? getServiceTokensForSubject(subjectId);
}

function getPathCardClass(active: boolean) {
  return active
    ? 'rounded-[24px] border border-slate-900 bg-slate-900 px-5 py-5 text-left text-white shadow-[0_16px_34px_rgba(15,23,42,0.16)]'
    : 'rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 text-left text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-slate-50';
}

export default function CustomerRequestForm({ returnHref = '/dashboard/customer/requests' }: CustomerRequestFormProps) {
  const router = useRouter();
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('specific');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [zip, setZip] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(String(radiusOptions[1]));
  const [budgetLabel, setBudgetLabel] = useState('');
  const [timelineLabel, setTimelineLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClassName = 'ml-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900';

  const subject = subjectId ? getMarketingSubjectById(subjectId) : null;
  const subcategories = subjectId ? getSubcategoriesForSubject(subjectId) : [];
  const selectedSubcategory = subcategories.find((item) => item.id === subcategoryId) ?? null;
  const selectedServiceTokens = useMemo(() => getRequestServiceTokens(subjectId, subcategoryId), [subjectId, subcategoryId]);
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
      setError('Add a short title for the request.');
      return;
    }

    if (!cleanDescription) {
      setError('Add a few details so providers understand what you need.');
      return;
    }

    if (intakeMode === 'specific') {
      if (!subjectId) {
        setError('Choose a marketing area, or switch to the "I am not sure yet" card at the top of the form.');
        return;
      }

      if (!selectedServiceTokens.length) {
        setError('Choose a marketing area or a specific help type before continuing.');
        return;
      }
    } else {
      if (!/^\d{5}$/.test(cleanZip)) {
        setError('Enter a valid 5-digit ZIP code for the unsure path.');
        return;
      }

      if (!radiusMiles) {
        setError('Choose how far out to search.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload =
        intakeMode === 'specific'
          ? {
              title: cleanTitle,
              description: cleanDescription,
              marketingSubjectId: subjectId,
              subcategoryId: subcategoryId || undefined,
              serviceTokens: selectedServiceTokens,
              budgetLabel: budgetLabel || undefined,
              timelineLabel: timelineLabel || undefined,
            }
          : {
              title: cleanTitle,
              description: cleanDescription,
              zip: cleanZip,
              radiusMiles: Number(radiusMiles),
              budgetLabel: budgetLabel || undefined,
              timelineLabel: timelineLabel || undefined,
            };

      const response = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <form onSubmit={handleSubmit} className="grid gap-6">
      <section className="grid gap-3">
        <div>
          <div className="text-sm font-medium text-slate-700">How do you want to start?</div>
          <p className="mt-1 text-sm leading-6 text-slate-500">Pick the path that feels easiest right now. You do not need to overfill this form.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button type="button" onClick={() => setIntakeMode('specific')} className={getPathCardClass(intakeMode === 'specific')}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-current/70">Specific path</div>
            <div className="mt-2 text-xl font-semibold tracking-tight">I know the kind of help I need</div>
            <p className={`mt-2 text-sm leading-6 ${intakeMode === 'specific' ? 'text-white/78' : 'text-slate-600'}`}>
              Choose a marketing area first, then narrow it down only if you want.
            </p>
          </button>

          <button type="button" onClick={() => setIntakeMode('unsure')} className={getPathCardClass(intakeMode === 'unsure')}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-current/70">Unsure path</div>
            <div className="mt-2 text-xl font-semibold tracking-tight">I am not sure yet</div>
            <p className={`mt-2 text-sm leading-6 ${intakeMode === 'unsure' ? 'text-white/78' : 'text-slate-600'}`}>
              Start with the problem and where the business is located. We will keep it broad.
            </p>
          </button>
        </div>
      </section>

      <div className="grid gap-2">
        <label htmlFor="request-title" className="text-sm font-medium text-slate-700">
          Request title
        </label>
        <input
          id="request-title"
          className={fieldClassName}
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
          className={`${fieldClassName} min-h-36`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
        />
      </div>

      {intakeMode === 'specific' ? (
        <section className="grid gap-5 rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-5">
          <div>
            <div className="text-sm font-medium text-slate-800">Specific request setup</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">Start with the broader area. Specific help stays optional, and it unlocks only after the parent area is chosen.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="request-subject" className="text-sm font-medium text-slate-700">
                Marketing area
              </label>
              <select
                id="request-subject"
                className={fieldClassName}
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setSubcategoryId('');
                }}
              >
                <option value=""></option>
                {marketingSubjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-6 text-slate-500">{subject ? subject.shortDescription : 'Pick the closest area first. You can keep the request broad if that is enough.'}</p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="request-subcategory" className="text-sm font-medium text-slate-700">
                Specific help
              </label>
              <select
                id="request-subcategory"
                className={fieldClassName}
                value={subcategoryId}
                onChange={(event) => setSubcategoryId(event.target.value)}
                disabled={!subjectId}
              >
                <option value=""></option>
                {subcategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-6 text-slate-500">
                {selectedSubcategory ? selectedSubcategory.shortDescription : 'Optional. Use this only if you already know the exact type of help you want.'}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-5">
          <div>
            <div className="text-sm font-medium text-slate-800">Unsure request setup</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">If you do not know the category yet, keep the request broad and tell us where to start looking.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-[minmax(0,220px)_180px] md:items-end">
            <div className="grid gap-2">
              <label htmlFor="request-zip" className="text-sm font-medium text-slate-700">
                ZIP code
              </label>
              <input
                id="request-zip"
                inputMode="numeric"
                pattern="\d{5}"
                className={fieldClassName}
                value={zip}
                onChange={(event) => setZip(event.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
              />
              <p className={`text-xs leading-6 ${zip.length > 0 && cleanZip.length < 5 ? 'text-red-600' : 'text-slate-500'}`}>
                {zip.length > 0 && cleanZip.length < 5 ? 'Enter the full 5-digit ZIP code.' : 'Required for the unsure path so the request stays local.'}
              </p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="request-radius" className="text-sm font-medium text-slate-700">
                Search radius
              </label>
              <select id="request-radius" className={fieldClassName} value={radiusMiles} onChange={(event) => setRadiusMiles(event.target.value)}>
                {radiusOptions.map((option) => (
                  <option key={option} value={option}>
                    Within {option} miles
                  </option>
                ))}
              </select>
              <p className="text-xs leading-6 text-slate-500">We will treat this as the local search area for the request.</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <label htmlFor="request-budget" className="text-sm font-medium text-slate-700">
            Budget
          </label>
          <select
            id="request-budget"
            className={fieldClassName}
            value={budgetLabel}
            onChange={(event) => setBudgetLabel(event.target.value)}
          >
            <option value=""></option>
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
            className={fieldClassName}
            value={timelineLabel}
            onChange={(event) => setTimelineLabel(event.target.value)}
          >
            <option value=""></option>
            {timelineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.9))] px-5 py-5">
        <div className="text-sm font-semibold text-slate-900">{intakeMode === 'specific' ? 'This request will use these matching tags' : 'This request will stay broad for now'}</div>
        {intakeMode === 'specific' ? (
          subject ? (
            <div className="mt-3 grid gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-xl bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {subject.label}
                </span>
                {selectedSubcategory ? (
                  <span className="inline-flex rounded-xl bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {selectedSubcategory.label}
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-6 text-slate-500">
                {selectedSubcategory
                  ? 'MarketLink will use the selected area and help type to match this request behind the scenes.'
                  : 'This will stay broad inside the selected marketing area. Internal matching tags are applied behind the scenes.'}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-500">Choose a marketing area to generate the matching tags for this request.</p>
          )
        ) : (
          <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
            <p>We will save this as an open request without locking it into one marketing category yet.</p>
            <p>{cleanZip ? `Current local starting point: ZIP ${cleanZip} within ${radiusMiles} miles.` : 'Add a ZIP code and radius above to finish the unsure path.'}</p>
          </div>
        )}
      </section>

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
