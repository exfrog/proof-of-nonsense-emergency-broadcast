import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildBroadcast, buildPipeline, getTranscript, validateCase } from '../src/broadcast.mjs';

const fixturePath = new URL('../cases/flame-demo-1.json', import.meta.url);

async function fixture() {
  return JSON.parse(await readFile(fixturePath, 'utf8'));
}

test('the fixture exposes concrete evidence for every broadcast stage', async () => {
  const caseFile = await fixture();
  assert.deepEqual(validateCase(caseFile), []);

  const pipeline = buildPipeline(caseFile);
  assert.deepEqual(pipeline.map((stage) => stage.id), ['glimpse', 'flame', 'accelerator', 'newsroom', 'broadcast']);
  assert.deepEqual(pipeline.map((stage) => stage.state), ['FIXTURE', 'DRAFT', 'SIMULATED', 'FIXTURE', 'READY']);
  assert.match(pipeline[0].detail, /Bitcoin.*Oct/i);
  assert.match(pipeline[1].detail, /2,100 sats/);
  assert.match(pipeline[2].detail, /4,200 sats/);
});

test('English and German transcripts preserve fact and joke separation', async () => {
  const caseFile = await fixture();
  for (const language of ['en', 'de']) {
    const transcript = getTranscript(caseFile, language);
    assert.equal(transcript.language, language);
    assert.equal(transcript.facts.length, 3);
    assert.equal(transcript.jokes.length, 3);
    assert.equal(transcript.facts.every((item) => item.kind === 'fact'), true);
    assert.equal(transcript.jokes.every((item) => item.kind === 'joke'), true);
  }

  const broadcast = buildBroadcast(caseFile, 'de');
  assert.equal(broadcast.language, 'de');
  assert.match(broadcast.signoff, /Bitcoin/i);
});

test('validation rejects every malformed field consumed by the renderer', async () => {
  const base = await fixture();
  const mutations = [
    (value) => { delete value.comedy; },
    (value) => { value.comedy.en = 'not-an-array'; },
    (value) => { value.comedy.de[0] = null; },
    (value) => { value.market.question = ''; },
    (value) => { value.market.probability_percent = 101; },
    (value) => { value.flame.display_value_sats = -1; },
    (value) => { value.accelerator.estimated_bid_sats = 1.5; },
    (value) => { value.integrations[0].state = 'MAGIC'; },
    (value) => { value.integrations[2].state = 'LIVE'; },
    (value) => { value.market.snapshot_at = 'October 3, 2026'; },
    (value) => { value.market.source_url = 'https://attacker.example/fake'; },
    (value) => { value.raw_transaction = '00'; },
    (value) => { value.market.extra = 'unexpected'; },
    (value) => { value.comedy.en[0] = 'bc1q000000000000000000000000000000000000000'; },
  ];

  for (const mutate of mutations) {
    const caseFile = structuredClone(base);
    mutate(caseFile);
    assert.notDeepEqual(validateCase(caseFile), []);
  }
});

test('pipeline and transcript builders fail closed for invalid cases', async () => {
  const caseFile = await fixture();
  caseFile.safety.burn_enabled = true;
  assert.throws(() => buildPipeline(caseFile), /unsafe safety flag/);
  assert.throws(() => getTranscript(caseFile, 'en'), /unsafe safety flag/);
  const safeCase = await fixture();
  assert.throws(() => getTranscript(safeCase, 'fr'), /unsupported language/);
});
