const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const contactHandler = require('./contact');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;
let requestNumber = 0;

before(() => {
  process.env.RESEND_API_KEY = 'test_api_key';
  process.env.RESEND_FROM_EMAIL = 'Portfolio <contact@example.com>';
  process.env.CONTACT_TOKEN_SECRET = 'test-only-contact-token-secret-value';
  process.env.CONTACT_ALLOWED_ORIGINS = 'https://www.aayampaudel.com.np';
  process.env.CONTACT_SITE_URL = 'https://www.aayampaudel.com.np';
});

after(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  global.fetch = originalFetch;
});

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

function createRequest({ method = 'POST', url = '/api/contact', body, ip } = {}) {
  requestNumber += 1;
  return {
    method,
    url,
    body,
    headers: {
      origin: 'https://www.aayampaudel.com.np',
      'x-vercel-forwarded-for': ip || `192.0.2.${requestNumber}`,
    },
  };
}

test('rejects invalid addresses before calling the email provider', async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return Response.json({ id: 'unused' });
  };

  const res = createResponse();
  await contactHandler(createRequest({
    body: {
      email: 'not-an-email',
      message: 'A message that is long enough.',
    },
  }), res);

  assert.equal(res.statusCode, 400);
  assert.equal(fetchCalled, false);
});

test('rejects honeypot submissions without sending email', async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return Response.json({ id: 'unused' });
  };

  const res = createResponse();
  await contactHandler(createRequest({
    body: {
      email: 'visitor@example.com',
      message: 'A message that is long enough.',
      website: 'bot-filled-value',
    },
  }), res);

  assert.equal(res.statusCode, 400);
  assert.equal(fetchCalled, false);
});

test('requires a same-origin request', async () => {
  const req = createRequest({
    body: { email: 'visitor@example.com', message: 'A message that is long enough.' },
  });
  req.headers.origin = 'https://attacker.example';

  const res = createResponse();
  await contactHandler(req, res);

  assert.equal(res.statusCode, 403);
});

test('reports missing provider configuration instead of pretending to send', async () => {
  const apiKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  const res = createResponse();
  await contactHandler(createRequest({
    body: {
      email: 'visitor@example.com',
      message: 'A message that is long enough.',
    },
  }), res);

  process.env.RESEND_API_KEY = apiKey;
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /not configured/);
});

test('confirms sender ownership before sending to the portfolio inbox', async () => {
  const providerRequests = [];
  global.fetch = async (_url, options) => {
    providerRequests.push({
      headers: options.headers,
      body: JSON.parse(options.body),
    });
    return Response.json({ id: `email-${providerRequests.length}` });
  };

  const submitResponse = createResponse();
  await contactHandler(createRequest({
    body: {
      name: 'Site Visitor',
      email: 'visitor@example.com',
      message: 'I would like to discuss a project with you.',
    },
  }), submitResponse);

  assert.equal(submitResponse.statusCode, 200);
  assert.equal(submitResponse.body.status, 'verification_sent');
  assert.equal(providerRequests.length, 1);
  assert.deepEqual(providerRequests[0].body.to, ['visitor@example.com']);

  const confirmationUrl = providerRequests[0].body.text.match(/https:\/\/www\.aayampaudel\.com\.np\/api\/contact\?token=(\S+)/);
  assert.ok(confirmationUrl);
  const token = confirmationUrl[1];

  const confirmationResponse = createResponse();
  await contactHandler(createRequest({
    method: 'GET',
    url: `/api/contact?token=${encodeURIComponent(token)}`,
  }), confirmationResponse);
  assert.equal(confirmationResponse.statusCode, 200);
  assert.match(confirmationResponse.body, /Confirm and send message/);

  const sendRequest = createRequest({
    method: 'POST',
    body: `token=${encodeURIComponent(token)}`,
  });
  sendRequest.headers['content-type'] = 'application/x-www-form-urlencoded';
  const sendResponse = createResponse();
  await contactHandler(sendRequest, sendResponse);

  assert.equal(sendResponse.statusCode, 200);
  assert.match(sendResponse.body, /accepted for delivery/);
  assert.equal(providerRequests.length, 2);
  assert.deepEqual(providerRequests[1].body.to, ['aayampaudel200@gmail.com']);
  assert.equal(providerRequests[1].body.reply_to, 'visitor@example.com');
  assert.match(providerRequests[1].body.text, /I would like to discuss a project with you\./);
});

test('does not disclose provider errors', async () => {
  global.fetch = async () => new Response('private provider details', { status: 500 });

  const res = createResponse();
  await contactHandler(createRequest({
    body: {
      email: 'visitor@example.com',
      message: 'A message that is long enough.',
    },
  }), res);

  assert.equal(res.statusCode, 502);
  assert.equal(res.body.error, 'The confirmation email could not be sent. Please try again later.');
  assert.doesNotMatch(JSON.stringify(res.body), /private provider details/);
});
