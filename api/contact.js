/** Vercel Function for validated portfolio contact submissions. */

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_LENGTHS = { name: 100, email: 254, subject: 160, message: 5000, website: 200 };
const requestBuckets = new Map();

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function allowedOrigins() {
  const configured = (process.env.CONTACT_ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  return configured.length ? configured : ['https://www.aayampaudel.com.np', 'https://aayampaudel.com.np'];
}

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins().includes(origin);
}

function clientKey(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const address = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0];
  return address.trim() || 'unknown';
}

function isRateLimited(key, now = Date.now()) {
  const history = (requestBuckets.get(key) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (history.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestBuckets.set(key, history);
    return true;
  }
  history.push(now);
  requestBuckets.set(key, history);
  return false;
}

function parseBody(body) {
  if (typeof body !== 'string') return body || {};
  try { return JSON.parse(body); } catch { return null; }
}

module.exports = async (req, res) => {
  const origin = req.headers?.origin;
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ success: false, error: 'This origin is not allowed to submit the form.' });
  }

  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (isRateLimited(clientKey(req))) {
    return res.status(429).json({ success: false, error: 'Too many messages. Please try again in a few minutes.' });
  }

  const body = parseBody(req.body);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Please submit a valid form payload.' });
  }

  const fields = ['name', 'email', 'subject', 'message', 'website'];
  const values = Object.fromEntries(fields.map((field) => [field, typeof body[field] === 'string' ? body[field].trim() : '']));
  const { name, email, subject, message, website } = values;

  if (website) return res.status(200).json({ success: true });
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Please complete your name, email, subject, and message.' });
  }
  if (Object.entries(MAX_LENGTHS).some(([field, maximum]) => values[field].length > maximum)) {
    return res.status(400).json({ success: false, error: 'One or more fields are too long. Please shorten your message and try again.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address provided.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'The contact service is not configured yet. Please use the email link instead.' });
  }

  const sender = process.env.RESEND_FROM_EMAIL || 'Portfolio Contact Form <onboarding@resend.dev>';
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender,
        to: ['aayampaudel200@gmail.com'],
        reply_to: email,
        subject: `[Portfolio Contact] ${subject} — ${name}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      }),
    });
    if (!response.ok) {
      console.error('Resend request failed:', response.status);
      return res.status(502).json({ success: false, error: 'The message could not be sent right now. Please try again later or use the email link.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact delivery failed:', error);
    return res.status(502).json({ success: false, error: 'The message could not be sent right now. Please try again later or use the email link.' });
  }
};
