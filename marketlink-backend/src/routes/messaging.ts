import type { FastifyPluginAsync } from 'fastify';
import type { User } from '@prisma/client';
import type { WebSocket } from 'ws';
import { prisma } from '../lib/prisma';
import { publishConversationEvent, subscribeConversation } from '../lib/chatRealtime';
import { getUserFromRequest } from '../lib/session';

async function getExpertAccess(user: User) {
  const expert = await prisma.expert.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  return expert ? { expertId: expert.id } : null;
}

async function getConversationAccess(user: User) {
  if (user.role === 'customer') return { customerUserId: user.id };
  if (user.role === 'provider') return getExpertAccess(user);
  return null;
}

function asMessageBody(input: unknown) {
  return String(input || '').trim();
}

function serializeMessage(message: {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
}) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
  };
}

function getReadAtField(role: User['role']) {
  return role === 'customer' ? 'customerLastReadAt' : 'expertLastReadAt';
}

function hasUnreadState(
  user: Pick<User, 'id' | 'role'>,
  conversation: {
    customerLastReadAt?: Date | string | null;
    expertLastReadAt?: Date | string | null;
    latestMessage?: {
      id: string;
      body: string;
      senderUserId: string;
      createdAt: Date | string;
    } | null;
  },
) {
  const latestMessage = conversation.latestMessage;
  if (!latestMessage) return false;
  if (latestMessage.senderUserId === user.id) return false;

  const readAt = user.role === 'customer' ? conversation.customerLastReadAt : conversation.expertLastReadAt;
  if (!readAt) return true;

  return new Date(latestMessage.createdAt).getTime() > new Date(readAt).getTime();
}

function serializeConversationSummary(
  user: Pick<User, 'id' | 'role'>,
  conversation: {
    id: string;
    proposalId: string;
    requestId: string;
    customerUserId: string;
    expertId: string;
    lastMessageAt?: Date | null;
    updatedAt: Date;
    customerLastReadAt?: Date | null;
    expertLastReadAt?: Date | null;
    request: {
      id: string;
      title: string;
      marketingSubjectId: string;
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
      createdAt: Date;
    } | null;
  },
) {
  return {
    ...conversation,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    updatedAt: conversation.updatedAt.toISOString(),
    customerLastReadAt: conversation.customerLastReadAt?.toISOString() ?? null,
    expertLastReadAt: conversation.expertLastReadAt?.toISOString() ?? null,
    latestMessage: conversation.latestMessage ? serializeMessage({ ...conversation.latestMessage, conversationId: conversation.id }) : null,
    hasUnread: hasUnreadState(user, conversation),
  };
}

const messagingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/conversations', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer' && user.role !== 'provider') {
      return reply.code(403).send({ error: 'Only customers and providers can view conversations.' });
    }

    const access = await getConversationAccess(user);
    if (!access) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const rows = await prisma.conversation.findMany({
      where: access,
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        proposalId: true,
        requestId: true,
        customerUserId: true,
        expertId: true,
        lastMessageAt: true,
        customerLastReadAt: true,
        expertLastReadAt: true,
        updatedAt: true,
        request: {
          select: {
            id: true,
            title: true,
            marketingSubjectId: true,
            customerProfile: {
              select: {
                name: true,
                businessName: true,
              },
            },
          },
        },
        proposal: {
          select: {
            id: true,
            priceLabel: true,
            timelineLabel: true,
            status: true,
          },
        },
        expert: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logo: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            body: true,
            senderUserId: true,
            createdAt: true,
          },
        },
      },
    });

    const data = rows.map(({ messages, ...conversation }) =>
      serializeConversationSummary(user, {
        ...conversation,
        latestMessage: messages[0] ?? null,
      }),
    );

    return reply.send({ ok: true, data });
  });

  fastify.get('/conversations/:id', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer' && user.role !== 'provider') {
      return reply.code(403).send({ error: 'Only customers and providers can view conversations.' });
    }

    const access = await getConversationAccess(user);
    if (!access) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const { id } = (req.params || {}) as { id?: string };
    if (!id) return reply.code(400).send({ ok: false, error: 'Missing conversation id' });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        ...access,
      },
      select: {
        id: true,
        proposalId: true,
        requestId: true,
        customerUserId: true,
        expertId: true,
        lastMessageAt: true,
        customerLastReadAt: true,
        expertLastReadAt: true,
        createdAt: true,
        updatedAt: true,
        request: {
          select: {
            id: true,
            title: true,
            marketingSubjectId: true,
            customerProfile: {
              select: {
                name: true,
                businessName: true,
              },
            },
          },
        },
        proposal: {
          select: {
            id: true,
            priceLabel: true,
            timelineLabel: true,
            status: true,
          },
        },
        expert: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logo: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            conversationId: true,
            senderUserId: true,
            body: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) return reply.code(404).send({ error: 'Conversation not found' });
    const latestMessage = conversation.messages[conversation.messages.length - 1] ?? null;
    const readField = getReadAtField(user.role);
    let nextReadAt = conversation[readField];

    if (
      latestMessage &&
      latestMessage.senderUserId !== user.id &&
      (!nextReadAt || latestMessage.createdAt.getTime() > nextReadAt.getTime())
    ) {
      nextReadAt = new Date();
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          [readField]: nextReadAt,
        },
      });
    }

    return reply.send({
      ok: true,
      conversation: {
        ...serializeConversationSummary(user, {
          ...conversation,
          latestMessage,
          [readField]: nextReadAt ?? null,
        }),
        createdAt: conversation.createdAt.toISOString(),
        messages: conversation.messages.map(serializeMessage),
        hasUnread: false,
      },
    });
  });

  fastify.post('/conversations/:id/messages', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer' && user.role !== 'provider') {
      return reply.code(403).send({ error: 'Only customers and providers can send messages.' });
    }

    const access = await getConversationAccess(user);
    if (!access) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const { id } = (req.params || {}) as { id?: string };
    const body = req.body as { body?: string } | undefined;
    const messageBody = asMessageBody(body?.body);

    if (!id) return reply.code(400).send({ ok: false, error: 'Missing conversation id' });
    if (!messageBody) return reply.code(400).send({ ok: false, error: 'body is required' });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        ...access,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) return reply.code(404).send({ error: 'Conversation not found' });

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId: user.id,
        body: messageBody,
      },
      select: {
        id: true,
        conversationId: true,
        senderUserId: true,
        body: true,
        createdAt: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        [getReadAtField(user.role)]: message.createdAt,
      },
    });

    const responseMessage = serializeMessage(message);

    const event = {
      type: 'message.created',
      conversationId: conversation.id,
      message: responseMessage,
    };

    publishConversationEvent(conversation.id, event);
    return reply.code(201).send({ ok: true, message: responseMessage });
  });

  fastify.post('/conversations/:id/read', async (req, reply) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    if (user.role !== 'customer' && user.role !== 'provider') {
      return reply.code(403).send({ error: 'Only customers and providers can update conversation read state.' });
    }

    const access = await getConversationAccess(user);
    if (!access) return reply.code(404).send({ error: "You don't have an expert profile yet." });

    const { id } = (req.params || {}) as { id?: string };
    if (!id) return reply.code(400).send({ ok: false, error: 'Missing conversation id' });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        ...access,
      },
      select: { id: true },
    });

    if (!conversation) return reply.code(404).send({ error: 'Conversation not found' });

    const readAt = new Date();
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        [getReadAtField(user.role)]: readAt,
      },
    });

    return reply.send({
      ok: true,
      conversationId: conversation.id,
      readAt: readAt.toISOString(),
    });
  });

  fastify.get('/conversations/:id/live', { websocket: true }, async (socket: WebSocket, req) => {
    const user = await getUserFromRequest(fastify, req);
    if (!user || (user.role !== 'customer' && user.role !== 'provider')) {
      socket.close(4401, 'Not authenticated');
      return;
    }

    const access = await getConversationAccess(user);
    if (!access) {
      socket.close(4403, 'Forbidden');
      return;
    }

    const { id } = (req.params || {}) as { id?: string };
    if (!id) {
      socket.close(4400, 'Missing conversation id');
      return;
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        ...access,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      socket.close(4404, 'Conversation not found');
      return;
    }

    const unsubscribe = subscribeConversation(conversation.id, {
      send(event) {
        socket.send(JSON.stringify(event));
      },
    });

    socket.send(JSON.stringify({ type: 'connected', conversationId: conversation.id }));
    socket.on('close', unsubscribe);
    socket.on('error', unsubscribe);
  });
};

export default messagingRoutes;
