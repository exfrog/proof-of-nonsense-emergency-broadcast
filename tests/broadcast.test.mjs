import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildBroadcast, validateCase } from '../src/broadcast.mjs';

const fixturePath = new URL('../cases/flame-demo-1.json', import.meta.url);

async function fixture() {
  return JSON.parse(await readFile(fixturePath, 'utf8'));
}

test('fixture is explicitly safe and contains no wallet identifiers', async () => {
  const caseFile = await fixture();
  assert.deepEqual(validateCase(caseFile), []);
  assert.equal(caseFile.safety.simulated, true);
  assert.equal(caseFile.safety.unsigned, true);
  assert.equal(caseFile.safety.payment_requested, false);

  const serialized = JSON.stringify(caseFile).toLowerCase();
  for (const forbidden of ['txid', 'raw_transaction', 'seed', 'xpub', 'private_key', 'wallet_label', 'invoice']) {
    assert.equal(serialized.includes(`\"${forbidden}\"`), false, forbidden);
  }
});

test('broadcast keeps facts deterministic and jokes visibly separate', async () => {
  const broadcast = buildBroadcast(await fixture());
  assert.match(broadcast.headline, /EMERGENCY BROADCAST/);
  assert.equal(broadcast.facts.length, 3);
  assert.equal(broadcast.facts.every((fact) => fact.kind === 'fact'), true);
  assert.equal(broadcast.jokes.every((joke) => joke.kind === 'joke'), true);
  assert.match(broadcast.signoff, /No bitcoin was burned, accelerated, or given to a goblin/);
});

test('unsafe cases fail closed', async () => {
  const caseFile = await fixture();
  caseFile.safety.simulated = false;
  assert.ok(validateCase(caseFile).includes('demo case must be simulated'));
});
