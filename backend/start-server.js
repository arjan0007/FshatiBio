const app = require('./src/server');

// Server should already be listening from server.js
// Just wait a bit and test
setTimeout(() => {
  const http = require('http');
  http.get('http://localhost:3000/api/health', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('✅ Server is running!');
      console.log('Response:', data);
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('❌ Server not responding:', err.message);
    process.exit(1);
  });
}, 2000);

