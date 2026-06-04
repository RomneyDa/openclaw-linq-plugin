# Linq Plugin Upgrade Plan

## Snapshot

Current PR: `linq-team/openclaw-linq-plugin#5`

Focus: core contract support with a narrow config surface.

Includes:

- SecretRef-aware credential resolution with legacy compatibility.
- Minimal Linq config and manifest schema.
- Explicit target grammar for phone, chat, group-reserved, and account-scoped sends.
- First-contact phone sends and existing-chat sends.
- Pure webhook handler with signature, replay, size, JSON, and `event_id` dedupe handling.
- Corrected capability claims: direct chat and media only.
- Pairing approval notification.
- Focused tests and package gates.

Not in the current PR:

- Extra public config knobs.
- Durable host-backed webhook dedupe.
- Modern durable message adapter/receipt integration.
- Real group routing or rich Linq actions.
- Full customer docs.

## Future Stages

1. Extra configuration options.
   - Stacked PR: `RomneyDa/openclaw-linq-plugin#1`
   - Adds optional webhook tuning and reserved advanced config fields.

2. Durable messaging and operability.
   - Add durable `MessageReceipt` support, host-backed webhook dedupe, stronger media handling, and better status/doctor output.

3. Groups, rich actions, and docs.
   - Implement group routing/policies, reactions/replies/effects/typing/edit/unsend where proven, then write full customer docs.

## Current PR Details

Branch: `linq-core-contract-upgrade`

PR: `https://github.com/linq-team/openclaw-linq-plugin/pull/5`

Verification: `npm run check`

Minimal public config surface:

- `enabled`
- `name`
- `apiToken`
- `apiTokenRef`
- `tokenFile`
- `fromPhone`
- `dmPolicy`
- `allowFrom`
- `webhookUrl`
- `webhookSecret`
- `webhookSecretRef`
- `webhookPath`
- `webhookHost`
- `accounts`
- `defaultAccount`

Current PR implementation notes:

- `LINQ_API_TOKEN` remains supported for the default account.
- `apiToken` and `webhookSecret` accept either plaintext strings or SecretRef objects; `apiTokenRef` and `webhookSecretRef` remain accepted aliases.
- `tokenFile` remains supported for compatibility.
- The webhook runtime uses fixed internal defaults for max body size, replay window, and dedupe TTL.
- `linq:group:<chat_id>` is parsed as a reserved target form, but group sends are rejected and group capability is not advertised.
- Existing typed placeholders that predated this work are left intact, but new schema/manifest knobs are not added in PR #5.

## Stage 1 Details: Extra Configuration Options

Branch: `linq-extra-configuration-options`

PR: `https://github.com/RomneyDa/openclaw-linq-plugin/pull/1`

Base: `linq-core-contract-upgrade`

Verification: `npm run check`

Adds public schema/manifest fields:

- `groupPolicy`
- `mediaMaxMb`
- `textChunkLimit`
- `webhookMaxBytes`
- `webhookReplayWindowSeconds`
- `webhookDedupeTtlMs`
- `blockStreaming`
- `groups`

Runtime wiring:

- `webhookMaxBytes`
- `webhookReplayWindowSeconds`
- `webhookDedupeTtlMs`

## Stage 2 Details: Durable Messaging And Operability

Goals:

- Add `message: defineChannelMessageAdapter(...)`.
- Return durable message receipts with Linq `chat_id`, `message_id`, channel, account/line, and trace id when available.
- Persist webhook dedupe through host KV/shared SQLite when available.
- Enforce media limits consistently.
- Support hydrated OpenClaw media payloads if the Linq API path is confirmed.
- Improve status/doctor output for configured lines, token validity, webhook listener state, last inbound/outbound, and last rate-limit/API error.
- Verify Linq API endpoints and response shapes against current docs or a live sandbox.

## Stage 3 Details: Groups, Rich Actions, And Docs

Groups:

- Route group `chat_id` as a stable group peer.
- Preserve sender identity inside group envelopes.
- Enforce group policies and mention gating.
- Add per-group tool policy if supported by OpenClaw contracts.

Rich Linq actions:

- Reactions.
- Native replies.
- Effects.
- Typing controls.
- Edit/unsend.
- Contact cards.
- Capability checks.

Docs:

- Rewrite README with requirements, install, setup, SecretRef setup, webhook exposure, target grammar, policies, media behavior, supported actions, status/probe, troubleshooting, rate-limit notes, and known limitations.
