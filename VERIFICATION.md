# Linq plugin verification

Verification on 2026-11-02 uses the published **OpenClaw 2026.10.9** npm
package (release build `8b18b55`) with Node **26.12.1**. npm's `latest` tag
and the upstream GitHub latest stable release both selected 2026.10.9.
The starting repairs are `db0ad3531e4331f06ab42c2b26b8cc2d29cba324`.

## Automated evidence

- Typecheck, 63 tests across 16 files, and compiled build pass.
- The released host loader verifies runtime registration, cold setup and
  pre-runtime SecretRef discovery/materialization.
- Signed HTTP admission waits for SQLite persistence; duplicate admission,
  process exit before completion, recovery in a new process and completed-event
  replay suppression pass.
- Host pairing, allowlist, open and disabled sender decisions pass.
- A real isolated Gateway receives signed synthetic text/photo webhooks,
  routes authorized messages through the agent/model pipeline, supplies image
  bytes to a deterministic model, and sends automatic replies through the
  durable message adapter to a simulated Linq API. Unsigned requests are
  rejected, and replayed/denied text messages do not invoke the model or send.
- Incoming-media regressions cover download after authorization, bounded HTTPS
  staging, local media facts and failed staging without agent dispatch.
- Existing fixtures cover outgoing media upload, quoted replies, best-effort
  presence, rate limits, ambiguous outcomes, storage failures and account scope.

`npm run check` runs these checks. The Gateway fixture replaces provider
requests and the attachment response; it does not contact a real Linq account
and cannot prove provider transport or phone delivery. It uses a test-only
fetch injection marker supported by the host's mocked-fetch boundary.

The actual tarball is installed with the released CLI into a separate state/config
directory. Both integration harnesses also support `LINQ_PACKAGE_ROOT` to
verify this installed artifact, with no normal Gateway configuration changes.

## Defect found during this verification

Incoming attachments previously entered the host context as URL-only facts.
The real Gateway reported that media could not be staged without a path, and
the model received no image bytes despite producing a reply. The plugin now
downloads authorized attachments with the public SDK's SSRF-guarded media
store, a 100 MiB per-file limit and a 30-second deadline, and passes local
paths to the host. Staging failures retain the event for durable retry and
use a generic error to avoid exposing attachment URLs. The Gateway image-byte
assertion failed before this change and passes after it.

## Live evidence still required

The sandbox expired before account-backed testing on 2026.10.9. Live testing
is on hold at the operator's request until renewed access is available.
No subscription or tunnel was created and no live message was sent in this
verification session. No handset delivery, incoming provider webhook, live
automatic reply, transport selection or visible typing/read behavior is claimed.

After renewal, confirm provisioning and existing subscriptions, create only a
test-owned phone-scoped subscription to a route-only HTTPS proxy, verify the
running Gateway and signature rejection, then coordinate a real text/photo
and handset reply check. Record the provider's actual SMS/iMessage/RCS service
separately from handset confirmation. Test text/media/quoted replies and
presence proportionately, and remove only test-owned resources afterward.

Earlier API acceptance and synthetic tests from older hosts are background,
not current-release live proof. A draft PR must remain pending this live gate.
