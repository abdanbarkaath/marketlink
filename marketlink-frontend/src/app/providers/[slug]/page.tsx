import { redirect } from 'next/navigation';

type ProviderDetailRedirectPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProviderDetailRedirectPage({ params }: ProviderDetailRedirectPageProps) {
  const resolvedParams = await params;
  redirect(`/experts/${resolvedParams.slug}`);
}
