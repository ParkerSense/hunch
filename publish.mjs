#!/usr/bin/env node
// Hunch encrypted-snapshot publisher (default backend).
//
// Reads a state JSON file ({generated_at, projects[]}), encrypts it with a
// fresh random AES-256-GCM key, and writes snapshot.enc next to the Hunch
// page on any static host. The decryption key is printed exactly once, as
// part of the dashboard link: it travels only in the URL fragment (#k=...),
// which browsers never send to any server.
//
//   node publish.mjs state.json ./site-dir [--base-url https://hunch.example]
//
// The printed link is a password. Deliver it to the owner, do not store it
// in the repo, notes, logs, or tickets. Rotating the key = publish again and
// deliver the new link; old links stop working immediately.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { webcrypto } from 'node:crypto';
const { subtle } = webcrypto;

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base-url');
const baseUrl = baseIdx >= 0 ? args.splice(baseIdx, 2)[1] : null;
const [statePath, siteDir] = args;
if (!statePath || !siteDir) {
  console.error('usage: publish.mjs <state.json> <site-dir> [--base-url https://hunch.example]');
  process.exit(1);
}
if (!existsSync(siteDir)) { console.error('site dir not found: ' + siteDir); process.exit(1); }

let state;
try { state = JSON.parse(readFileSync(statePath, 'utf8')); }
catch (e) { console.error('cannot read state file ' + statePath + ': ' + e.message); process.exit(1); }
if (!state.generated_at || !Array.isArray(state.projects)) {
  console.error('state must look like {"generated_at": "...", "projects": [...]}');
  process.exit(1);
}

const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
const iv = webcrypto.getRandomValues(new Uint8Array(12));
const pt = new TextEncoder().encode(JSON.stringify(state));
const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, pt);
const rawKey = new Uint8Array(await subtle.exportKey('raw', key));
const b64u = (u8) => Buffer.from(u8).toString('base64url');

const envelope = JSON.stringify({
  v: 1,
  alg: 'AES-256-GCM',
  published_at: state.generated_at,
  iv: b64u(new Uint8Array(iv)),
  ct: b64u(new Uint8Array(ct))
});
const tmp = join(siteDir, '.snapshot.enc.tmp');
writeFileSync(tmp, envelope);
renameSync(tmp, join(siteDir, 'snapshot.enc')); // atomic: readers never see a partial file

const link = (baseUrl ? baseUrl.replace(/\/+$/, '') : '<your-hunch-url>') + '/#k=' + b64u(rawKey);
console.log(JSON.stringify({
  wrote: join(resolve(siteDir), 'snapshot.enc'),
  bytes: envelope.length,
  published_at: state.generated_at,
  dashboard_link: link,
  warning: 'The link is the password. Deliver it to the owner; never commit, log, or store it. Republish to rotate.'
}, null, 2));
