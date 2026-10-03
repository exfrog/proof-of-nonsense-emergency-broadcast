import { buildBroadcast, buildPipeline, validateCase } from './broadcast.mjs';

const status = document.querySelector('#status');
const stage = document.querySelector('#stage');
const button = document.querySelector('#broadcast');
const pipelineElement = document.querySelector('#pipeline');
const pipelineSection = document.querySelector('#pipeline-section');
const safetyRibbon = document.querySelector('#safety-ribbon');
const broadcastTitle = document.querySelector('#broadcast-title');
const factsElement = document.querySelector('#facts');
const jokesElement = document.querySelector('#jokes');
const telemetryElement = document.querySelector('#telemetry');
const signoffElement = document.querySelector('#signoff');
const languageButtons = [...document.querySelectorAll('[data-language]')];

let caseFile;
let activeLanguage = 'en';

async function loadCase() {
  const response = await fetch('./cases/flame-demo-1.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('The approved demo fixture could not be loaded.');
  const candidate = await response.json();
  const errors = validateCase(candidate);
  if (errors.length) throw new Error('The approved demo fixture failed its safety checks.');
  return candidate;
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function hydratePipeline() {
  const pipeline = buildPipeline(caseFile);
  for (const item of pipeline) {
    const row = pipelineElement.querySelector(`[data-stage="${item.id}"]`);
    row.querySelector('b').textContent = item.label;
    row.querySelector('.detail').textContent = item.detail;
    row.querySelector('em').textContent = item.state;
  }
}

function renderTelemetry() {
  telemetryElement.replaceChildren();
  const items = [
    ['GLIMPSE FIXTURE', `${caseFile.market.probability_percent}%`, caseFile.market.question],
    ['FLAME DRAFT', `${caseFile.flame.display_value_sats.toLocaleString('en-US')} sats`, 'Unsigned · decode-only'],
    ['FEE AMBULANCE', `${caseFile.accelerator.estimated_bid_sats.toLocaleString('en-US')} sats`, 'Simulated · no invoice'],
  ];
  for (const [label, value, detail] of items) {
    const card = document.createElement('article');
    card.append(textElement('span', 'metric-label', label));
    card.append(textElement('strong', '', value));
    card.append(textElement('span', 'metric-detail', detail));
    telemetryElement.append(card);
  }
}

function renderTranscript(language) {
  const broadcast = buildBroadcast(caseFile, language);
  factsElement.lang = language;
  jokesElement.lang = language;
  signoffElement.lang = language;
  factsElement.replaceChildren(...broadcast.facts.map((item) => textElement('p', 'fact', item.text)));
  jokesElement.replaceChildren(...broadcast.jokes.map((item) => textElement('p', 'joke', item.text)));
  signoffElement.textContent = broadcast.signoff;
  for (const languageButton of languageButtons) {
    const selected = languageButton.dataset.language === language;
    languageButton.classList.toggle('active', selected);
    languageButton.setAttribute('aria-pressed', String(selected));
  }
  activeLanguage = language;
}

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function runSequence() {
  const pipeline = buildPipeline(caseFile);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pipelineElement.querySelectorAll('li').forEach((row) => row.classList.remove('active', 'complete'));
  stage.hidden = true;

  for (const [index, item] of pipeline.entries()) {
    const row = pipelineElement.querySelector(`[data-stage="${item.id}"]`);
    row.classList.add('active');
    status.textContent = `${index + 1} of ${pipeline.length}: ${item.label} — ${item.detail}`;
    if (!reducedMotion) await delay(360);
    row.classList.remove('active');
    row.classList.add('complete');
  }

  renderTelemetry();
  renderTranscript(activeLanguage);
  stage.hidden = false;
  button.textContent = 'REPLAY EMERGENCY BROADCAST';
  status.textContent = 'Broadcast complete. No consequential action occurred.';
  broadcastTitle.focus({ preventScroll: true });
  broadcastTitle.scrollIntoView({ block: 'start', behavior: 'auto' });
}

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Checking the safety interlocks…';
  try {
    await runSequence();
  } catch {
    status.textContent = 'Broadcast refused. The safe demo could not be completed.';
  } finally {
    button.disabled = false;
  }
});

for (const languageButton of languageButtons) {
  languageButton.addEventListener('click', () => renderTranscript(languageButton.dataset.language));
}

try {
  caseFile = await loadCase();
  hydratePipeline();
  safetyRibbon.hidden = false;
  pipelineSection.hidden = false;
  button.disabled = false;
  status.textContent = 'Safety interlocks armed. Public fixture loaded.';
} catch {
  status.textContent = 'Broadcast unavailable. The safe demo fixture did not pass validation.';
}
