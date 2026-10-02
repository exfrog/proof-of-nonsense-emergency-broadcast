import { buildBroadcast, validateCase } from './broadcast.mjs';

const status = document.querySelector('#status');
const stage = document.querySelector('#stage');
const button = document.querySelector('#broadcast');

async function loadCase() {
  const response = await fetch('./cases/flame-demo-1.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`fixture request failed: ${response.status}`);
  const caseFile = await response.json();
  const errors = validateCase(caseFile);
  if (errors.length) throw new Error(errors.join('; '));
  return caseFile;
}

function render(caseFile) {
  const broadcast = buildBroadcast(caseFile);
  stage.replaceChildren();

  const headline = document.createElement('h2');
  headline.textContent = broadcast.headline;
  stage.append(headline);

  for (const item of [...broadcast.facts, ...broadcast.jokes]) {
    const row = document.createElement('p');
    row.className = item.kind;
    row.textContent = `${item.kind === 'fact' ? 'VERIFIED FACT' : 'AUTHORIZED NONSENSE'}: ${item.text}`;
    stage.append(row);
  }

  const signoff = document.createElement('strong');
  signoff.textContent = broadcast.signoff;
  stage.append(signoff);
  status.textContent = 'Broadcast complete. No consequential action occurred.';
}

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Checking the safety interlocks…';
  try {
    render(await loadCase());
  } catch (error) {
    status.textContent = `Broadcast refused: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});
