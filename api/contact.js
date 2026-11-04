const crypto = require('node:crypto');
const { Resend } = require('resend');

const OWNER_EMAIL = 'aayampaudel200@gmail.com';
const TOKEN_LIFETIME_MS = 30 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const attemptsByIp = new Map();

function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(body);
}

function html(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(body);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function getAllowedOrigins() {
  const configured = process.env.CONTACT_ALLOWED_ORIGINS;
  const origins = configured
    ? configured.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['https://www.aayampaudel.com.np', 'https://aayampaudel.com.np'];

  return new Set(origins.map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return '';
    }
  }).filter(Boolean));
}

function hasAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (typeof origin !== 'string') return false;

  try {
    return getAllowedOrigins().has(new URL(origin).origin);
  } catch {
    return false;
  }
}

function getClientIp(req) {
  const forwardedIp = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'];
  if (typeof forwardedIp === 'string' && forwardedIp.trim()) {
    return forwardedIp.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req, now = Date.now()) {
  const ip = getClientIp(req);
  const recentAttempts = (attemptsByIp.get(ip) || []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );

  if (recentAttempts.length >= RATE_LIMIT) {
    attemptsByIp.set(ip, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  attemptsByIp.set(ip, recentAttempts);

  if (attemptsByIp.size > 1000) {
    for (const [key, timestamps] of attemptsByIp) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_WINDOW_MS)) {
        attemptsByIp.delete(key);
      }
    }
  }

  return false;
}

function getBody(req) {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      const body = {};
      for (const [key, value] of new URLSearchParams(req.body)) {
        body[key] = value;
      }
      return body;
    }
  }
  return null;
}

function getTokenSecret() {
  const secret = process.env.CONTACT_TOKEN_SECRET;
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32) {
    return null;
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function encryptPayload(payload, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  return [
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

function decryptPayload(token, key) {
  if (typeof token !== 'string' || token.length > 20000) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[\w-]+$/.test(part))) return null;

  try {
    const [iv, authTag, encrypted] = parts.map((part) => Buffer.from(part, 'base64url'));
    if (iv.length !== 12 || authTag.length !== 16 || encrypted.length > 15000) return null;

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
    const payload = JSON.parse(plaintext);

    if (
      typeof payload.email !== 'string' ||
      typeof payload.message !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.id !== 'string' ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > 254 || /[\r\n\s]/.test(email)) return false;
  const at = email.lastIndexOf('@');
  if (at < 1 || at > 64 || at === email.length - 1) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..')
  ) {
    return false;
  }

  const labels = domain.split('.');
  return labels.length >= 2 && labels.every(
    (label) => label.length > 0 && label.length <= 63 &&
      /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
  );
}

function getRequestPayload(req) {
  const body = getBody(req);
  if (!body) return null;

  try {
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 12000) return null;
  } catch {
    return null;
  }

  return body;
}

function getProviderConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const tokenKey = getTokenSecret();
  if (!apiKey || !from || !tokenKey) return null;
  return { apiKey, from, tokenKey };
}

async function sendEmail(config, message, idempotencyKey) {
  const resend = new Resend(config.apiKey);
  const { data, error } = await resend.emails.send(message, {
    idempotencyKey,
    signal: AbortSignal.timeout(10000),
  });

  if (error) {
    console.error('Contact email provider rejected the request.');
    throw new Error('Email provider rejected the request.');
  }
  if (!data || typeof data.id !== 'string' || !data.id) {
    console.error('Contact email provider response did not contain a message ID.');
    throw new Error('Email provider returned an invalid response.');
  }
  return data.id;
}

function getIdempotencyKey(key, purpose, id) {
  return `${purpose}-${crypto.createHmac('sha256', key).update(id).digest('hex')}`;
}

function sendConfirmationPage(res, token) {
  const safeToken = escapeHtml(token);
  return html(res, 200, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirm your message — Aayam Paudel</title>
</head>
<body style="font:16px/1.6 system-ui,sans-serif;max-width:38rem;margin:10vh auto;padding:1.5rem;color:#172033">
  <main>
    <h1>Confirm your email</h1>
    <p>Click below to confirm that you can receive email at this address and send your message to Aayam Paudel.</p>
    <form method="post" action="/api/contact">
      <input type="hidden" name="token" value="${safeToken}">
      <button type="submit" style="padding:.8rem 1.2rem;border:0;border-radius:.5rem;background:#2563eb;color:#fff;font:inherit;cursor:pointer">Confirm and send message</button>
    </form>
    <p>This confirmation link expires in 30 minutes.</p>
  </main>
</body>
</html>`);
}

async function handleSubmit(req, res, payload, config) {
  if (!hasAllowedOrigin(req)) {
    return json(res, 403, { error: 'This request could not be verified.' });
  }
  if (isRateLimited(req)) {
    return json(res, 429, { error: 'Too many attempts. Please wait a while and try again.' });
  }
  if (!payload) {
    return json(res, 400, { error: 'Please check the form and try again.' });
  }

  if (typeof payload.website === 'string' && payload.website.trim()) {
    return json(res, 400, { error: 'Please check the form and try again.' });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (
    !isValidEmail(email) ||
    name.length > 100 ||
    /[\r\n]/.test(name) ||
    message.length < 10 ||
    message.length > 5000
  ) {
    return json(res, 400, { error: 'Enter a valid email address and a message between 10 and 5,000 characters.' });
  }

  const id = crypto.randomBytes(18).toString('base64url');
  const token = encryptPayload({
    email,
    name,
    message,
    id,
    expiresAt: Date.now() + TOKEN_LIFETIME_MS,
  }, config.tokenKey);
  const baseUrl = (process.env.CONTACT_SITE_URL || 'https://www.aayampaudel.com.np').replace(/\/+$/, '');
  const confirmationUrl = `${baseUrl}/api/contact?token=${encodeURIComponent(token)}`;

  try {
    await sendEmail(config, {
      from: config.from,
      to: [email],
      subject: 'Confirm your message to Aayam Paudel',
      text: `Open this link to confirm your email and send your message to Aayam Paudel:\n\n${confirmationUrl}\n\nThe link expires in 30 minutes. If you did not submit the form, you can ignore this email.`,
      html: `<p>Confirm that you can receive email at this address and send your message to Aayam Paudel:</p><p><a href="${confirmationUrl}">Confirm and send message</a></p><p>This link expires in 30 minutes. If you did not submit the form, you can ignore this email.</p>`,
    }, getIdempotencyKey(config.tokenKey, 'verify', id));

    return json(res, 200, { status: 'verification_sent' });
  } catch {
    console.error('Contact verification email request failed.');
    return json(res, 502, { error: 'The confirmation email could not be sent. Please try again later.' });
  }
}

async function handleConfirmation(req, res, token, config) {
  if (req.method === 'GET') {
    if (!decryptPayload(token, config.tokenKey)) {
      return html(res, 400, '<!doctype html><html lang="en"><meta charset="utf-8"><title>Link expired</title><body><main><h1>Confirmation link expired</h1><p>Please return to the portfolio and submit your message again.</p></main></body></html>');
    }
    return sendConfirmationPage(res, token);
  }

  if (!hasAllowedOrigin(req)) {
    return html(res, 403, '<!doctype html><html lang="en"><meta charset="utf-8"><title>Request rejected</title><body><main><h1>Request could not be verified</h1><p>Return to the portfolio and try again.</p></main></body></html>');
  }
  if (isRateLimited(req)) {
    return html(res, 429, '<!doctype html><html lang="en"><meta charset="utf-8"><title>Try again later</title><body><main><h1>Too many attempts</h1><p>Please wait a while and try again.</p></main></body></html>');
  }

  const payload = decryptPayload(token, config.tokenKey);
  if (!payload) {
    return html(res, 400, '<!doctype html><html lang="en"><meta charset="utf-8"><title>Link expired</title><body><main><h1>Confirmation link expired</h1><p>Please return to the portfolio and submit your message again.</p></main></body></html>');
  }

  const safeName = escapeHtml(payload.name || 'Website visitor');
  const safeEmail = escapeHtml(payload.email);
  const safeMessage = escapeHtml(payload.message).replace(/\r?\n/g, '<br>');

  try {
    await sendEmail(config, {
      from: config.from,
      to: [OWNER_EMAIL],
      replyTo: payload.email,
      subject: 'New message from your portfolio website',
      text: `From: ${payload.name || 'Website visitor'} <${payload.email}>\n\n${payload.message}`,
      html: `<p><strong>From:</strong> ${safeName} &lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;</p><p>${safeMessage}</p>`,
    }, getIdempotencyKey(config.tokenKey, 'contact', payload.id));

    return html(res, 200, '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Message sent — Aayam Paudel</title><body style="font:16px/1.6 system-ui,sans-serif;max-width:38rem;margin:10vh auto;padding:1.5rem;color:#172033"><main><h1>Message sent</h1><p>Your email was confirmed and the message was accepted for delivery to Aayam Paudel.</p><p><a href="/">Return to the portfolio</a></p></main></body></html>');
  } catch {
    console.error('Contact message delivery request failed.');
    return html(res, 502, '<!doctype html><html lang="en"><meta charset="utf-8"><title>Message not sent</title><body><main><h1>Message could not be sent</h1><p>Please return to the portfolio and try again.</p></main></body></html>');
  }
}

module.exports = async function contactHandler(req, res) {
  const config = getProviderConfig();
  if (!config) {
    return json(res, 503, { error: 'The contact form is not configured yet. Please use the email link instead.' });
  }

  const url = new URL(req.url || '/api/contact', 'https://www.aayampaudel.com.np');
  const body = req.method === 'POST' ? getBody(req) : null;
  const bodyToken = body && typeof body.token === 'string' ? body.token : '';
  const token = url.searchParams.get('token') || bodyToken;

  if (req.method === 'GET') {
    if (!token) return json(res, 405, { error: 'Method not allowed.' });
    return handleConfirmation(req, res, token, config);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  if (token) {
    return handleConfirmation(req, res, token, config);
  }

  return handleSubmit(req, res, getRequestPayload(req), config);
};
