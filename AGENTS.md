# Agent operating rules

Read `README.md`, `PROJECT_STATE.md`, and `CONTRIBUTING.md` before editing.

Work only inside this repository unless a human explicitly assigns a separate repository. Use test-first development for behavior changes and run `npm test` before reporting completion.

Do not access, copy, request, store, log, or transmit credentials or wallet secrets. Do not create invoices, make payments, sign or broadcast transactions, burn bitcoin, submit acceleration, modify protected Proof of Nonsense runtime state, or publish/deploy without explicit human authorization.

Keep component boundaries intact:

- Proof of Nonsense owns paid audio and Glimpse narration.
- Electrum Accelerator owns transaction-local acceleration UX.
- Flame work remains draft-safe and read-only unless upstream production rules and a new human authorization exist.
- This repository owns only the shared case schema, demo surface, evidence map, and run-of-show.

Treat `cases/flame-demo-1.json` as public fixture data. Never replace it with real wallet or customer data. Facts must remain deterministic; jokes must remain visibly fictional.

Before merging, state exactly which integrations were live, mocked, simulated, fixture-backed, or pre-rendered.
