import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SummaryResponse = {
  user?: { email?: string; role?: 'provider' | 'customer' | 'admin' };
  customer?: { name?: string | null; businessName?: string | null } | null;
};

type CustomerRequestSummary = {
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
};

type CustomerProposalSummary = {
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
};

type CustomerConversationSummary = {
  id: string;
};

function DashboardRailCard({
  eyebrow,
  title,
  body,
}: Readonly<{ eyebrow: string; title: string; body: string }>) {
  return (
    <div className="ml-surface-muted rounded-2xl p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function FutureStateCard({
  title,
  body,
  href,
  eyebrow = 'Reserved',
}: Readonly<{ title: string; body: string; href?: string; eyebrow?: string }>) {
  const content = (
    <>
      <span className="ml-pill inline-flex rounded-xl px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      {href ? <span className="mt-4 inline-flex text-sm font-semibold text-slate-900">Open</span> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="ml-card rounded-[24px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(23,26,31,0.08)]">
        {content}
      </Link>
    );
  }

  return (
    <div className="ml-card rounded-[24px] p-5 shadow-[0_18px_44px_rgba(23,26,31,0.05)]">
      {content}
    </div>
  );
}

export default async function CustomerDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  const cookieHeader = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '';

  const res = await fetch(`${API_BASE}/me/summary`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });

  if (res.status === 401) {
    redirect('/login?returnTo=/dashboard/customer');
  }

  if (!res.ok) {
    throw new Error(`Failed to load customer account gate (${res.status})`);
  }

  const data = (await res.json()) as SummaryResponse;

  if (data.user?.role === 'admin') {
    redirect('/dashboard/admin');
  }

  if (data.user?.role === 'provider') {
    redirect('/dashboard');
  }

  const name = (data.customer?.name || '').trim();
  const businessName = (data.customer?.businessName || '').trim();
  const email = (data.user?.email || '').trim();

  if (!name) {
    redirect('/dashboard/customer/onboarding');
  }

  const [requestsRes, proposalsRes, conversationsRes] = await Promise.all([
    fetch(`${API_BASE}/requests`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: 'no-store',
    }),
    fetch(`${API_BASE}/proposals`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: 'no-store',
    }),
    fetch(`${API_BASE}/conversations`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: 'no-store',
    }),
  ]);

  const requestsData = requestsRes.ok ? ((await requestsRes.json()) as { data?: CustomerRequestSummary[] }) : {};
  const proposalsData = proposalsRes.ok ? ((await proposalsRes.json()) as { data?: CustomerProposalSummary[] }) : {};
  const conversationsData = conversationsRes.ok ? ((await conversationsRes.json()) as { data?: CustomerConversationSummary[] }) : {};
  const requests = requestsData.data || [];
  const proposals = proposalsData.data || [];
  const conversations = conversationsData.data || [];
  const activeRequestCount = requests.filter((request) => request.status === 'ACTIVE').length;
  const pendingProposalCount = proposals.filter((proposal) => proposal.status === 'PENDING').length;
  const conversationCount = conversations.length;

  return (
    <main className="ml-page-bg min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_320px]">
          <section className="ml-card overflow-hidden rounded-[28px] p-5 shadow-[0_18px_50px_rgba(23,26,31,0.06)] sm:p-6">
            <div className="h-1.5 bg-[linear-gradient(90deg,#0f172a,#25324a,#b6bdc8)] -mx-5 -mt-5 mb-5 sm:-mx-6 sm:-mt-6 sm:mb-6" />
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Customer dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Good to see you, {name}.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  This is your lightweight home base. Keep the basics current, browse experts, track requests, and review provider proposals from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="ml-pill inline-flex rounded-xl px-4 py-2 text-sm font-medium normal-case tracking-normal text-slate-700">{email}</span>
                <span className="ml-pill inline-flex rounded-xl px-4 py-2 text-sm font-medium normal-case tracking-normal text-slate-700">
                  {businessName || 'No business name added yet'}
                </span>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-4 sm:flex-row sm:flex-wrap">
                <Link
                  href="/dashboard/customer/profile"
                  className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white"
                >
                  Edit profile
                </Link>
                <Link
                  href="/dashboard/customer/requests/new"
                  className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900"
                >
                  Create request
                </Link>
                <Link
                  href="/experts"
                  className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900"
                >
                  Browse experts
                </Link>
              </div>
            </div>
          </section>

          <aside className="ml-card rounded-[28px] p-5 shadow-[0_18px_50px_rgba(23,26,31,0.06)] sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Account snapshot</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Name</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{name}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Business</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{businessName || 'Optional for now'}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <DashboardRailCard
                eyebrow="Right now"
                title="Keep it simple"
                body="The customer side stays intentionally light until you actually need to request help or start a conversation."
              />
              <DashboardRailCard
                eyebrow="Next"
                title="Messages now stay in flow"
                body="Accepted proposals open into private chat, so your dashboard, proposals, and messages all stay connected."
              />
            </div>
          </aside>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <FutureStateCard
            title="Requests"
            body={
              activeRequestCount
                ? `${activeRequestCount} active request${activeRequestCount === 1 ? '' : 's'}. Open history to review status and incoming proposals.`
                : 'Create requests privately, revisit your history, and review the matching preview from one place.'
            }
            href="/dashboard/customer/requests"
            eyebrow={activeRequestCount ? `${activeRequestCount} active` : 'Live'}
          />
          <FutureStateCard
            title="Proposals"
            body={
              pendingProposalCount
                ? `${pendingProposalCount} proposal${pendingProposalCount === 1 ? '' : 's'} waiting for your decision.`
                : 'Compare provider responses, review estimates, and accept or decline proposals.'
            }
            href="/dashboard/customer/proposals"
            eyebrow={pendingProposalCount ? `${pendingProposalCount} needs action` : 'Live'}
          />
          <FutureStateCard
            title="Messages"
            body={
              conversationCount
                ? `${conversationCount} private conversation${conversationCount === 1 ? '' : 's'} ready for follow-up.`
                : 'Accepted proposals open a private live chat here so you can keep each request and provider thread organized.'
            }
            href="/dashboard/customer/messages"
            eyebrow={conversationCount ? `${conversationCount} live` : 'Live'}
          />
        </section>
      </div>
    </main>
  );
}
