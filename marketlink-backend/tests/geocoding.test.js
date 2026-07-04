require('ts-node/register/transpile-only');

const test = require('node:test');
const assert = require('node:assert/strict');

test('lookupZipLocation caches successful ZIP lookups within the process', async () => {
  const originalApiKey = process.env.GEOAPIFY_API_KEY;
  const originalFetch = global.fetch;
  process.env.GEOAPIFY_API_KEY = 'test-key';

  const geocodingPath = require.resolve('../src/lib/geocoding');
  delete require.cache[geocodingPath];

  let fetchCalls = 0;
  global.fetch = async () => {
    fetchCalls += 1;
    return {
      ok: true,
      json: async () => ({
        results: [
          {
            lat: 41.79,
            lon: -87.98,
            city: 'Westmont',
            state_code: 'IL',
            postcode: '60559',
          },
        ],
      }),
    };
  };

  try {
    const { lookupZipLocation } = require('../src/lib/geocoding');

    const first = await lookupZipLocation({ zip: '60559' });
    const second = await lookupZipLocation({ zip: '60559' });

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.equal(fetchCalls, 1);
  } finally {
    if (originalApiKey === undefined) delete process.env.GEOAPIFY_API_KEY;
    else process.env.GEOAPIFY_API_KEY = originalApiKey;

    global.fetch = originalFetch;
    delete require.cache[geocodingPath];
  }
});
