document.getElementById('demoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const company = document.getElementById('company').value.trim();
  const country = document.getElementById('country').value.trim();
  const product = document.getElementById('product').value.trim();
  const message = document.getElementById('message').value.trim();

  const resultEl = document.getElementById('result');
  resultEl.textContent = 'Submitting...';

  try {
    const res = await fetch('/api/demo-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, country, product, message, submittedAt: new Date().toISOString() })
    });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    resultEl.textContent = '✅ Request submitted. We will contact you shortly.';
    document.getElementById('demoForm').reset();
  } catch (err) {
    resultEl.textContent = '❌ Submission failed: ' + err.message;
  }
});
