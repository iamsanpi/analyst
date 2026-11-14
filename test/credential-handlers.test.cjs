// Run with: node --test test/credential-handlers.test.cjs
// Offline regression tests: provider SDKs and network calls are mocked.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const cases = [
  ['getGPTSQLQuery.js', 'MOONSHOT_API_KEY'],
  ['getGPTSQLAnalyze.js', 'MOONSHOT_API_KEY'],
  ['getGPTAnalyze.js', 'ANTHROPIC_API_KEY'],
];

function load(file, env, fail = false) {
  const source = fs.readFileSync(path.join(__dirname, '../api', file), 'utf8');
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{10,}/);
  const calls = [];
  const logs = [];
  let handler;
  const context = {
    module: { exports: {} }, process: { env },
    console: { error: (...args) => logs.push(args) },
    require(name) {
      if (name === 'express') return { Router: () => ({ post(route, fn) { assert.equal(route, '/'); handler = fn; } }) };
      if (name === 'node-fetch') return async (url, options) => {
        calls.push({ url, options });
        if (fail) throw new Error('FAKE_PRIVATE_ERROR');
        return { json: async () => ({ result: 'ok' }) };
      };
      if (name === 'anthropic') return { ConversationClient: class {
        constructor(options) { calls.push({ client: options }); }
        async sendMessage(prompt) {
          calls.push({ prompt });
          if (fail) throw new Error('FAKE_PRIVATE_ERROR');
          return { text: 'analysis' };
        }
      } };
      throw new Error('Unexpected dependency');
    },
  };
  vm.runInNewContext(source, context, { filename: file });
  return { handler: handler || context.module.exports, calls, logs };
}
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

for (const [file, envName] of cases) {
  for (const value of [undefined, '', '   ']) {
    test(`${file}: absent/blank key ${JSON.stringify(value)} fails closed`, async () => {
      const app = load(file, { [envName]: value });
      assert.equal(app.calls.length, 0);
      const res = response();
      await app.handler({ body: { data: [] } }, res);
      assert.equal(res.code, 503);
      assert.equal(res.body.error, 'AI service is not configured');
      assert.equal(app.calls.length, 0);
    });
  }

  test(`${file}: uses only the configured provider key and preserves the response`, async () => {
    const app = load(file, { [envName]: 'fake-runtime-value' });
    const res = response();
    const body = { data: [1], fieldExplanations: { x: 'X' }, userInput: 'question', sqlQuery: 'SELECT 1' };
    await app.handler({ body }, res);
    assert.equal(res.code, 200);
    if (envName === 'MOONSHOT_API_KEY') {
      assert.equal(app.calls.length, 1);
      assert.equal(app.calls[0].url, 'https://api.moonshot.cn/chat');
      assert.equal(app.calls[0].options.headers.Authorization, 'Bearer fake-runtime-value');
      const payload = JSON.parse(app.calls[0].options.body);
      assert.deepEqual(payload.input.data, body.data);
      assert.equal(payload.input.userInput, body.userInput);
      assert.equal(payload.parameters.max_output_tokens, 2048);
      if (file === 'getGPTSQLAnalyze.js') assert.equal(payload.input.sqlQuery, body.sqlQuery);
      assert.equal(res.body.result, 'ok');
    } else {
      assert.equal(app.calls[0].client.apiKey, 'fake-runtime-value');
      assert.match(app.calls[1].prompt, /\[1\]$/);
      assert.equal(res.body.analysis, 'analysis');
    }
  });

  test(`${file}: failure logs exclude provider error details`, async () => {
    const app = load(file, { [envName]: 'fake-runtime-value' }, true);
    const res = response();
    await app.handler({ body: { data: [] } }, res);
    assert.equal(res.code, 500);
    assert.equal(app.logs.length, 1);
    assert.equal(app.logs[0].length, 1);
    assert.match(app.logs[0][0], /request failed$/);
    assert.doesNotMatch(JSON.stringify(app.logs), /FAKE_PRIVATE_ERROR|fake-runtime-value/);
  });
}
