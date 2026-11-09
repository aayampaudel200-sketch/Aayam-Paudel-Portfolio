/**
 * Vercel Serverless Function: Resend Contact Form Email Delivery
 */

module.exports = async (req, res) => {
  // Restrict methods to POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
    });
  }

  // Retrieve the API key securely from process.env.RESEND_API_KEY
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error: RESEND_API_KEY missing',
    });
  }

  // Parse request body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload in request body',
      });
    }
  }

  const { name, email, subject, message } = body || {};

  // Validate that all fields are non-empty strings
  if (
    !name ||
    !email ||
    !subject ||
    !message ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof subject !== 'string' ||
    typeof message !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !subject.trim() ||
    !message.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: 'All fields (name, email, subject, message) are required and cannot be empty.',
    });
  }

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address provided.',
    });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();

  // Escape HTML characters in user input to prevent injection in the email body
  const escapeHtml = (str) =>
    str.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char]);

  const safeName = escapeHtml(trimmedName);
  const safeEmail = escapeHtml(trimmedEmail);
  const safeMessage = escapeHtml(trimmedMessage).replace(/\n/g, '<br>');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact Form <onboarding@resend.dev>',
        to: ['aayampaudel200@gmail.com'],
        reply_to: trimmedEmail,
        subject: `[Portfolio Contact] ${trimmedSubject || 'New Inquiry'} from ${trimmedName}`,
        html: `<p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Message:</strong></p><p>${safeMessage}</p>`,
      }),
    });

    const data = await resendResponse.json().catch(() => null);

    if (!resendResponse.ok) {
      const errorDetail =
        data?.message || data?.error?.message || data?.error || resendResponse.statusText || 'Email delivery failed';
      return res.status(500).json({
        success: false,
        error: `Resend error: ${errorDetail}`,
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error while sending email',
    });
  }
};
