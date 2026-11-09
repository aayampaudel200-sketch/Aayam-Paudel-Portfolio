const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const contactHandler = require('./contact');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

before(() => {
  process.env.RESEND_API_KEY = 'test_resend_api_key_123';
});

after(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  global.fetch = originalFetch;
});

beforeEach(() => {
  process.env.RESEND_API_KEY = 'test_resend_api_key_123';
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

function createRequest({ method = 'POST', url = '/api/contact', body, origin, ip = `test-${Math.random()}` } = {}) {
  return {
    method,
    url,
    body,
    headers: {
      'content-type': 'application/json',
      ...(origin ? { origin } : {}),
      'x-forwarded-for': ip,
    },
  };
}

test('rejects non-POST methods with 405 Method Not Allowed', async () => {
  const req = createRequest({ method: 'GET' });
  const res = createResponse();

  await contactHandler(req, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.headers['Allow'], 'POST, OPTIONS');
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Method Not Allowed');
});

test('returns 500 when RESEND_API_KEY is missing', async () => {
  delete process.env.RESEND_API_KEY;

  const req = createRequest({
    method: 'POST',
    body: {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Hello',
      message: 'This is a test message.',
    },
  });
  const res = createResponse();

  await contactHandler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    error: 'The contact service is not configured yet. Please use the email link instead.',
  });
});

test('validates non-empty fields (name, email, subject, message)', async () => {
  const testCases = [
    { name: '', email: 'john@example.com', subject: 'Inquiry', message: 'Hello!' },
    { name: 'John', email: '', subject: 'Inquiry', message: 'Hello!' },
    { name: 'John', email: 'john@example.com', subject: '', message: 'Hello!' },
    { name: 'John', email: 'john@example.com', subject: 'Inquiry', message: '' },
    { name: '   ', email: 'john@example.com', subject: 'Inquiry', message: 'Hello!' },
  ];

  for (const body of testCases) {
    const req = createRequest({ method: 'POST', body });
    const res = createResponse();

    await contactHandler(req, res);

    assert.equal(res.statusCode, 400, `Expected 400 for payload: ${JSON.stringify(body)}`);
    assert.equal(res.body.success, false);
  }
});

test('validates email format', async () => {
  const req = createRequest({
    method: 'POST',
    body: {
      name: 'John',
      email: 'not-an-email',
      subject: 'Inquiry',
      message: 'Hello world!',
    },
  });
  const res = createResponse();

  await contactHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.error, /invalid email/i);
});

test('sends email successfully to Resend and returns 200', async () => {
  let capturedUrl = '';
  let capturedOptions = null;

  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return new Response(JSON.stringify({ id: 'resend_email_id_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const req = createRequest({
    method: 'POST',
    body: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'Website Redesign',
      message: 'I would like to discuss a project with you.',
    },
  });
  const res = createResponse();

  await contactHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });

  assert.equal(capturedUrl, 'https://api.resend.com/emails');
  assert.equal(capturedOptions.method, 'POST');
  assert.equal(capturedOptions.headers['Authorization'], 'Bearer test_resend_api_key_123');

  const parsedBody = JSON.parse(capturedOptions.body);
  assert.equal(parsedBody.from, 'Portfolio Contact Form <onboarding@resend.dev>');
  assert.deepEqual(parsedBody.to, ['aayampaudel200@gmail.com']);
  assert.equal(parsedBody.reply_to, 'jane@example.com');
  assert.equal(parsedBody.subject, '[Portfolio Contact] Website Redesign — Jane Smith');
  assert.match(parsedBody.html, /Jane Smith/);
  assert.match(parsedBody.html, /jane@example\.com/);
  assert.match(parsedBody.html, /I would like to discuss a project with you\./);
});

test('handles Resend API failure with a safe 502 error', async () => {
  global.fetch = async () => {
    return new Response(
      JSON.stringify({ message: 'Domain verification required or daily limit reached' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  const req = createRequest({
    method: 'POST',
    body: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'Inquiry',
      message: 'Hello there!',
    },
  });
  const res = createResponse();

  await contactHandler(req, res);

  assert.equal(res.statusCode, 502);
  assert.equal(res.body.success, false);
  assert.match(res.body.error, /could not be sent/i);
});

test('handles CORS preflight and rejects an untrusted origin', async () => {
  const optionsResponse = createResponse();
  await contactHandler(createRequest({ method: 'OPTIONS', origin: 'https://www.aayampaudel.com.np' }), optionsResponse);
  assert.equal(optionsResponse.statusCode, 204);
  assert.equal(optionsResponse.headers['Access-Control-Allow-Origin'], 'https://www.aayampaudel.com.np');

  const rejectedResponse = createResponse();
  await contactHandler(createRequest({ origin: 'https://untrusted.example', body: {} }), rejectedResponse);
  assert.equal(rejectedResponse.statusCode, 403);
});

test('accepts honeypot submissions without sending an email', async () => {
  let sent = false;
  global.fetch = async () => { sent = true; return new Response('{}', { status: 200 }); };
  const res = createResponse();
  await contactHandler(createRequest({ body: { name: 'Bot', email: 'bot@example.com', subject: 'Bot', message: 'Bot', website: 'https://spam.test' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(sent, false);
});

test('rejects overly long submissions before delivery', async () => {
  const res = createResponse();
  await contactHandler(createRequest({ body: { name: 'Jane', email: 'jane@example.com', subject: 'x'.repeat(161), message: 'Hello' } }), res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /too long/i);
});
