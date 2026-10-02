# Buzz collaboration environment

## Goal

Create one Buzz room where Paul, Murphy, Paul's Hermes agent, and Murphy's agent can collaborate on the Emergency Broadcast project with separate identities and an auditable shared history.

## Fastest path: join Murphy's existing relay

Ask Murphy for:

1. The Buzz community invite or exact relay URL (`wss://...`).
2. Whether membership is closed and, if so, how he wants each human and agent identity admitted.
3. A project channel for this repository.
4. Whether his relay is meant to run agents, or only human desktop clients.

Each human should join with their own Buzz identity. Each agent should receive a separate Nostr keypair and scoped channel membership; never share a human or relay private key.

Buzz's ACP harness supports any stdio ACP agent and lists Hermes Agent as a preset. The intended bridge is:

```text
Buzz relay → buzz-acp → hermes acp
```

We must verify this exact combination against Murphy's relay before treating it as working. Start with owner-only or an explicit human-public-key allowlist, one project channel, one agent worker, no heartbeat, and no consequential automation.

## Our relay: feasible, not yet deployed

The current VPS has sufficient trial capacity (2 vCPU, 15 GiB RAM, and ample disk), but Docker and Docker Compose are not currently installed. The official single-node bundle runs Buzz Relay plus Postgres, Redis, MinIO, and a git-data volume.

Before deployment, decide:

- private Tailscale-only experiment vs public TLS relay;
- permanent relay URL/domain (the URL is part of community identity and should be fixed before onboarding);
- owner identity and secure backup location;
- who administers membership;
- backup destination for relay key, Postgres, object storage, git volume, and owner key;
- whether agents run on the relay VPS or on each owner's machine.

Recommended sequence:

1. Join and test Murphy's relay first.
2. Verify two human identities in one project channel.
3. Add Paul's Hermes identity through `buzz-acp` + `hermes acp` with owner-only/allowlist input.
4. Confirm mention, reply, cancellation, attribution, and reconnect behavior.
5. Only then deploy our own relay if it adds resilience or autonomy.
6. For our relay, pin a Buzz image tag/digest rather than tracking `main`, configure TLS, keep dependencies private behind the compose network, and establish backups before inviting collaborators.

## Security boundaries

- Relay, owner, each human, and each agent get different keypairs.
- Never commit or paste Nostr secret keys into GitHub, Telegram, Buzz chat, logs, or issue trackers.
- No open `respond-to anyone` agent during initial setup.
- No payment, signing, broadcast, burn, acceleration, deployment, or repository-write automation from Buzz until separately reviewed and authorized.
- Start agents in a project-scoped checkout/worktree with least privilege.
- Preserve GitHub as the canonical code host during the experiment; Buzz is the shared collaboration room.

## Authoritative references

- Buzz repository and architecture: https://github.com/block/buzz
- Buzz ACP harness: https://github.com/block/buzz/blob/main/crates/buzz-acp/README.md
- Official Compose deployment: https://github.com/block/buzz/blob/main/deploy/compose/README.md
- Official self-hosting guide: https://engineering.block.xyz/blog/run-your-own-buzz-relay
- Hermes ACP command: run `hermes acp --help` on the agent host.
