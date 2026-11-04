(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactFormStatus');
  const submitButton = document.getElementById('contactSubmit');

  if (!form || !status || !submitButton) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      website: formData.get('website'),
    };

    submitButton.disabled = true;
    status.dataset.state = '';
    status.textContent = 'Sending a confirmation link…';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'The message could not be sent.');
      }

      status.dataset.state = 'success';
      status.textContent = 'Check your email and open the confirmation link to send your message.';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error instanceof Error
        ? error.message
        : 'The message could not be sent. Please try again later.';
    } finally {
      submitButton.disabled = false;
    }
  });
})();
