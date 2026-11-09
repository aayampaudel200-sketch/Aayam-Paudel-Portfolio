(() => {
  const form =
    document.getElementById('contactForm') ||
    document.getElementById('contact-form') ||
    document.querySelector('.contact-form');

  if (!form) return;

  const status =
    document.getElementById('contactFormStatus') ||
    form.querySelector('.contact-form-status');

  const submitButton =
    document.getElementById('contactSubmit') ||
    form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const name = (formData.get('name') || '').trim();
    const email = (formData.get('email') || '').trim();
    const subject = (formData.get('subject') || '').trim();
    const message = (formData.get('message') || '').trim();

    if (!name || !email || !subject || !message) {
      if (status) {
        status.dataset.state = 'error';
        status.textContent = 'Please fill out all fields before submitting.';
      }
      return;
    }

    const originalButtonText = submitButton ? submitButton.textContent : 'Send message';

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending message…';
    }

    if (status) {
      status.dataset.state = '';
      status.textContent = 'Sending your message…';
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result || !result.success) {
        const errorMsg =
          result && result.error ? result.error : 'Failed to send message. Please try again.';
        throw new Error(errorMsg);
      }

      if (status) {
        status.dataset.state = 'success';
        status.textContent = 'Thank you! Your message has been sent successfully.';
      }

      form.reset();
    } catch (error) {
      if (status) {
        status.dataset.state = 'error';
        status.textContent =
          error instanceof Error
            ? error.message
            : 'Something went wrong while sending your message. Please try again later.';
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
})();
