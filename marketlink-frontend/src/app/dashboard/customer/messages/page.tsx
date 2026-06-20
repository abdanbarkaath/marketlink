import Link from 'next/link';
import { redirect } from 'next/navigation';
import ConversationWorkspace, { type ConversationSummary } from '@/components/chat/ConversationWorkspace';
import { apiJSON } from '@/lib/serverApi';

type SummaryResponse = {
  user?: { id: string; email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

type ConversationsResponse = {
  ok?: boolean;
  data?: ConversationSummary[];
};

export default async function CustomerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; proposalId?: string; requestId?: string }>;
}) {
  const { id, proposalId, requestId } = await searchParams;
  const summary = await apiJSON<SummaryResponse>('/me/summary').catch((error: Error) => {
    if (error.message === 'Not authenticated') {
      redirect('/login?returnTo=/dashboard/customer/messages');
    }

    throw error;
  });

  if (summary.user?.role === 'admin') redirect('/dashboard/admin');
  if (summary.user?.role === 'provider') redirect('/dashboard');
  if (!(summary.customer?.name || '').trim()) redirect('/dashboard/customer/onboarding');

  const conversationsData = await apiJSON<ConversationsResponse>('/conversations');
  const conversations = conversationsData.data || [];

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customer messages</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Private chat inbox</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Accepted proposals turn into private conversations here. Keep the request context visible, reply in real time, and move the work forward without leaving your dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/customer/proposals"
              className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900"
            >
              Proposal inbox
            </Link>
            <Link
              href="/dashboard/customer"
              className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <section className="ml-card mt-5 rounded-[28px] p-5 shadow-[0_18px_50px_rgba(23,26,31,0.06)] sm:p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Conversations</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{conversations.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Flow</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">Accepted proposal only</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Realtime</div>
              <div className="mt-2 text-sm font-semibold text-slate-950">Live replies without refresh</div>
            </div>
          </div>
        </section>

        <div className="mt-5">
          <ConversationWorkspace
            initialConversations={conversations}
            currentUserId={summary.user?.id || ''}
            preferredConversationId={id || null}
            preferredProposalId={proposalId || null}
            preferredRequestId={requestId || null}
          />
        </div>
      </div>
    </main>
  );
}
