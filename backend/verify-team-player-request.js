const http = require('http');
const payload = JSON.stringify({ teamKey: 'A::Titans', teamName: 'Titans', division: 'A', players: [] });
const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/team-players',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-lamsl-role': 'team-manager',
    'x-lamsl-session': 'active',
    'x-lamsl-username': 'manager1',
    'x-lamsl-assigned-team': 'Titans',
    'x-lamsl-assigned-division': 'A',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`STATUS ${res.statusCode}`);
    console.log(body);
  });
});
req.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
req.write(payload);
req.end();
