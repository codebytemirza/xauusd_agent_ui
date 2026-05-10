import http from 'http';
import https from 'https';

const req = https.request('https://advised-england-query-medline.trycloudflare.com/api/agent/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});
req.write(JSON.stringify({symbol: 'XAUUSDm', timeframe: 'H1'}));
req.end();
