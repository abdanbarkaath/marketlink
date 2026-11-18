'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMarketingSubjectById } from '@/lib/marketingTaxonomy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  proposalId: string;
  requestId: string;
  customerUserId: string;
  expertId: string;
  lastMessageAt?: string | null;
  customerLastReadAt?: string | null;
  expertLastReadAt?: string | null;
  updatedAt: string;
  hasUnread?: boolean;
  request: {
    id: string;
    title: string;
    marketingSubjectId?: string | null;
    customerProfile?: {
      name?: string | null;
      businessName?: string | null;
    } | null;
  };
  proposal?: {
    id: string;
    priceLabel?: string | null;
    timelineLabel?: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
  } | null;
  expert: {
    id: string;
    businessName: string;
    slug: string;
    logo?: string | null;
  };
  latestMessage?: {
    id: string;
    body: string;
    senderUserId: string;
    createdAt: string;
  } | null;
};

type ConversationDetail = ConversationSummary & {
  customerLastReadAt?: string | null;
  expertLastReadAt?: string | null;
  createdAt: string;
  messages: ConversationMessage[];
};

type ConversationDetailResponse = {
  ok?: boolean;
  conversation?: ConversationDetail;
  error?: string;
};

type SendMessageResponse = {
  ok?: boolean;
  message?: ConversationMessage;
  error?: string;
};

type MarkReadResponse = {
  ok?: boolean;
  conversationId?: string;
  readAt?: string;
  error?: string;
};

type LiveConversationEvent =
  | { type: 'connected'; conversationId: string }
  | {
      type: 'message.created';
      conversationId: string;
      message: ConversationMessage;
    };

function toWebSocketBase(apiBase: string) {
  if (apiBase.startsWith('https://')) return `wss://${apiBase.slice('https://'.length)}`;
  if (apiBase.startsWith('http://')) return `ws://${apiBase.slice('http://'.length)}`;
  return apiBase;
}

function sortConversations(conversations: ConversationSummary[]) {
  return [...conversations].sort((left, right) => {
    const leftUnread = Boolean(left.hasUnread);
    const rightUnread = Boolean(right.hasUnread);
    if (leftUnread !== rightUnread) return leftUnread ? -1 : 1;

    const leftTime = left.lastMessageAt || left.updatedAt;
    const rightTime = right.lastMessageAt || right.updatedAt;
    return new Date(rightTime).getTime() - new Date(leftTime).getTime();
  });
}

function resolveConversationId(
  conversations: ConversationSummary[],
  preferredConversationId?: string | null,
  preferredProposalId?: string | null,
  preferredRequestId?: string | null,
) {
  if (!conversations.length) return null;

  if (preferredConversationId) {
    const directMatch = conversations.find((conversation) => conversation.id === preferredConversationId);
    if (directMatch) return directMatch.id;
  }

  if (preferredProposalId) {
    const proposalMatch = conversations.find((conversation) => conversation.proposalId === preferredProposalId);
    if (proposalMatch) return proposalMatch.id;
  }

  if (preferredRequestId) {
    const requestMatch = conversations.find((conversation) => conversation.requestId === preferredRequestId);
    if (requestMatch) return requestMatch.id;
  }

  return conversations[0].id;
}

function formatListTimestamp(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return sameDay
    ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatThreadTimestamp(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildConversationHref(pathname: string, conversationId: string) {
  return `${pathname}?id=${encodeURIComponent(conversationId)}`;
}

function upsertMessage(messages: ConversationMessage[], nextMessage: ConversationMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex >= 0) {
    return messages.map((message) => (message.id === nextMessage.id ? nextMessage : message));
  }

  return [...messages, nextMessage].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

function updateConversationWithMessage(conversation: ConversationSummary, message: ConversationMessage): ConversationSummary {
  return {
    ...conversation,
    lastMessageAt: message.createdAt,
    latestMessage: {
      id: message.id,
      body: message.body,
      senderUserId: message.senderUserId,
      createdAt: message.createdAt,
    },
  };
}

function getReadAtField(mode: 'customer' | 'provider') {
  return mode === 'customer' ? 'customerLastReadAt' : 'expertLastReadAt';
}

function summarizeLiveStatus(status: 'connecting' | 'live' | 'offline') {
  if (status === 'live') return 'Live';
  if (status === 'connecting') return 'Connecting';
  return 'Offline';
}

function MessageBubble({
  message,
  isOwnMessage,
}: Readonly<{
  message: ConversationMessage;
  isOwnMessage: boolean;
}>) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isOwnMessage
            ? 'max-w-[85%] rounded-xl rounded-br-sm bg-[#192a48] px-4 py-3 text-sm leading-6 text-white'
            : 'max-w-[85%] rounded-xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800'
        }
      >
        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.body}</p>
        <div className={`mt-2 text-[11px] ${isOwnMessage ? 'text-[#d9e3f1]' : 'text-slate-600'}`}>{formatThreadTimestamp(message.createdAt)}</div>
      </div>
    </div>
  );
}

export default function ConversationWorkspace({
  initialConversations,
  currentUserId,
  preferredConversationId,
  preferredProposalId,
  preferredRequestId,
  mode = 'customer',
}: Readonly<{
  initialConversations: ConversationSummary[];
  currentUserId: string;
  preferredConversationId?: string | null;
  preferredProposalId?: string | null;
  preferredRequestId?: string | null;
  mode?: 'customer' | 'provider';
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const isCustomerMode = mode === 'customer';
  const [showInboxOnMobile, setShowInboxOnMobile] = useState(
    !preferredConversationId && !preferredProposalId && !preferredRequestId,
  );
  const [conversations, setConversations] = useState(() => sortConversations(initialConversations));
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() =>
    resolveConversationId(initialConversations, preferredConversationId, preferredProposalId, preferredRequestId),
  );
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(Boolean(initialConversations.length));
  const [threadError, setThreadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('offline');
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = useMemo(() => conversations.filter((conversation) => conversation.hasUnread).length, [conversations]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${conversationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });

      const payload = (await response.json().catch(() => ({}))) as MarkReadResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Failed to mark conversation read (${response.status})`);
      }

      const readAt = payload.readAt || new Date().toISOString();
      const readField = getReadAtField(mode);

      setConversations((current) =>
        sortConversations(
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  hasUnread: false,
                  [readField]: readAt,
                }
              : conversation,
          ),
        ),
      );
      setSelectedConversation((current) =>
        current && current.id === conversationId
          ? {
              ...current,
              hasUnread: false,
              [readField]: readAt,
            }
          : current,
      );
    } catch {
      // best effort; keep live thread responsive even if the read marker write fails
    }
  }, [mode]);

  useEffect(() => {
    setConversations(sortConversations(initialConversations));
  }, [initialConversations]);

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversationId(null);
      setSelectedConversation(null);
      setThreadLoading(false);
      setShowInboxOnMobile(true);
      return;
    }

    if (selectedConversationId && !conversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(
        resolveConversationId(conversations, preferredConversationId, preferredProposalId, preferredRequestId),
      );
    }
  }, [conversations, preferredConversationId, preferredProposalId, preferredRequestId, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      router.replace(pathname, { scroll: false });
      return;
    }

    router.replace(buildConversationHref(pathname, selectedConversationId), { scroll: false });
  }, [pathname, router, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
      setThreadLoading(false);
      setThreadError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setThreadLoading(true);
      setThreadError(null);

      try {
        const response = await fetch(`${API_BASE}/conversations/${selectedConversationId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const body = (await response.json().catch(() => ({}))) as ConversationDetailResponse;

        if (!response.ok || !body.conversation) {
          throw new Error(body.error || `Failed to load conversation (${response.status})`);
        }

        if (cancelled) return;

        setSelectedConversation(body.conversation);
        setConversations((current) =>
          sortConversations(
            current.map((conversation) =>
              conversation.id === body.conversation?.id
                ? {
                    ...conversation,
                    customerLastReadAt: body.conversation?.customerLastReadAt || conversation.customerLastReadAt,
                    expertLastReadAt: body.conversation?.expertLastReadAt || conversation.expertLastReadAt,
                    lastMessageAt:
                      body.conversation?.messages[body.conversation.messages.length - 1]?.createdAt ||
                      conversation.lastMessageAt,
                    latestMessage:
                      body.conversation?.messages[body.conversation.messages.length - 1] || conversation.latestMessage,
                    hasUnread: false,
                  }
                : conversation,
            ),
          ),
        );
      } catch (error) {
        if (cancelled) return;
        setThreadError(error instanceof Error ? error.message : 'Failed to load conversation');
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, markConversationRead, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setLiveStatus('offline');
      return;
    }

    const socket = new WebSocket(`${toWebSocketBase(API_BASE)}/conversations/${selectedConversationId}/live`);
    setLiveStatus('connecting');

    socket.onmessage = (event) => {
      const payload = JSON.parse(String(event.data || '{}')) as LiveConversationEvent;

      if (payload.type === 'connected') {
        setLiveStatus('live');
        return;
      }

      if (payload.type !== 'message.created') return;
      const isOwnMessage = payload.message.senderUserId === currentUserId;
      const isSelectedThread = payload.conversationId === selectedConversationId;

      setSelectedConversation((current) => {
        if (!current || current.id !== payload.conversationId) return current;
        return {
          ...current,
          lastMessageAt: payload.message.createdAt,
          latestMessage: {
            id: payload.message.id,
            body: payload.message.body,
            senderUserId: payload.message.senderUserId,
            createdAt: payload.message.createdAt,
          },
          messages: upsertMessage(current.messages, payload.message),
          hasUnread: false,
        };
      });

      setConversations((current) =>
        sortConversations(
          current.map((conversation) =>
            conversation.id === payload.conversationId
              ? {
                  ...updateConversationWithMessage(conversation, payload.message),
                  hasUnread: isOwnMessage ? false : !isSelectedThread,
                }
              : conversation,
          ),
        ),
      );

      if (!isOwnMessage && isSelectedThread) {
        void markConversationRead(payload.conversationId);
      }
    };

    socket.onerror = () => {
      setLiveStatus('offline');
    };

    socket.onclose = () => {
      setLiveStatus('offline');
    };

    return () => {
      socket.close();
    };
  }, [currentUserId, markConversationRead, selectedConversationId]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [selectedConversation?.messages.length, selectedConversationId, showInboxOnMobile]);

  const selectedSummary = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );
  const selectedSubject = getMarketingSubjectById(selectedSummary?.request.marketingSubjectId || '');
  const hasSelection = Boolean(selectedConversationId);
  const selectedCounterpartyName = selectedSummary
    ? isCustomerMode
      ? selectedSummary.expert.businessName
      : selectedSummary.request.customerProfile?.businessName?.trim() ||
        selectedSummary.request.customerProfile?.name?.trim() ||
        'Customer'
    : '';

  async function handleSendMessage() {
    if (!selectedConversationId || sendPending) return;

    const body = draft.trim();
    if (!body) return;

    setSendPending(true);
    setSendError(null);

    try {
      const response = await fetch(`${API_BASE}/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      });

      const payload = (await response.json().catch(() => ({}))) as SendMessageResponse;

      if (!response.ok || !payload.message) {
        throw new Error(payload.error || `Failed to send message (${response.status})`);
      }

      setDraft('');
      setSelectedConversation((current) => {
        if (!current || current.id !== selectedConversationId) return current;
        return {
          ...current,
          lastMessageAt: payload.message!.createdAt,
          latestMessage: {
            id: payload.message!.id,
            body: payload.message!.body,
            senderUserId: payload.message!.senderUserId,
            createdAt: payload.message!.createdAt,
          },
          messages: upsertMessage(current.messages, payload.message!),
          hasUnread: false,
        };
      });
      setConversations((current) =>
        sortConversations(
          current.map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...updateConversationWithMessage(conversation, payload.message!),
                  hasUnread: false,
                }
              : conversation,
          ),
        ),
      );
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSendPending(false);
    }
  }

  if (!conversations.length) {
    return (
      <section className="ml-card rounded-xl p-6">
        <h2 className="text-xl font-bold tracking-tight text-[#192a48]">No conversations yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {isCustomerMode
            ? 'When you accept a proposal, you can message the expert and see the request details here.'
            : 'When a customer accepts your proposal, you can message them and see the request details here.'}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href={isCustomerMode ? '/dashboard/customer/proposals' : '/dashboard/requests'}
            className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white"
          >
            {isCustomerMode ? 'Open proposal inbox' : 'Open matched requests'}
          </Link>
          {isCustomerMode ? (
            <Link
              href="/dashboard/customer/requests"
              className="ml-btn-secondary inline-flex items-center justify-center px-5 text-sm font-semibold"
            >
              Request history
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <aside className={`${showInboxOnMobile ? 'block' : 'hidden'} xl:block ml-card overflow-hidden rounded-xl p-4 sm:p-5`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <h2 className="text-lg font-bold text-[#192a48]">Conversations</h2>
          {unreadCount ? (
            <span className="inline-flex rounded-lg bg-[#edf3ff] px-2.5 py-1 text-xs font-semibold text-[#192a48]">
              {unreadCount} unread
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3">
          {conversations.map((conversation) => {
            const subject = getMarketingSubjectById(conversation.request.marketingSubjectId || '');
            const isSelected = conversation.id === selectedConversationId;

            return (
              <button
                key={conversation.id}
                type="button"
                aria-current={isSelected ? true : undefined}
                onClick={() => {
                  setSelectedConversationId(conversation.id);
                  setShowInboxOnMobile(false);
                }}
                className={
                  isSelected
                    ? 'w-full rounded-lg border border-[#2455b5] bg-[#edf3ff] p-3 text-left'
                    : 'w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-slate-300 hover:bg-slate-50'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#192a48]">
                      {isCustomerMode
                        ? conversation.expert.businessName
                        : conversation.request.customerProfile?.businessName?.trim() ||
                          conversation.request.customerProfile?.name?.trim() ||
                          'Customer'}
                    </div>
                    <div className="mt-1 truncate text-sm text-slate-600">{conversation.request.title}</div>
                  </div>
                  <div className="shrink-0 text-xs text-slate-600">
                    {formatListTimestamp(conversation.latestMessage?.createdAt || conversation.lastMessageAt || conversation.updatedAt)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {conversation.hasUnread ? (
                    <span className="inline-flex rounded-md bg-[#192a48] px-2.5 py-1 text-xs font-semibold text-white">
                      Unread
                    </span>
                  ) : null}
                  <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {subject?.label || 'Not sure yet'}
                  </span>
                  {conversation.proposal?.priceLabel ? (
                    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {conversation.proposal.priceLabel}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                  {conversation.latestMessage?.body || 'No messages yet.'}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <div className={`${showInboxOnMobile ? 'hidden' : 'block'} xl:block min-w-0`}>
        {!hasSelection ? null : threadLoading ? (
          <section className="ml-card rounded-xl p-6">
            <p role="status" className="text-sm text-slate-600">Loading conversation...</p>
          </section>
        ) : threadError || !selectedSummary || !selectedConversation ? (
          <section className="ml-card rounded-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <p role="alert" className="text-sm text-red-700">{threadError || 'Conversation not found.'}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedConversationId(conversations[0]?.id || null);
                  setShowInboxOnMobile(true);
                }}
                className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900"
              >
                Back to inbox
              </button>
            </div>
          </section>
        ) : (
          <section className="ml-card overflow-hidden rounded-xl">
            <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 xl:hidden">
                    <button
                      type="button"
                      onClick={() => setShowInboxOnMobile(true)}
                      className="ml-btn-secondary inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold"
                    >
                      Inbox
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {selectedSubject?.label || 'Not sure yet'}
                    </span>
                    <span
                      className={
                        liveStatus === 'live'
                          ? 'inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800'
                          : 'inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700'
                      }
                    >
                      {summarizeLiveStatus(liveStatus)}
                    </span>
                  </div>

                  <h2 className="mt-3 break-words text-xl font-bold tracking-tight text-[#192a48]">{selectedCounterpartyName}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{selectedSummary.request.title}</p>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                    {selectedSummary.proposal?.priceLabel ? <span>{selectedSummary.proposal.priceLabel}</span> : null}
                    {selectedSummary.proposal?.priceLabel && selectedSummary.proposal?.timelineLabel ? <span>•</span> : null}
                    {selectedSummary.proposal?.timelineLabel ? <span>{selectedSummary.proposal.timelineLabel}</span> : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={
                      isCustomerMode
                        ? `/dashboard/customer/requests/view?id=${encodeURIComponent(selectedSummary.request.id)}`
                        : `/dashboard/requests/view?id=${encodeURIComponent(selectedSummary.request.id)}`
                    }
                    className="ml-btn-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-900"
                  >
                    Open request
                  </Link>
                  {isCustomerMode ? (
                    <Link
                      href={`/experts/${selectedSummary.expert.slug}`}
                      className="ml-btn-secondary inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
                    >
                      Expert profile
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-[#f5f7fb]">
              <div ref={messageListRef} className="min-h-48 max-h-[50dvh] overflow-y-auto px-5 py-5 sm:min-h-72 sm:px-6">
                <div className="grid gap-4">
                  {selectedConversation.messages.length ? (
                    selectedConversation.messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.senderUserId === currentUserId}
                      />
                    ))
                  ) : (
                    <div className="max-w-lg rounded-lg border border-dashed border-slate-300 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                      Send a message to start the conversation.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200/80 bg-white px-5 py-4 sm:px-6">
                {sendError ? <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{sendError}</div> : null}

                <div className="flex flex-col gap-3">
                  <label htmlFor="conversation-message" className="text-sm font-semibold text-slate-900">
                    Message
                  </label>
                  <textarea
                    id="conversation-message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message"
                    className="ml-input min-h-24 w-full px-3 py-2 text-base leading-6 text-slate-900"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      {isCustomerMode
                        ? 'Messages stay private between you and the accepted provider.'
                        : 'Messages stay private between you and the customer for this accepted proposal.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sendPending || !draft.trim()}
                      className="ml-btn-primary inline-flex min-h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendPending ? 'Sending...' : 'Send message'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
