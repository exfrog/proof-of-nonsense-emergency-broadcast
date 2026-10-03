const REQUIRED_SAFE_FLAGS = {
  simulated: true,
  unsigned: true,
  payment_requested: false,
  burn_enabled: false,
  acceleration_submitted: false,
};

const CASE_ID = 'flame-demo-1';
const LANGUAGES = ['en', 'de'];
const EXPECTED_INTEGRATIONS = [
  { id: 'glimpse', label: 'Glimpse', state: 'FIXTURE' },
  { id: 'flame', label: 'Flame', state: 'DRAFT' },
  { id: 'accelerator', label: 'mempool.space', state: 'SIMULATED' },
  { id: 'newsroom', label: 'Proof of Nonsense', state: 'FIXTURE' },
  { id: 'broadcast', label: 'Emergency broadcast', state: 'READY' },
];

const SENSITIVE_VALUE_PATTERNS = [
  /\b[0-9a-f]{64}\b/i,
  /\bbc1[a-z0-9]{20,}\b/i,
  /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/,
  /\b(?:xpub|ypub|zpub|tpub)[1-9A-HJ-NP-Za-km-z]{40,}\b/,
  /\bln(?:bc|tb)[0-9a-z]{20,}\b/i,
  /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/,
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function rejectUnknown(errors, value, path, allowedKeys) {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) errors.push(`${path}.${key} is not allowed`);
  }
}

function rejectSensitiveValues(errors, value, path = 'case') {
  if (typeof value === 'string') {
    if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(`${path} contains a prohibited wallet or transaction identifier`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectSensitiveValues(errors, item, `${path}[${index}]`));
    return;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) rejectSensitiveValues(errors, item, `${path}.${key}`);
  }
}

function requireString(errors, value, path, maximum = 400) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum) {
    errors.push(`${path} must be a non-empty string no longer than ${maximum} characters`);
  }
}

function requireUrl(errors, value, path) {
  requireString(errors, value, path, 500);
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') errors.push(`${path} must use https`);
    } catch {
      errors.push(`${path} must be a valid URL`);
    }
  }
}

function requireInteger(errors, value, path, minimum, maximum) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    errors.push(`${path} must be an integer from ${minimum} through ${maximum}`);
  }
}

function requireLines(errors, value, path) {
  if (!Array.isArray(value) || value.length !== 3) {
    errors.push(`${path} must contain exactly three lines`);
    return;
  }
  value.forEach((line, index) => requireString(errors, line, `${path}[${index}]`, 500));
}

export function validateCase(caseFile) {
  const errors = [];
  if (!isRecord(caseFile)) return ['case must be an object'];

  rejectUnknown(errors, caseFile, 'case', [
    'schema_version', 'id', 'title', 'market', 'flame', 'accelerator',
    'proof_of_nonsense', 'comedy', 'integrations', 'safety',
  ]);
  if (caseFile.schema_version !== 2) errors.push('unsupported case schema');
  if (caseFile.id !== CASE_ID) errors.push('fixture id is not allowlisted');
  requireString(errors, caseFile.title, 'title', 120);

  rejectUnknown(errors, caseFile.safety, 'safety', Object.keys(REQUIRED_SAFE_FLAGS));
  for (const [name, required] of Object.entries(REQUIRED_SAFE_FLAGS)) {
    if (caseFile.safety?.[name] !== required) {
      errors.push(name === 'simulated' ? 'demo case must be simulated' : `unsafe safety flag: ${name}`);
    }
  }

  if (!isRecord(caseFile.market)) {
    errors.push('market must be an object');
  } else {
    rejectUnknown(errors, caseFile.market, 'market', [
      'provider', 'source_url', 'snapshot_kind', 'question', 'snapshot_at',
      'probability_percent', 'facts',
    ]);
    rejectUnknown(errors, caseFile.market.facts, 'market.facts', LANGUAGES);
    requireString(errors, caseFile.market.provider, 'market.provider', 80);
    if (caseFile.market.provider !== 'Glimpse') errors.push('market.provider must be Glimpse');
    requireUrl(errors, caseFile.market.source_url, 'market.source_url');
    if (caseFile.market.source_url !== 'https://www.glimpse.trading/') errors.push('market.source_url is not allowlisted');
    requireString(errors, caseFile.market.snapshot_kind, 'market.snapshot_kind', 80);
    if (caseFile.market.snapshot_kind !== 'frozen-public-demo-fixture') errors.push('market.snapshot_kind is unsupported');
    requireString(errors, caseFile.market.question, 'market.question', 300);
    requireString(errors, caseFile.market.snapshot_at, 'market.snapshot_at', 40);
    if (typeof caseFile.market.snapshot_at === 'string') {
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
      const parsed = new Date(caseFile.market.snapshot_at);
      if (!isoPattern.test(caseFile.market.snapshot_at)
          || Number.isNaN(parsed.getTime())
          || parsed.toISOString() !== caseFile.market.snapshot_at.replace('Z', '.000Z')) {
        errors.push('market.snapshot_at must be a normalized ISO-8601 UTC timestamp');
      }
    }
    requireInteger(errors, caseFile.market.probability_percent, 'market.probability_percent', 0, 100);
    for (const language of LANGUAGES) requireLines(errors, caseFile.market.facts?.[language], `market.facts.${language}`);
  }

  if (!isRecord(caseFile.flame)) {
    errors.push('flame must be an object');
  } else {
    rejectUnknown(errors, caseFile.flame, 'flame', ['status', 'draft_pull_request', 'operation', 'display_value_sats']);
    requireString(errors, caseFile.flame.status, 'flame.status', 80);
    if (caseFile.flame.status !== 'unmerged-draft') errors.push('flame.status must be unmerged-draft');
    requireUrl(errors, caseFile.flame.draft_pull_request, 'flame.draft_pull_request');
    if (caseFile.flame.draft_pull_request !== 'https://github.com/runflame/flame-lib/pull/14') errors.push('flame.draft_pull_request is not allowlisted');
    if (caseFile.flame.operation !== 'decode-only') errors.push('flame.operation must be decode-only');
    requireInteger(errors, caseFile.flame.display_value_sats, 'flame.display_value_sats', 0, 21_000_000 * 100_000_000);
  }

  if (!isRecord(caseFile.accelerator)) {
    errors.push('accelerator must be an object');
  } else {
    rejectUnknown(errors, caseFile.accelerator, 'accelerator', ['mode', 'provider', 'source_url', 'estimated_bid_sats']);
    if (caseFile.accelerator.mode !== 'simulation') errors.push('accelerator.mode must be simulation');
    requireString(errors, caseFile.accelerator.provider, 'accelerator.provider', 80);
    if (caseFile.accelerator.provider !== 'mempool.space') errors.push('accelerator.provider must be mempool.space');
    requireUrl(errors, caseFile.accelerator.source_url, 'accelerator.source_url');
    if (caseFile.accelerator.source_url !== 'https://mempool.space/docs/api/rest') errors.push('accelerator.source_url is not allowlisted');
    requireInteger(errors, caseFile.accelerator.estimated_bid_sats, 'accelerator.estimated_bid_sats', 0, 21_000_000 * 100_000_000);
  }

  if (!isRecord(caseFile.proof_of_nonsense)) {
    errors.push('proof_of_nonsense must be an object');
  } else {
    rejectUnknown(errors, caseFile.proof_of_nonsense, 'proof_of_nonsense', ['presenter', 'languages', 'audio_status']);
    requireString(errors, caseFile.proof_of_nonsense.presenter, 'proof_of_nonsense.presenter', 80);
    requireString(errors, caseFile.proof_of_nonsense.audio_status, 'proof_of_nonsense.audio_status', 100);
    if (JSON.stringify(caseFile.proof_of_nonsense.languages) !== JSON.stringify(LANGUAGES)) {
      errors.push('proof_of_nonsense.languages must be ["en","de"]');
    }
  }

  if (!isRecord(caseFile.comedy)) {
    errors.push('comedy must be an object');
  } else {
    rejectUnknown(errors, caseFile.comedy, 'comedy', LANGUAGES);
    for (const language of LANGUAGES) requireLines(errors, caseFile.comedy[language], `comedy.${language}`);
  }

  if (!Array.isArray(caseFile.integrations) || caseFile.integrations.length !== EXPECTED_INTEGRATIONS.length) {
    errors.push('integrations must describe exactly five stages');
  } else {
    caseFile.integrations.forEach((integration, index) => {
      if (!isRecord(integration)) {
        errors.push(`integrations[${index}] must be an object`);
        return;
      }
      rejectUnknown(errors, integration, `integrations[${index}]`, ['id', 'label', 'state']);
      const expected = EXPECTED_INTEGRATIONS[index];
      if (integration.id !== expected.id) errors.push(`integrations[${index}].id must be ${expected.id}`);
      requireString(errors, integration.label, `integrations[${index}].label`, 80);
      if (integration.label !== expected.label) errors.push(`integrations[${index}].label must be ${expected.label}`);
      if (integration.state !== expected.state) errors.push(`integrations[${index}].state must be ${expected.state}`);
    });
  }

  rejectSensitiveValues(errors, caseFile);
  return errors;
}

function assertValid(caseFile) {
  const errors = validateCase(caseFile);
  if (errors.length) throw new Error(errors.join('; '));
}

function formatSats(value) {
  return `${new Intl.NumberFormat('en-US').format(value)} sats`;
}

export function getTranscript(caseFile, language = 'en') {
  assertValid(caseFile);
  if (!LANGUAGES.includes(language)) throw new Error(`unsupported language: ${language}`);
  return {
    language,
    facts: caseFile.market.facts[language].map((text) => ({ kind: 'fact', text })),
    jokes: caseFile.comedy[language].map((text) => ({ kind: 'joke', text })),
  };
}

export function buildPipeline(caseFile) {
  assertValid(caseFile);
  const details = {
    glimpse: `${caseFile.market.question} ${caseFile.market.probability_percent}% at ${caseFile.market.snapshot_at}.`,
    flame: `${formatSats(caseFile.flame.display_value_sats)} decoded from an unsigned ${caseFile.flame.status} fixture.`,
    accelerator: `${formatSats(caseFile.accelerator.estimated_bid_sats)} simulated estimate; no invoice or network request.`,
    newsroom: `${caseFile.proof_of_nonsense.presenter}; English and German deterministic scripts; audio asset pending.`,
    broadcast: 'Safety interlocks passed. Broadcast ready; no consequential action enabled.',
  };
  return caseFile.integrations.map((integration) => ({ ...integration, detail: details[integration.id] }));
}

export function buildBroadcast(caseFile, language = 'en') {
  const transcript = getTranscript(caseFile, language);
  return {
    headline: 'BITCOIN EMERGENCY BROADCAST — CONSENSUS: VIBES PENDING',
    ...transcript,
    signoff: language === 'de'
      ? 'Kein Bitcoin wurde für diese Sendung verbrannt, beschleunigt oder einem Goblin übergeben.'
      : 'No bitcoin was burned, accelerated, or given to a goblin during this broadcast.',
  };
}
