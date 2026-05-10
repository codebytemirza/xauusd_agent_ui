async function testCORS() {
  const res = await fetch('https://advised-england-query-medline.trycloudflare.com/api/agent/start', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://ais-dev-duwdjfizygko3h7zmdwygk-780209537311.asia-southeast1.run.app',
      'Access-Control-Request-Method': 'POST'
    }
  });
  console.log('Status:', res.status);
  console.log('Headers:', [...res.headers.entries()]);
}
testCORS();
