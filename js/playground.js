(() => {
  const textInput = document.getElementById('playgroundText');
  const textCount = document.getElementById('textCount');
  if (textInput && textCount) {
    const updateCount = () => {
      const value = textInput.value.trim();
      const words = value ? value.split(/\s+/).length : 0;
      textCount.textContent = `${textInput.value.length} characters · ${words} words`;
    };
    textInput.addEventListener('input', updateCount);
  }

  const accentOutput = document.getElementById('accentOutput');
  document.querySelectorAll('.color-swatch[data-color]').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      document.documentElement.style.setProperty('--accent', color);
      if (accentOutput) accentOutput.textContent = `Accent: ${color}`;
    });
  });

  const copyButton = document.getElementById('copySnippet');
  const copyStatus = document.getElementById('copySnippetStatus');
  if (copyButton && copyStatus) {
    copyButton.addEventListener('click', async () => {
      const snippet = 'const clamp = (value, min, max) =>\n  Math.min(Math.max(value, min), max);';
      try {
        await navigator.clipboard.writeText(snippet);
        copyStatus.textContent = 'Snippet copied.';
      } catch (error) {
        console.error('Unable to copy the code snippet:', error);
        copyStatus.textContent = 'Copy failed. Select and copy the code manually.';
      }
    });
  }
})();
