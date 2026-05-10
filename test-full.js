async function testFull() {
  const candles = Array.from({length: 300}).map((_, i) => ({
    time: "2026-05-09T00:00:00Z",
    open: 1.1,
    high: 1.2,
    low: 1.0,
    close: 1.15
  }));
  const res = await fetch('https://advised-england-query-medline.trycloudflare.com/api/analysis/full', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ candles })
  });
  console.log('Status full:', res.status);
  const text = await res.text();
  console.log('Body:', text.substring(0, 100));
}
testFull();
