import Link from 'next/link';
import { redirect } from 'next/navigation';
import ConversationWorkspace, { type ConversationSummary } from '@/components/chat/ConversationWorkspace';
import { apiJSON } from '@/lib/serverApi';

type SummaryResponse = {
  user?: { id: string; email?: string; role?: 'provider' | 'customer' | 'admin' };
  expert?: { id: string; businessName?: string | null } | null;
  provider?: { id: string; businessName?: string | null } | null;
};

type ConversationsResponse = {
  ok?: boolean;
  data?: ConversationSummary[];
};

export default async function ProviderMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; proposalId?: string; requestId?: string }>;
}) {
  const { id, proposalId, requestId } = await searchParams;
  const summary = await apiJSON<SummaryResponse>('/me/summary').catch((error: Error) => {
    if (error.message === 'Not authenticated') {
      redirect('/login?returnTo=/dashboard/messages');
    }

    throw error;
  });

  if (summary.user?.role === 'admin') redirect('/dashboard/admin');
  if (summary.user?.role === 'customer') redirect('/dashboard/customer');
  if (!(summary.expert?.id || summary.provider?.id)) redirect('/dashboard/onboarding');

  const conversationsData = await apiJSON<ConversationsResponse>('/conversations').catch((error: Error) => {
    if (error.message === "You don't have an expert profile yet.") {
      redirect('/dashboard/onboarding');
    }

    throw error;
  });
  const conversations = conversationsData.data || [];

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="dashboard-page-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="dashboard-intro flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Messages</h1>
            <p className="dashboard-intro-copy mt-2 max-w-2xl text-sm leading-6">
              Follow up with customers who accepted your proposals.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/requests"
              className="ml-btn-secondary inline-flex min-h-11 shrink-0 items-center justify-center px-5 text-sm font-semibold"
            >
              Matched requests
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <ConversationWorkspace
            initialConversations={conversations}
            currentUserId={summary.user?.id || ''}
            preferredConversationId={id || null}
            preferredProposalId={proposalId || null}
            preferredRequestId={requestId || null}
            mode="provider"
          />
        </div>
      </div>
    </main>
  );
}
