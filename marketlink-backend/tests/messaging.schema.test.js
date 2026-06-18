const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function readSchema() {
  return fs.readFileSync(schemaPath, 'utf8');
}

test('messaging schema models accepted-proposal conversations and message history', () => {
  const schema = readSchema();

  assert.match(schema, /model Conversation \{/);
  assert.match(schema, /proposalId\s+String\s+@unique/);
  assert.match(schema, /requestId\s+String/);
  assert.match(schema, /customerUserId\s+String/);
  assert.match(schema, /expertId\s+String/);
  assert.match(schema, /customerLastReadAt\s+DateTime\?/);
  assert.match(schema, /expertLastReadAt\s+DateTime\?/);
  assert.match(schema, /messages\s+Message\[\]/);
  assert.match(schema, /@@index\(\[customerUserId, updatedAt\]\)/);
  assert.match(schema, /@@index\(\[expertId, updatedAt\]\)/);

  assert.match(schema, /model Message \{/);
  assert.match(schema, /conversationId\s+String/);
  assert.match(schema, /senderUserId\s+String/);
  assert.match(schema, /body\s+String/);
  assert.match(schema, /@@index\(\[conversationId, createdAt\]\)/);
  assert.match(schema, /@@index\(\[senderUserId, createdAt\]\)/);
});
