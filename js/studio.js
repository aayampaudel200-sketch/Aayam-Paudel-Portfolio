(function () {
  const form = document.getElementById('studio-access-form');
  if (!form) return;

  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const messageInput = document.getElementById('message');
  const websiteInput = document.getElementById('studioWebsite');
  const submitBtn = document.getElementById('requestSubmitBtn');
  const statusEl = document.getElementById('formMessage');

  function showStatus(text, color) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.style.color = color;
    statusEl.textContent = text;
  }

  async function handleStudioSubmit(event) {
    if (event) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';
    const website = websiteInput ? websiteInput.value.trim() : '';

    if (!name || !email || !message) {
      showStatus('Please complete your name, email address, and reason for access.', '#f87171');
      return false;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    showStatus('Submitting your access request...', '#38bdf8');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          source: 'studio',
          subject: 'Access Request: Namaste Suman Studio',
          name,
          email,
          message,
          website
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        showStatus('Request sent! Your access request has been delivered.', '#34d399');
        form.reset();
      } else {
        showStatus(data.error || 'Could not send your request right now. Please try again.', '#f87171');
      }
    } catch (error) {
      showStatus('Network error while sending your request. Please check your connection and try again.', '#f87171');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Access';
      }
    }

    return false;
  }

  form.addEventListener('submit', handleStudioSubmit, true);
  if (submitBtn) {
    submitBtn.addEventListener('click', function (event) {
      event.preventDefault();
      handleStudioSubmit(event);
    }, true);
  }
})();