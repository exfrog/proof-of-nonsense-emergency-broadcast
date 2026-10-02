const REQUIRED_SAFE_FLAGS = {
  simulated: true,
  unsigned: true,
  payment_requested: false,
  burn_enabled: false,
  acceleration_submitted: false,
};

export function validateCase(caseFile) {
  const errors = [];
  if (!caseFile || typeof caseFile !== 'object' || Array.isArray(caseFile)) return ['case must be an object'];
  if (caseFile.schema_version !== 1) errors.push('unsupported case schema');
  if (caseFile.id !== 'flame-demo-1') errors.push('fixture id is not allowlisted');
  for (const [name, required] of Object.entries(REQUIRED_SAFE_FLAGS)) {
    if (caseFile.safety?.[name] !== required) {
      errors.push(name === 'simulated' ? 'demo case must be simulated' : `unsafe safety flag: ${name}`);
    }
  }
  if (!Array.isArray(caseFile.market?.facts) || caseFile.market.facts.length !== 3) {
    errors.push('exactly three frozen market facts are required');
  }
  if (Array.isArray(caseFile.market?.facts)
      && !Array.from(caseFile.market.facts).every(isNonBlankText)) {
    errors.push('market facts must be non-blank strings');
  }
  if (!Array.isArray(caseFile.comedy?.lines) || caseFile.comedy.lines.length === 0) {
    errors.push('at least one comedy line is required');
  } else if (!Array.from(caseFile.comedy.lines).every(isNonBlankText)) {
    errors.push('comedy lines must be non-blank strings');
  }
  return errors;
}

function isNonBlankText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildBroadcast(caseFile) {
  const errors = validateCase(caseFile);
  if (errors.length) throw new Error(errors.join('; '));
  return {
    headline: 'BITCOIN EMERGENCY BROADCAST — CONSENSUS: VIBES PENDING',
    facts: caseFile.market.facts.map((text) => ({ kind: 'fact', text })),
    jokes: caseFile.comedy.lines.map((text) => ({ kind: 'joke', text })),
    signoff: 'No bitcoin was burned, accelerated, or given to a goblin during this broadcast.',
  };
}
