// Round-trip test for the encrypted snapshot publisher.
// Runs publish.mjs on a synthetic state file, then decrypts the written
// snapshot.enc with the key from the printed link - the same path the
// browser takes. Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { webcrypto } from 'node:crypto';

const ROOT = new URL('..', import.meta.url).pathname;
const PUBLISH = join(ROOT, 'publish.mjs');

const STATE = {
  generated_at: '2026-09-13T20:30:00Z',
  projects: [
    { slug: 'kyoto-trip', title: 'Kyoto trip', category: 'travel', state: 'waiting', sort: 10,
      status: 'Waiting on your pick.', last_update: 'Found 4 stays.',
      last_update_at: '2026-09-13T18:12:00Z', next_move: 'Pick a neighborhood.' }
  ]
};

function b64uDec(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array(Buffer.from(s, 'base64'));
}

function runPublish(state) {
  const dir = mkdtempSync(join(tmpdir(), 'hunch-test-'));
  const statePath = join(dir, 'state.json');
  writeFileSync(statePath, JSON.stringify(state));
  const out = execFileSync('node', [PUBLISH, statePath, dir, '--base-url', 'https://hunch.example'], { encoding: 'utf8' });
  return { dir, result: JSON.parse(out) };
}

test('publishes a snapshot that the printed link key can open', async () => {
  const { dir, result } = runPublish(STATE);
  assert.equal(result.wrote, join(dir, 'snapshot.enc'));
  assert.equal(result.published_at, STATE.generated_at);
  assert.match(result.dashboard_link, /^https:\/\/hunch\.example\/#k=[A-Za-z0-9_-]{40,50}$/);
  const env = JSON.parse(readFileSync(join(dir, 'snapshot.enc'), 'utf8'));
  assert.equal(env.v, 1);
  assert.equal(env.alg, 'AES-256-GCM');
  const key = await webcrypto.subtle.importKey(
    'raw', b64uDec(result.dashboard_link.split('#k=')[1]), { name: 'AES-GCM' }, false, ['decrypt']);
  const pt = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64uDec(env.iv) }, key, b64uDec(env.ct));
  assert.deepEqual(JSON.parse(new TextDecoder().decode(pt)), STATE);
});

test('every publish mints a fresh key, so old links die on rotation', async () => {
  const first = runPublish(STATE);
  const second = runPublish(STATE);
  assert.notEqual(first.result.dashboard_link, second.result.dashboard_link);
  // the first key must not open the second snapshot
  const env = JSON.parse(readFileSync(join(second.dir, 'snapshot.enc'), 'utf8'));
  const oldKey = await webcrypto.subtle.importKey(
    'raw', b64uDec(first.result.dashboard_link.split('#k=')[1]), { name: 'AES-GCM' }, false, ['decrypt']);
  await assert.rejects(
    webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: b64uDec(env.iv) }, oldKey, b64uDec(env.ct)));
});

test('rejects malformed state instead of publishing garbage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hunch-test-'));
  const bad = join(dir, 'bad.json');
  writeFileSync(bad, JSON.stringify({ projects: 'nope' }));
  assert.throws(() => execFileSync('node', [PUBLISH, bad, dir], { encoding: 'utf8', stdio: 'pipe' }));
  assert.equal(existsSync(join(dir, 'snapshot.enc')), false);
});

test('no partial file is left behind: snapshot.enc appears atomically', () => {
  const { dir } = runPublish(STATE);
  assert.equal(existsSync(join(dir, '.snapshot.enc.tmp')), false);
  assert.equal(existsSync(join(dir, 'snapshot.enc')), true);
});
