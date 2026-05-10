async function testFetch() {
  try {
    const res = await fetch('https://advised-england-query-medline.trycloudflare.com/api/agent/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symbol: 'XAUUSDm\n', timeframe: 'H1' })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
