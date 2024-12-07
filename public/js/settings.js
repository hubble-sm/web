document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.querySelector('select[name="theme"]');
  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const theme = e.target.value;
      await fetch('/settings/update/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': document.querySelector('[name="_csrf"]').value
        },
        body: JSON.stringify({ theme })
      });
      window.location.reload();
    });
  }
});