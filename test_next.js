const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: true, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  server.listen(3001, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3001');
    
    // Test the route
    const http = require('http');
    http.get('http://localhost:3001/category/espana', (res) => {
        console.log('Status code for /category/espana:', res.statusCode);
        process.exit(0);
    });
  });
});
