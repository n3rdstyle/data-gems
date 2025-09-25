const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Data Gems Waitlist - Test</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
            h1 { color: #EC6F95; }
        </style>
    </head>
    <body>
        <h1>Data Gems Waitlist</h1>
        <p>Server is working! There seems to be an issue with Next.js.</p>
        <p>Port: 3003</p>
    </body>
    </html>
  `);
});

server.listen(3003, () => {
  console.log('Simple server running on http://localhost:3003');
});