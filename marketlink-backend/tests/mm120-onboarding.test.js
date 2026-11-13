require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const { prisma } = require('../src/lib/prisma');
const geocoding = require('../src/lib/geocoding');
const session = require('../src/lib/session');
const routes = require('../src/routes/providers').default;

function replaceMethod(t, target, name, replacement) {
  const original = target[name];
  target[name] = replacement;
  t.after(() => { target[name] = original; });
}

const agency = {
  id: 'agency', slug: 'agency', businessName: 'Agency', expertType: 'agency',
  city: 'Chicago', state: 'IL', zip: '60601', streetAddress: '123 Example Street',
  latitude: 0.4, longitude: 0, publicCityLatitude: 0.01, publicCityLongitude: 0,
  locationPrecision: 'approximate', services: ['seo', 'legacy-service'],
};

test('both public aliases expose the city point and use it to compute distance', async (t) => {
  const app = Fastify();
  t.after(() => app.close());
  await app.register(routes);
  t.mock.method(geocoding, 'geocodeSearchCenter', async () => ({ ok: true, latitude: 0, longitude: 0 }));
  replaceMethod(t, prisma.expert, 'findFirst', async ({ select }) => {
    assert.equal(select.email, undefined);
    assert.equal(select.disabledReason, undefined);
    return agency;
  });
  replaceMethod(t, prisma.expert, 'findMany', async () => [agency, { ...agency, id: 'private', locationPrecision: 'private' }]);
  for (const alias of ['/experts', '/providers']) {
    const detail = await app.inject(alias + '/agency');
    assert.equal(detail.statusCode, 200, detail.body);
    assert.equal(detail.json().streetAddress, null);
    assert.equal(detail.json().zip, null);
    assert.equal(detail.json().latitude, 0.01);
    assert.equal(detail.json().publicCityLatitude, undefined);
    const list = await app.inject(alias + '?zip=60601&radius=5');
    assert.equal(list.statusCode, 200, list.body);
    assert.deepEqual(list.json().data.map(({ id, distanceMiles }) => [id, distanceMiles]), [['agency', 0.7]]);
  }
});

test('private and exact detail projections follow the selected visibility', async (t) => {
  const app = Fastify();
  t.after(() => app.close());
  await app.register(routes);
  replaceMethod(t, prisma.expert, 'findFirst', async ({ where }) => ({ ...agency, locationPrecision: where.slug }));
  const privateDetail = (await app.inject('/experts/private')).json();
  assert.deepEqual([privateDetail.city, privateDetail.state, privateDetail.zip, privateDetail.latitude], ['', '', null, null]);
  const exactDetail = (await app.inject('/experts/exact')).json();
  assert.equal(exactDetail.streetAddress, agency.streetAddress);
  assert.equal(exactDetail.latitude, agency.latitude);
});

test('profile updates require confirmation and write it in the same transaction as published work', async (t) => {
  const app = Fastify();
  t.after(() => app.close());
  await app.register(routes);
  t.mock.method(session, 'getUserFromRequest', async () => ({ id: 'owner', role: 'provider' }));
  replaceMethod(t, prisma.expert, 'findFirst', async () => agency);
  const writes = [];
  replaceMethod(t, prisma, '$transaction', async (run) => run({
    expert: { update: async (args) => writes.push(args), findUniqueOrThrow: async () => agency },
    expertClient: { deleteMany: async () => {}, createMany: async (args) => writes.push(args) },
    expertPublicationConfirmation: { create: async (args) => writes.push(args) },
  }));
  const edit = (payload) => app.inject({ method: 'PUT', url: '/experts', payload });
  const rejected = await edit({ clients: [{ name: 'Client' }] });
  assert.equal(rejected.statusCode, 400, rejected.body);
  assert.equal(writes.length, 0);
  const accepted = await edit({ clients: [{ name: 'Client' }], confirmPublicWork: true });
  assert.equal(accepted.statusCode, 200, accepted.body);
  assert.equal(writes[0].data[0].name, 'Client');
  assert.equal(writes[1].data.confirmedBy, 'owner');
  assert.equal(writes[1].data.content.clients[0].name, 'Client');
  const saved = await edit({ tagline: 'Local marketing' });
  assert.equal(saved.statusCode, 200, saved.body);
  assert.deepEqual(writes[2].data, { tagline: 'Local marketing' });
});

test('a new agency needs only the essentials and defaults to city-level visibility', async (t) => {
  const app = Fastify();
  t.after(() => app.close());
  await app.register(routes);
  t.mock.method(session, 'getUserFromRequest', async () => ({ id: 'owner', email: 'login@example.test', role: 'provider' }));
  replaceMethod(t, prisma.expert, 'findFirst', async () => null);
  replaceMethod(t, prisma.expert, 'findUnique', async () => null);
  t.mock.method(geocoding, 'geocodeExpertLocation', async (input) => {
    assert.deepEqual(input, { city: 'Chicago', state: 'IL' });
    return { ok: true, latitude: 41.88, longitude: -87.63 };
  });
  replaceMethod(t, prisma.expert, 'create', async ({ data }) => {
    assert.equal(data.locationPrecision, 'approximate');
    assert.equal(data.publicCityLatitude, 41.88);
    assert.equal(data.streetAddress, undefined);
    assert.equal(data.zip, undefined);
    return { id: 'agency', slug: data.slug };
  });
  const response = await app.inject({ method: 'POST', url: '/experts', payload: {
    businessName: 'Example Agency', city: 'Chicago', state: 'IL', expertType: 'agency', services: ['seo'],
  } });
  assert.equal(response.statusCode, 201, response.body);
  assert.equal(response.json().expert.slug, 'example-agency');
});
