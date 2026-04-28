import { redirect } from 'next/navigation';

type ProvidersRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProvidersRedirectPage({ searchParams }: ProvidersRedirectPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams();

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .forEach((item) => query.append(key, item));
      return;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      query.set(key, value);
    }
  });

  redirect(query.size > 0 ? `/experts?${query.toString()}` : '/experts');
}
