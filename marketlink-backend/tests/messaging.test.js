require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const cookie = require('@fastify/cookie');
const websocket = require('@fastify/websocket');

const sessionModule = require('../src/lib/session');
const prismaModule = require('../src/lib/prisma');
const realtimeModule = require('../src/lib/chatRealtime');
const messagingRoutes = require('../src/routes/messaging').default;

function buildFastify() {
  const fastify = Fastify();
  return fastify
    .register(cookie, { secret: 'test-secret' })
    .then(() => fastify.register(websocket))
    .then(() => fastify.register(messagingRoutes))
    .then(() => fastify);
}

test('GET /conversations lists only the signed-in customer conversations', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalConversation = prismaModule.prisma.conversation;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_1',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.conversation = {
    findMany: async ({ where }) => {
      assert.equal(where.customerUserId, 'customer_user_1');
      return [
        {
          id: 'conversation_1',
          proposalId: 'proposal_1',
          requestId: 'request_1',
          customerUserId: 'customer_user_1',
          expertId: 'expert_1',
          lastMessageAt: new Date('2026-06-18T01:00:00.000Z'),
          updatedAt: new Date('2026-06-18T01:00:00.000Z'),
          request: {
            id: 'request_1',
            title: 'Need Google Ads help',
            marketingSubjectId: 'paid-ads',
          },
          proposal: {
            id: 'proposal_1',
            priceLabel: '$3k-$5k',
            timelineLabel: 'This month',
            status: 'ACCEPTED',
          },
          customerProfile: {
            name: 'Jamie Rivera',
            businessName: 'Westmont Dental',
          },
          expert: {
            id: 'expert_1',
            businessName: 'Windy City Growth',
            slug: 'windy-city-growth',
            logo: null,
          },
          messages: [
            {
              id: 'message_1',
              body: 'Happy to help.',
              senderUserId: 'provider_user_1',
              createdAt: new Date('2026-06-18T01:00:00.000Z'),
            },
          ],
        },
      ];
    },
  };

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/conversations',
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].id, 'conversation_1');
    assert.equal(body.data[0].request.title, 'Need Google Ads help');
    assert.equal(body.data[0].expert.businessName, 'Windy City Growth');
    assert.equal(body.data[0].latestMessage.id, 'message_1');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.conversation = originalConversation;
    await fastify.close();
  }
});

test('GET /conversations lists only the signed-in expert conversations', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalConversation = prismaModule.prisma.conversation;
  const originalExpert = prismaModule.prisma.expert;

  sessionModule.getUserFromRequest = async () => ({
    id: 'provider_user_1',
    email: 'provider@example.com',
    role: 'provider',
  });

  prismaModule.prisma.expert = {
    findFirst: async ({ where }) => {
      assert.equal(where.userId, 'provider_user_1');
      return { id: 'expert_1' };
    },
  };

  prismaModule.prisma.conversation = {
    findMany: async ({ where }) => {
      assert.equal(where.expertId, 'expert_1');
      return [];
    },
  };

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/conversations',
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.data, []);
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.conversation = originalConversation;
    prismaModule.prisma.expert = originalExpert;
    await fastify.close();
  }
});

test('GET /conversations/:id rejects non-participants', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalConversation = prismaModule.prisma.conversation;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_1',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.conversation = {
    findFirst: async ({ where }) => {
      assert.equal(where.id, 'conversation_missing');
      assert.equal(where.customerUserId, 'customer_user_1');
      return null;
    },
  };

  try {
    const response = await fastify.inject({
      method: 'GET',
      url: '/conversations/conversation_missing',
    });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error, 'Conversation not found');
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.conversation = originalConversation;
    await fastify.close();
  }
});

test('POST /conversations/:id/messages creates a message and broadcasts it to the live thread', async () => {
  const fastify = await buildFastify();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalConversation = prismaModule.prisma.conversation;
  const originalMessage = prismaModule.prisma.message;
  const originalPublishConversationEvent = realtimeModule.publishConversationEvent;
  let publishedEvent = null;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_1',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.conversation = {
    findFirst: async ({ where }) => {
      assert.equal(where.id, 'conversation_1');
      assert.equal(where.customerUserId, 'customer_user_1');
      return {
        id: 'conversation_1',
        proposalId: 'proposal_1',
        requestId: 'request_1',
        customerUserId: 'customer_user_1',
        expertId: 'expert_1',
      };
    },
    update: async ({ where, data }) => {
      assert.equal(where.id, 'conversation_1');
      assert.ok(data.lastMessageAt instanceof Date);
      return { id: 'conversation_1' };
    },
  };

  prismaModule.prisma.message = {
    create: async ({ data, select }) => {
      assert.equal(data.conversationId, 'conversation_1');
      assert.equal(data.senderUserId, 'customer_user_1');
      assert.equal(data.body, 'Can we start next week?');
      assert.deepEqual(select, {
        id: true,
        conversationId: true,
        senderUserId: true,
        body: true,
        createdAt: true,
      });
      return {
        id: 'message_1',
        conversationId: 'conversation_1',
        senderUserId: 'customer_user_1',
        body: 'Can we start next week?',
        createdAt: new Date('2026-06-18T02:00:00.000Z'),
      };
    },
  };

  realtimeModule.publishConversationEvent = (conversationId, event) => {
    publishedEvent = { conversationId, event };
  };

  try {
    const response = await fastify.inject({
      method: 'POST',
      url: '/conversations/conversation_1/messages',
      payload: {
        body: 'Can we start next week?',
      },
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.ok, true);
    assert.equal(body.message.id, 'message_1');
    assert.equal(body.message.body, 'Can we start next week?');
    assert.deepEqual(publishedEvent, {
      conversationId: 'conversation_1',
      event: {
        type: 'message.created',
        conversationId: 'conversation_1',
        message: body.message,
      },
    });
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.conversation = originalConversation;
    prismaModule.prisma.message = originalMessage;
    realtimeModule.publishConversationEvent = originalPublishConversationEvent;
    await fastify.close();
  }
});

test('GET /conversations/:id/live streams conversation events to signed-in participants', async () => {
  const fastify = await buildFastify();
  await fastify.ready();

  const originalGetUserFromRequest = sessionModule.getUserFromRequest;
  const originalConversation = prismaModule.prisma.conversation;

  sessionModule.getUserFromRequest = async () => ({
    id: 'customer_user_1',
    email: 'customer@example.com',
    role: 'customer',
  });

  prismaModule.prisma.conversation = {
    findFirst: async ({ where }) => {
      assert.equal(where.id, 'conversation_1');
      assert.equal(where.customerUserId, 'customer_user_1');
      return { id: 'conversation_1' };
    },
  };

  try {
    const messages = [];
    let socket;
    const streamedEvent = {
      type: 'message.created',
      conversationId: 'conversation_1',
      message: {
        id: 'message_2',
        conversationId: 'conversation_1',
        senderUserId: 'provider_user_1',
        body: 'Yes, that works for me.',
        createdAt: '2026-06-18T03:00:00.000Z',
      },
    };

    const received = new Promise((resolve) => {
      const handleMessage = (payload) => {
        messages.push(JSON.parse(payload.toString()));
        if (messages.length === 2) resolve(messages);
      };

      fastify
        .injectWS('/conversations/conversation_1/live', {}, { onInit: (socket) => socket.on('message', handleMessage) })
        .then((connectedSocket) => {
          socket = connectedSocket;
          realtimeModule.publishConversationEvent('conversation_1', streamedEvent);
        });
    });

    assert.deepEqual(await received, [
      { type: 'connected', conversationId: 'conversation_1' },
      streamedEvent,
    ]);

    socket.terminate();
  } finally {
    sessionModule.getUserFromRequest = originalGetUserFromRequest;
    prismaModule.prisma.conversation = originalConversation;
    await fastify.close();
  }
});
