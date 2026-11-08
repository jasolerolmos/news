/* Run with: node --test tests/news-session.test.cjs (after npm install). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../app/news-session.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const KEY = 'news:session:v1';
const item = code => ({ title: 'Example headline', url: 'https://www.abc.es/example.html', category: 'Science', source: code });
const plain = value => JSON.parse(JSON.stringify(value));

function boot(storage = new Map(), blocked = false) {
  let now = 2000000000000;
  const clock = class extends Date { static now() { return now; } };
  const output = {};
  vm.runInNewContext(compiled, {
    exports: output, URL, AbortController, setTimeout, clearTimeout, Date: clock,
    fetch() { throw new Error('Unexpected implicit fetch'); },
    window: { sessionStorage: {
      getItem(key) { if (blocked) throw new Error('Blocked'); return storage.get(key) || null; },
      setItem(key, value) { if (blocked) throw new Error('Quota'); storage.set(key, value); },
      removeItem(key) { storage.delete(key); },
    } },
  });
  return { api: output, storage, advance: milliseconds => { now += milliseconds; } };
}
function fakeFetch(calls, overrides = {}) {
  return async (url, options) => {
    const id = url.split('/').pop();
    calls.push({ id, options });
    if (overrides[id] instanceof Error) throw overrides[id];
    const code = { abc: 'ABC', elpais: 'ELPAIS', ideal: 'IDEAL', xataka: 'XATAKA', faz: 'FAZ', sueddeutsche: 'SZ' }[id];
    return { ok: true, json: async () => overrides[id] || [item(code)] };
  };
}

test('first session has no loaded sources and makes no requests', async () => {
  const { api } = boot();
  assert.deepEqual(plain(api.getSession().loaded), []);
  const calls = [];
  await api.loadSources([], false, fakeFetch(calls));
  assert.equal(calls.length, 0);
});

test('only selected sources are loaded, in parallel', async () => {
  const { api } = boot();
  const calls = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = api.loadSources(['abc', 'elpais'], false, async (url, options) => { const response = await fakeFetch(calls)(url, options); await gate; return response; });
  assert.equal(calls.length, 2);
  release();
  const result = await pending;
  assert.deepEqual(calls.map(call => call.id), ['abc', 'elpais']);
  assert.equal(result.cache.abc.items.length, 1);
  assert.equal(calls[0].options.cache, 'no-store');
});

test('fresh cache is reused and only a new source requires a request', async () => {
  const { api } = boot(); const calls = []; const fetcher = fakeFetch(calls);
  await api.loadSources(['abc'], false, fetcher);
  await api.loadSources(['abc'], false, fetcher);
  await api.loadSources(['abc', 'xataka'], false, fetcher);
  assert.deepEqual(calls.map(call => call.id), ['abc', 'xataka']);
});

test('30-minute expiry is per source; force refresh ignores freshness', async () => {
  const { api, advance } = boot(); const calls = []; const fetcher = fakeFetch(calls);
  await api.loadSources(['abc'], false, fetcher);
  advance(15 * 60 * 1000);
  await api.loadSources(['elpais'], false, fetcher);
  advance(15 * 60 * 1000);
  await api.loadSources(['abc', 'elpais'], false, fetcher);
  assert.deepEqual(calls.map(call => call.id), ['abc', 'elpais', 'abc']);
  await api.loadSources(['elpais'], true, fetcher);
  assert.equal(calls.length, 4);
});

test('failed or unexpectedly empty refresh keeps previous news and timestamp', async () => {
  const { api, advance } = boot(); const calls = [];
  await api.loadSources(['abc', 'elpais'], false, fakeFetch(calls));
  const old = api.getSession().cache.abc.fetchedAt;
  advance(api.CACHE_TTL);
  const result = await api.loadSources(['abc', 'elpais'], false, fakeFetch(calls, { abc: [], elpais: new Error('Offline') }));
  assert.equal(result.cache.abc.items.length, 1);
  assert.equal(result.cache.abc.fetchedAt, old);
  assert.equal(result.cache.elpais.items.length, 1);
  assert.deepEqual(plain(result.failed), ['elpais']);
  assert.deepEqual(plain(result.empty), ['abc']);
});

test('session reload restores selection, loaded sources, filters and scroll without network', async () => {
  const first = boot(); const calls = [];
  await first.api.loadSources(['abc'], false, fakeFetch(calls));
  first.api.saveView({ selected: ['abc', 'ideal'], loaded: ['abc'], source: 'ABC', category: 'Science', search: 'example', querySearch: 'related', scrollY: 1234 });
  const second = boot(first.storage);
  const restored = second.api.getSession();
  assert.deepEqual(plain(restored.selected), ['abc', 'ideal']);
  assert.deepEqual(plain(restored.loaded), ['abc']);
  assert.equal(restored.source, 'ABC');
  assert.equal(restored.category, 'Science');
  assert.equal(restored.search, 'example');
  assert.equal(restored.querySearch, 'related');
  assert.equal(restored.scrollY, 1234);
  await second.api.loadSources(restored.loaded, false, fakeFetch(calls));
  assert.equal(calls.length, 1);
});

test('concurrent loads deduplicate requests for the same source', async () => {
  const { api } = boot(); let count = 0; let release;
  const gate = new Promise(resolve => { release = resolve; });
  const fetcher = async () => { count++; await gate; return { ok: true, json: async () => [item('ABC')] }; };
  const one = api.loadSources(['abc'], false, fetcher);
  const two = api.loadSources(['abc'], false, fetcher);
  assert.equal(count, 1); release();
  await Promise.all([one, two]);
});

test('blocked storage falls back to memory and reports the limitation', async () => {
  const { api } = boot(new Map(), true); const calls = [];
  await api.loadSources(['abc'], false, fakeFetch(calls));
  assert.equal(api.hasStorageError(), true);
  await api.loadSources(['abc'], false, fakeFetch(calls));
  assert.equal(calls.length, 1);
});

test('corrupt storage, wrong-source news and future timestamps fail safely', async () => {
  const store = new Map([[KEY, '{broken']]);
  const { api } = boot(store);
  assert.equal(api.getSession().loaded.length, 0);
  const result = await api.loadSources(['abc'], false, fakeFetch([], { abc: [item('ELPAIS')] }));
  assert.deepEqual(plain(result.failed), ['abc']);
  assert.equal(api.isFresh({ items: [], fetchedAt: Date.now() + 100000 }, Date.now()), false);
  const decoded = api.decodeSession(JSON.stringify({ ...api.defaultSession(), cache: { abc: { fetchedAt: 1, items: [{ ...item('ABC'), url: 'javascript:alert(1)' }] } } }));
  assert.equal(decoded.cache.abc, undefined);
});

test('empty successful sources are cached and all seven outlets are exposed', async () => {
  const { api } = boot(); const calls = [];
  await api.loadSources(['faz'], false, fakeFetch(calls, { faz: [] }));
  await api.loadSources(['faz'], false, fakeFetch(calls, { faz: [] }));
  assert.equal(calls.length, 1);
  assert.equal(api.SOURCES.length, 7);
  assert.equal(api.SOURCES.filter(source => source.experimental).length, 2);
});
