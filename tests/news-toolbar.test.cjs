/* Run: node --test tests/news-toolbar.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, imports = {}) {
  const text = fs.readFileSync(path.join(__dirname, '../app', file), 'utf8');
  const compiled = ts.transpileModule(text, { fileName: file, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const output = {};
  vm.runInNewContext(compiled.outputText, { exports: output, require: name => imports[name] || require(name), URL, Date, console });
  return output;
}
const session = load('news-session.ts');
const Toolbar = load('news-toolbar.tsx', { './news-session': session }).default;
function props(overrides = {}) {
  return { view: session.defaultSession(), setView() {}, cache: {}, categories: [], count: 0, ready: true, loading: false, failed: [], empty: [], changed: true, url: '', setUrl() {}, onSubmitUrl() {}, onLoad() {}, onRefresh() {}, ...overrides };
}
function nodes(element, predicate) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(child => nodes(child, predicate));
  return [...(predicate(element) ? [element] : []), ...nodes(element.props?.children, predicate)];
}
const markup = values => renderToStaticMarkup(React.createElement(Toolbar, values));
const entry = age => ({ fetchedAt: Date.now() - age, items: [{ title: 'Example', url: 'https://www.abc.es/a', category: 'General', source: 'ABC' }] });

test('every current outlet is a labeled toggle with its pressed state', () => {
  const tree = Toolbar(props());
  const toggles = nodes(tree, node => node.props?.className === 'news-outlet-toggle');
  assert.equal(toggles.length, session.SOURCES.length);
  assert.equal(toggles.filter(node => node.props['aria-pressed']).length, 2);
  assert.equal(toggles.filter(node => node.props['aria-label'].includes('experimental')).length, 2);
  assert(toggles.some(node => node.props['aria-label'] === 'Diario de Mallorca'));
});

test('selecting an outlet only updates the draft selection', () => {
  let view = session.defaultSession(); let requests = 0;
  const tree = Toolbar(props({ setView: update => { view = update(view); }, onLoad: () => requests++ }));
  nodes(tree, node => node.props?.['aria-label'] === 'Xataka')[0].props.onClick();
  assert(view.selected.includes('xataka'));
  assert.equal(view.loaded.length, 0);
  assert.equal(requests, 0);
});

test('load and refresh actions have correct disabled states', () => {
  const tree = Toolbar(props({ view: { ...session.defaultSession(), selected: [] } }));
  const actions = nodes(tree, node => typeof node.props?.className === 'string' && node.props.className.startsWith('news-action '));
  assert.equal(actions[0].props.disabled, true);
  assert.equal(actions[1].props.disabled, true);
  const loading = Toolbar(props({ loading: true }));
  assert.equal(nodes(loading, node => node.type === 'fieldset')[0].props.disabled, true);
});

test('media status is expanded by default, including the empty state', () => {
  const tree = Toolbar(props());
  const status = nodes(tree, node => node.props?.className === 'news-media-status')[0];
  assert.equal(status.props.open, true);
  const html = markup(props());
  assert(html.includes('Estado de los medios'));
  assert(html.includes('Ningún medio cargado'));
  assert(html.includes('Selección pendiente'));
});

test('status shows dates, article counts and fresh, expired or failed results', () => {
  const view = { ...session.defaultSession(), loaded: ['abc'] };
  const fresh = markup(props({ view, cache: { abc: entry(1000) }, count: 1, changed: false }));
  assert(fresh.includes('Disponible'));
  assert(fresh.includes('<time'));
  assert(fresh.includes('news-status-quantity">1'));
  assert(!fresh.includes('Selección pendiente'));
  assert(markup(props({ view, cache: { abc: entry(session.CACHE_TTL) } })).includes('Pendiente de actualizar'));
  assert(markup(props({ view, cache: { abc: entry(1000) }, failed: ['abc'] })).includes('Error · datos guardados'));
  assert(markup(props({ view, failed: ['abc'] })).includes('Error de carga'));
  assert(markup(props({ view, loading: true })).includes('Comprobando…'));
});

test('clearing filters retains source selection and loaded sources', () => {
  let view = { ...session.defaultSession(), loaded: ['abc'], source: 'ABC', category: 'Science', search: 'example' };
  const tree = Toolbar(props({ view, setView: update => { view = update(view); } }));
  nodes(tree, node => node.props?.className === 'news-clear-filters')[0].props.onClick();
  assert.equal(view.search, ''); assert.equal(view.category, 'all'); assert.equal(view.source, 'all');
  assert.equal(view.selected.length, 2); assert.equal(view.loaded[0], 'abc');
});

test('URL form remains secondary and validates its URL input', () => {
  const tree = Toolbar(props());
  assert.equal(nodes(tree, node => node.props?.className === 'news-toolbar-url')[0].props.open, undefined);
  const input = nodes(tree, node => node.props?.id === 'article-url')[0];
  assert.equal(input.props.type, 'url'); assert.equal(input.props.required, true);
});

test('homepage places toolbar above headlines without a duplicate footer status', () => {
  const page = fs.readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');
  assert(page.indexOf('<NewsToolbar') < page.indexOf('<section className="compact-grid"'));
  assert(!page.includes('<summary>Estado de los medios'));
});
