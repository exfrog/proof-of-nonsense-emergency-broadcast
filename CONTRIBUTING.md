# Collaboration rules

This is a hackathon integration shell spanning Bitcoin payment and wallet projects. Keep work fast, visible, and reversible.

## Branch and review workflow

1. Start from current `main`.
2. Create a focused branch: `feat/<name>`, `fix/<name>`, or `docs/<name>`.
3. Keep one concern per commit.
4. Open a pull request describing what is live, simulated, fixture-backed, or pre-rendered.
5. Another human or agent reviews before merge when time permits.
6. Never force-push shared branches or rewrite another collaborator's commits.

## Required checks

```bash
npm test
```

For UI work, also run the local server and exercise the full case:

```bash
npm run serve
```

## Boundaries

- Never commit credentials, bearer capabilities, invoices, payment hashes, preimages, seeds, private keys, xpubs, wallet labels, raw transactions, addresses, or private transaction identifiers.
- Do not call live payment, burn, broadcast, signing, or acceleration endpoints from this repository.
- Do not weaken Proof of Nonsense's payment-before-generation state machine.
- Keep Proof of Nonsense, Electrum Accelerator, and Flame release pipelines separate.
- Shared case files contain allowlisted public/fixture metadata only.
- Label all simulated, draft, local-devnet, and pre-rendered states.
- Do not claim sponsor integration or challenge eligibility without runnable evidence.

## Human authority

Humans approve publication, collaborator access, live API calls, financial operations, hackathon submission, and challenge selections. Agent-generated changes should be identified in the pull request.
