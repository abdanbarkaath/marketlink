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

    const data = rows.map(({ messages, ...conversation }) => ({
      ...conversation,
      latestMessage: messages[0] ?? null,
    }));

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
    return reply.send({ ok: true, conversation });
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
