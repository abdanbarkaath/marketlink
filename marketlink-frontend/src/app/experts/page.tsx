import type { Metadata } from 'next';
import ExpertsDirectory from '@/components/ExpertsDirectory';
import { directoryFilters, type DirectoryPayload } from '@/lib/directory';
import { getBuyerProblemById, getServiceTokensForSubject, getServiceTokensForSubcategory } from '@/lib/marketingTaxonomy';

export const metadata: Metadata = { title: 'Find local marketing teams' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function ExpertsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params: Record<string, string> = {};
  for (const key of ['name', 'q', 'zip', 'radius', 'skills', 'subject', 'subcategory', 'service', 'problem', 'verified', 'expertType', 'match', 'sort', 'order', 'page', 'limit', 'minRating']) {
    if (typeof raw[key] === 'string' && raw[key].trim()) params[key] = raw[key];
  }
  const apiParams = new URLSearchParams();
  for (const key of ['name', 'q', 'zip', 'radius', 'verified', 'expertType', 'match', 'sort', 'order', 'page', 'limit', 'minRating']) {
    if (params[key]) apiParams.set(key, params[key]);
  }
  const chosen = directoryFilters.filter((service) => params.skills?.split(',').includes(service.id));
  const problem = getBuyerProblemById(params.problem);
  if (chosen.length) {
    apiParams.set('serviceGroups', JSON.stringify(chosen.map((item) => item.tokens)));
    apiParams.set('match', params.match === 'all' ? 'all' : 'any');
  } else {
    const derived = params.subcategory ? getServiceTokensForSubcategory(params.subject, params.subcategory)
      : params.subject ? getServiceTokensForSubject(params.subject) : problem?.suggestedServiceTokens || [];
    if (derived.length) { apiParams.set('service', derived.join(',')); apiParams.set('match', 'any'); }
    else if (params.service) apiParams.set('service', params.service);
  }
  let payload: DirectoryPayload = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } };
  let error: string | undefined;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/experts?${apiParams}`, { cache: 'no-store' });
    if (response.ok) payload = await response.json();
    else if (response.status === 400) error = 'Check your search. Use a valid five-digit ZIP and distance, and choose services again if needed.';
    else error = 'We couldn’t load marketing teams. Please try again.';
  } catch { error = 'We couldn’t connect to the directory. Please try again.'; }
  return <ExpertsDirectory key={JSON.stringify(params)} payload={payload} params={params} error={error} problemLabel={problem?.label} />;
}
