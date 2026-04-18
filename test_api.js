const fetch = require('node-fetch'); // If required, or just use core http
const http = require('http');

const data = JSON.stringify({
  name: "Doctor Tester",
  email: "test" + Date.now() + "@doctor.com",
  password: "password123",
  role: "doctor"
});

const options = {
  hostname: '13.60.240.36',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('RESPONSE:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
