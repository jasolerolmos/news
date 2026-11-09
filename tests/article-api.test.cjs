const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const ts = require('typescript');

function harness() {
  const source = fs.readFileSync('app/api/article/route.ts', 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const calls = { spawn: [], axios: [] };
  const children = [];
  class Child extends EventEmitter {
    constructor() { super(); this.stdout = new EventEmitter(); this.stderr = new EventEmitter(); this.stdout.setEncoding = () => {}; this.pid = undefined; }
    kill() {}
    complete(value, code = 0) { if (value) this.stdout.emit('data', JSON.stringify(value)); this.emit('close', code); }
  }
  const axios = { async get(url) { calls.axios.push(url); return { data: '<p>body</p>', headers: { 'content-type': 'text/html' } }; } };
  class JSDOM {
    constructor(html) {
      this.window = { document: { querySelector: () => ({ textContent: 'Titulo' }), querySelectorAll: () => [{ textContent: html, querySelectorAll: () => [] }] }, close() {} };
    }
  }
  const NextResponse = { json(data, options = {}) { return { data, status: options.status || 200 }; } };
  const requireMock = name => {
    if (name === 'next/server') return { NextResponse };
    if (name === 'axios') return { __esModule: true, default: axios };
    if (name === 'jsdom') return { JSDOM };
    if (name === 'node:child_process') return { spawn(binary, args) { const child = new Child(); children.push(child); calls.spawn.push({ binary, args }); return child; } };
    return require(name);
  };
  const exports = {};
  const context = vm.createContext({ exports, require: requireMock, Buffer, URL, process, setTimeout, clearTimeout, console });
  vm.runInContext(compiled, context);
  const req = url => new Request(`https://app.test/api/article?url=${encodeURIComponent(url)}`);
  return { get: url => exports.GET(req(url)), calls, children };
}

test('El Pais uses a child process and returns only confirmed result', async () => {
  const h = harness();
  const request = h.get('https://elpais.com/espana/test.html');
  assert.equal(h.calls.spawn.length, 1);
  assert.equal(h.calls.axios.length, 0);
  h.children[0].complete({ html: 'Un parrafo suficientemente largo para verificar la respuesta del lector y preservar texto sin ejecutar scripts.', url: 'https://elpais.com/espana/test.html' });
  const result = await request;
  assert.equal(result.status, 200); assert.match(result.data.body, /parrafo/);
});

test('disallowed URL never reaches network or child process', async () => {
  const h = harness();
  assert.equal((await h.get('https://elpais.com.evil.test/')).status, 400);
  assert.equal((await h.get('https://127.0.0.1/')).status, 400);
  assert.equal(h.calls.spawn.length, 0); assert.equal(h.calls.axios.length, 0);
});

test('other outlets continue to use axios rather than Chromium', async () => {
  const h = harness();
  const result = await h.get('https://abc.es/article.html');
  assert.equal(result.status, 200); assert.equal(h.calls.axios.length, 1); assert.equal(h.calls.spawn.length, 0);
});

test('one concurrent browser per worker, then rejects invalid browser output', async () => {
  const h = harness();
  const first = h.get('https://elpais.com/a');
  const second = await h.get('https://elpais.com/b');
  assert.equal(second.status, 503);
  h.children[0].complete({ html: '<p>hello</p>', url: 'https://localhost/' });
  assert.equal((await first).status, 502);
  const third = h.get('https://elpais.com/c');
  h.children[1].complete(null, 1);
  assert.equal((await third).status, 502);
});
