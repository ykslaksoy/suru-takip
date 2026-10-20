import { createServer } from 'node:http';
import { handleRequest } from './api/router.js';

const port = Number(process.env.PORT ?? 8787);

createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'internal' }));
  });
}).listen(port, () => {
  console.log(`superkuzu-sunucu listening on http://127.0.0.1:${port}`);
});
