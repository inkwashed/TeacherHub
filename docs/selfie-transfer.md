# Use Selfie: receiver implementation and Let’s EiGo! sender handoff

## Status and scope

Teacher Tools implements the receiver, strict v1 validation, a bundled local renderer, editable-choice persistence, and backup support. On November 14, 2026, the public Let’s EiGo! transfer/config scripts were checked and matched the ActivityHub reference source. The sender sends a direct avatar choice map, whereas the original receiver expected a versioned avatar wrapper; this mismatch caused the reported unsupported-selfie error. The transfer-only normalizer now accepts either exact format and produces the existing canonical `{schemaVersion:1, choices}` record. Stored profiles and backups still require that canonical shape. Custom-photo import is not supported.

There are no accounts, database, cloud uploads, background requests, or synchronization. Clicking **Use Selfie** explicitly opens one popup. The sender must require **Use this selfie** before sending avatar choices. Later editor changes never modify the Teacher Tools copy without another explicit update.

The owner confirmed the following non-www origin and proposed new route in this chat on November 11, 2026. The repository's `ActivityHub/CNAME` also says `letseigo.com`.

| Setting | Value |
| --- | --- |
| Canonical sender origin | `https://letseigo.com` |
| Agreed new sender URL | `https://letseigo.com/apps/avatar/transfer.html` |
| Production receiver origin | `https://tools.letseigo.com` |
| Explicit local receiver for development | `http://localhost:8765` |
| `www` aliases | Not trusted; they are different origins |

`assets/js/selfie/transfer-config.js` owns the exact sender URL, trusted sender origins, allowed receiver origins, and 120-second timeout. Other preview origins require an intentional configuration change. `file://` has an opaque origin and does not support transfer; existing saved avatars still render locally. The future subdomain's local-data migration is a separate task. No domains or deployment configuration were changed here.

## Opening the sender

The receiver creates a fresh cryptographically random 128-bit request ID for every click, then opens:

```text
https://letseigo.com/apps/avatar/transfer.html?requestId=<32 lowercase hex characters>&receiverOrigin=http%3A%2F%2Flocalhost%3A8765
```

In production `receiverOrigin` is `https://tools.letseigo.com`. The window gets a unique name and a suggested 480×640 size. `window.opener` is required for the protocol, so this particular popup must not use `noopener`. The sender's headers must not sever the opener relationship (for example, with incompatible Cross-Origin-Opener-Policy settings); verify this on the deployed sites. The receiver sends no initial data message. The only query values Teacher Tools adds are request ID and receiver origin: no names, classes, students, profile image, or other saved data.

The receiver-origin query is a **routing hint, never authorization**. The sender must maintain its own independent exact-origin allowlist. Production should allow `https://tools.letseigo.com`; include `http://localhost:8765` only in an explicitly enabled development setup. Never trust arbitrary query parameters, `document.referrer`, a suffix match, or `"*"`. There must be a live opener before enabling confirmation.

## Current sender format and normalization

The deployed sender uses the same four envelope fields shown below, but its
`avatar` value is the direct choice map (the contents of `choices` in the
versioned example). `TeacherToolsSelfieSchema.normalizeTransfer` accepts this
exact map or the original versioned wrapper. Both paths run the same catalog,
field, color and unknown-key checks; there is no arbitrary SVG/photo import or
relaxed backup validator. The Profile transfer callback uses this adapter.
Origin, popup source, request ID, protocol version, transaction/rollback and ACK
checks are unchanged. The current catalog matches the sender configuration, so
no artwork or renderer changes were needed.

The actual sender hardcodes the production receiver origin. Real imports from
local HTTP previews therefore still need sender-side development-origin support;
Teacher Tools' existing fixture tests exercise local receiver behavior separately.
No ActivityHub files or deployed sites were modified for this fix.

`check_selfie_transfer.cjs` tests canonical/raw formats and invalid payloads;
`check_selfie_browser.cjs` tests raw-map transfer through the receiver fixture,
failures and backups. `check_selfie_sender_contract.cjs` runs the actual sender
source and renderer against production-shaped origins served from local files,
with isolated storage and synthetic long-bangs/eyelashes/custom-color choices.
This verifies confirmation, canonical persistence, ACK/popup close and reload
rendering; it does not read the owner's live saved Selfie. Physical Safari/iPad
popup behavior and a deployed-site retry still need owner verification.

## Message contract

Sender to receiver, only after the user presses **Use this selfie**:

```js
window.opener.postMessage({
  type: "letseigo.selfie.import",
  version: 1,
  requestId,
  avatar: {
    schemaVersion: 1,
    choices: {
      face: "classic",
      eyes: "cheerful",
      eyeStyle: "basic",
      nose: "small",
      mouth: "smile",
      hair: "tousled",
      clothes: "tee",
      accessories: "none",
      skin: "#f8cfa9",
      hairColor: "#503529",
      eyeColor: "#9b6643",
      shirtColor: "#5d9698",
      background: "#dcebe4"
    }
  }
}, validatedReceiverOrigin);
```

The four envelope fields are exact; extra fields are rejected. `version` is the transfer protocol version; `avatar.schemaVersion` is independently the avatar catalog/renderer compatibility version. Both are currently the number `1`.

Receiver acknowledgement, only after validation, local rendering preparation, and persistence succeed:

```js
popup.postMessage({
  type: "letseigo.selfie.import.ack",
  version: 1,
  requestId
}, "https://letseigo.com");
```

The sender must verify all of the following before automatically closing:

- `event.origin === validatedReceiverOrigin`, with that origin independently allowlisted.
- `event.source === window.opener`.
- The acknowledgement has exactly the expected type, version, request ID, and fields.
- It matches the currently outstanding confirmation request.

The sender should show a waiting state after sending and close only after that valid ACK. A visible Cancel action may close without sending. No ACK means the sender cannot claim the import succeeded. A closed window cannot be guaranteed to receive an ACK even if the copy committed immediately before closure; do not retry or resynchronize in the background. A further copy/update requires user action.

## Historical sender handoff in ActivityHub (reference only)

1. Add `/apps/avatar/transfer.html` as a coordinated, opt-in sender UI. Do not redirect the usual editor to transfer mode or assume the endpoint already exists.
2. Read only the existing `letseigo.app.avatar` version-1 saved avatar through the editor's save conventions. The current editor uses `saved.state`. Do not read/send `letseigo.profile` (names), school data, blog data, achievements, or arbitrary local storage.
3. Build a complete `avatar` object by explicitly mapping the 13 supported fields. Validate with the shared schema before previewing or enabling confirmation. Do not send the whole autosave record, SVG, HTML, image data, an asset URL, extra editor metadata, or unknown future fields. If there is no saved selfie, offer a clear route to the editor rather than inventing an imported avatar.
4. Show the exact avatar that will be copied, a **Use this selfie** button, and a Cancel action. Do not post automatically when the window loads or when the editor's autosave changes.
5. Use the exact-origin request/ACK contract above, clean up listeners and waiting state, and handle missing opener/invalid routing/no ACK without claiming success.
6. Use the canonical non-www site so the user's existing My Selfie local storage is available. Do not attempt to read another origin's storage or silently copy a `www` profile. Those are different browser stores.
7. Coordinate any new part IDs or settings as a new schema/renderer version with both projects. A sender must not label an incompatible new catalog as v1.

## Shared schema and local renderer

The exact, portable JSON Schema is `docs/selfie-avatar.schema.v1.json`. The runtime validator is `assets/js/selfie/schema.js`; its frozen catalog must stay in agreement with that schema. The sender can adopt the identical schema/validator after adapting the namespace, with no Teacher Tools runtime dependency.

All 13 choices are required and unknown fields are rejected. Known part IDs and supported `eyeStyle` values come from the inspected My Selfie catalog. Skin and background are restricted to its known palette entries. Hair, eye, and clothing colors support six-digit hex values, including the editor's custom colors; custom hex values are normalized to lowercase. Scripts, markup, CSS functions, asset URLs, arbitrary objects, missing fields, and unsupported versions fail validation. There is no best-effort fallback from an invalid import to default parts.

Teacher Tools owns local copies of:

| Local resource | Source/reference |
| --- | --- |
| `assets/js/selfie/schema.js` | Snapshot of `ActivityHub/apps/avatar/config.js` defaults/options plus strict v1 validation |
| `assets/js/selfie/svg-parts.js` | Bundled `svg-parts.js`, namespace changed; 30 trusted vector parts |
| `assets/js/selfie/renderer.js` | Compatible `svg-art.js`, namespace changed; unused editor-preview exports removed |
| `assets/js/selfie/source-snapshot.json` | Source SHA-256 fingerprints for coordinating future updates |
| `assets/js/selfie/transfer-config.js` | Exact-origin configuration confirmed by the owner |
| `assets/js/selfie/transfer.js` | Teacher Tools pending-request/message lifecycle |

The inspected parts contain only SVG/g/path elements and no external or executable attributes. Incoming markup is never used. The profile validates choices and runs the bundled renderer locally; it parses only the SVG produced by that trusted renderer and displays that local vector. No cached image is needed for imported choices. All runtime JS/artwork is in the service-worker app shell and renders offline. ActivityHub is a source reference, never a stylesheet, script, asset, or storage dependency at runtime.

## Local storage and existing profiles

The copy is stored in the existing `teacherTools.sitePreferences.v1` record:

```js
profile: {
  name: "Existing teacher name", // stays local; never part of the transfer
  selfie: {schemaVersion: 1, choices: {/* validated fields above */}}
}
```

The receiver merges with the latest preferences/profile when committing, preserving unrelated fields, name, theme, custom colors, and shortcut choices. Names are displayed as text with a pencil button; Save/Cancel appear only during editing. Escape cancels an unsaved name edit before closing Profile. Only My Selfie choices are supported. On loading Profile, the retired photo field (`profile.avatar`) is removed from local preferences without changing names, My Selfie choices, or unrelated settings. Nonempty photo fields are rejected in restored Site preferences backups, so backup import cannot reintroduce custom photos. An old empty photo field is accepted and then discarded. Removing a My Selfie avatar clears its choices without removing the name.

Site preferences export/import and linked-file record validation use the shared validator for `profile.selfie`. Unsupported or malformed selfie backups fail validation before any writes. Restored valid choices render from the same offline local assets. A storage failure sends no acknowledgement and leaves the previous profile intact. A synchronous acknowledgement error attempts to roll back only the receiver's own synchronous commit; the protocol cannot guarantee ACK delivery after a popup closes.

## Pending-request lifecycle

Only a user-started pending popup can import. The receiver checks exact sender origin, exact `event.source` popup handle, type, request ID, protocol version, strict envelope, and strict avatar schema. Unrelated origin/source/ID/type messages are ignored without cancelling a real request. An authenticated but unsupported/malformed payload fails the request without replacing the profile or sending ACK. A popup that has already closed cannot import in the interval before the closure poll.

Success, explicit cancellation, unsupported/malformed payload, storage failure, popup closure, timeout, and page exit remove the message/pagehide listeners and timers and release pending state. Closing Profile cancels its outstanding popup. Cancelling/timeout/page exit may close the owned popup; the sender itself must not automatically close as if it succeeded without ACK. A blocked popup shows retry guidance and installs no pending listeners. Duplicate/late messages after cleanup do nothing.

## Verification and remaining integration work

Run with Node 18+:

```sh
node scripts/check_selfie_transfer.cjs
python3 scripts/check_styles.py
```

The dependency-free tests cover schema/catalog parity and options, successful commit/ACK, duplicate/no-pending messages, fresh IDs, exact URL, wrong `www`/untrusted/null origins, wrong source/ID/type, unsupported protocol/schema, missing/extra fields, scripts/URLs/invalid colors, blocked popup, unsupported receiver origin, close/cancel/timeout/page exit, failed storage, ACK error rollback, and cleanup.

With the local server at `http://localhost:8765/` and Playwright installed:

```sh
node scripts/check_selfie_browser.cjs
```

Use `PLAYWRIGHT_MODULE` for an existing Playwright module path and `CHROME_PATH` for an installed Chrome binary if necessary. `SELFIE_TEST_OUTPUT` can select the screenshot directory. Tests use isolated browser storage and **intercept the sender URL with an in-memory simulated confirmation page**; they do not contact or implement the actual sender. These receiver checks cover explicit import/update, persistence, exact browser origin/source, profile/theme preservation, blocked/cancelled/closed/timed-out popups, invalid schema, storage failure/no ACK, backup round-trip and bad-backup rejection, both languages at three sizes, and local rendering on all eight pages offline.

Still required: implement the real sender, verify it reads the real editor's saved avatar, inspect actual production redirects/headers/opener behavior, and perform real cross-site import/update/cancel/ACK testing at the confirmed origins. Physical iPad Safari popup, focus, installed-app storage, and offline lifecycle checks also remain. No deployment, DNS changes, or migration of local Teacher Tools data is authorized by this implementation.
