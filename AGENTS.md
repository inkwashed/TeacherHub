# Teacher Tools development standards

## Edit and test workflow

- Edit the actual site files in this checkout directly: the root `index.html`, applet directories, and shared `assets/`.
- Use the current checkout and branch by default. Do not create a separate Workbench Preview, staging copy, or worktree, or require a copy/synchronization step before release, unless the user requests it.
- Preview these same files locally. From the repository root, run `python3 -m http.server 8765` and open `http://localhost:8765/`. Use the same local origin when checking saved browser data.
- Perform checks appropriate to the change, fix observed bugs in place, and report what was verified and what still needs user testing. Historical checks are not current validation.
- Leave changes uncommitted for the user to review and test. Do not commit, push, publish, or deploy unless the user explicitly requests that action. A request to edit or fix the site does not authorize release.
- Editing this local checkout does not update either public site. The user controls rollout after testing.

- The approved spacing/shape styling is permanent. Edit the owning Home/site/component rules; do not restore a removable trial override layer. Shared tool and school-settings CSS belongs in `assets/css/components.css`; keep genuine tool/presentation variants local.
- Convert app layouts one at a time when requested. Converted pages opt into `body.app-page`: theme surface app canvas (white/light for light themes, dark for dark themes; tinted panels and original accents), themed site header/Profile, and a simple “Let’s EiGo! Teacher Tools © 2026 letseigo.com · All rights reserved.” footer without version/status messaging. Place it as a body sibling outside the activity scroll region so it stays at the viewport bottom without covering content; hide it in presentation mode. Retain the app name/version at top left in a presentation-only fullscreen header; normal-page controls stay in content and no empty inner header returns.
- Keep release information in each app’s version number; do not add a home-page updates feed.

## Shared behavior and offline use

- Shared CSS lives in `assets/css/`; see `docs/styling-and-offline.md` for ownership, cascade order, and offline rules. Keep tool-specific visuals local. The Profile modal template and controller live in `assets/js/profile.js`; never copy its markup into pages. Backup/restore and File sync belong in Profile → Sync; do not recreate a header backup menu or Google sync placeholder. The toolbar and tool registry live in `assets/js/toolbar.js` and `assets/js/tools.js`; mount registry → toolbar → Profile synchronously, and use the existing `appPanel` selection for Home and header shortcuts. Keep the full Home catalog independent of that selection. The head theme bootstrap is `assets/js/theme-bootstrap.js`; load it synchronously before CSS. The shared runtime is `assets/js/ui.js`; load it synchronously at the footer before page-specific registration/application code. Calendar/Tracker/Scheduler use `assets/js/school-settings.js` before their local adapters; retain each adapter’s storage/recovery rules and false-write handling. Utility and tool SVG artwork is owned by `assets/js/tools.js`; use existing icon markers rather than copying geometry. Use `data-shared-icon="presentation"` for fullscreen and `data-shared-icon="settings"` for settings; their canonical sizing, stroke/fill and interaction styles live in `assets/css/site.css`. Do not add page-specific versions. See `docs/shared-assets.md` for ownership and the Profile mount/init order.
- Keep document asset/navigation paths file-safe and explicit (`index.html`); the service worker still inventories canonical HTTP URLs. See `docs/opening-and-verification.md` for supported opening modes.
- Run `python3 scripts/check_styles.py` after styling or offline-resource changes. Use its `--release` option to update release identifiers consistently.
- Do not use ActivityHub as a styling or runtime dependency. Consult it only when the user asks for a specific reference.
- When changing files cached by the service worker, update its release identifier so existing installations can receive a new cache. Update the app-shell list when adding or removing offline resources.
- Check offline behavior when changes affect installation, caching, navigation, or offline resources. Account for an existing service worker serving cached assets during local testing.

## Repository and migration boundaries

- This checkout's Git destination is `https://github.com/inkwashed/TeacherHub.git`. Its custom domain is `tools.letseigo.com`.
- Keep the original `ALT-Resources` repository and deployment separate. Do not alter the original site's hosting or DNS as part of routine development.
- TeacherHub is unpublished. Avoid unnecessary data loss, but do not preserve unpublished test-data compatibility at the expense of a cleaner design. Tell the user before resetting local test data. Production migration planning is not required for routine development.
- The original site is intended to remain available through the end of December 2026. Its shutdown requires a separate user instruction.
