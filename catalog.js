const { connectLambda, getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  connectLambda(event);
  const store = getStore({ name: 'shop-catalog', consistency: 'strong' });

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get('catalog', { type: 'json' });
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (e) {
      return { statusCode: 200, headers, body: JSON.stringify(null) };
    }
  }

  if (event.httpMethod === 'POST') {
    const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };
    }
    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid json' }) };
    }
    if (!Array.isArray(payload)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'expected an array' }) };
    }
    await store.setJSON('catalog', payload);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers, body: 'Method not allowed' };
};
