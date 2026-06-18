type ConversationEvent = {
  type: string;
  conversationId: string;
  [key: string]: unknown;
};

type ConversationSubscriber = {
  send: (event: ConversationEvent) => void;
};

const subscriptions = new Map<string, Set<ConversationSubscriber>>();

export function subscribeConversation(conversationId: string, subscriber: ConversationSubscriber) {
  const current = subscriptions.get(conversationId) ?? new Set<ConversationSubscriber>();
  current.add(subscriber);
  subscriptions.set(conversationId, current);

  return () => {
    const active = subscriptions.get(conversationId);
    if (!active) return;
    active.delete(subscriber);
    if (active.size === 0) subscriptions.delete(conversationId);
  };
}

export function publishConversationEvent(conversationId: string, event: ConversationEvent) {
  const active = subscriptions.get(conversationId);
  if (!active) return;

  for (const subscriber of active) {
    try {
      subscriber.send(event);
    } catch {
      active.delete(subscriber);
    }
  }

  if (active.size === 0) subscriptions.delete(conversationId);
}
