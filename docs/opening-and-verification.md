# Opening TeacherHub and verifying the local-use fixes

## Three ways to open the tools

| Mode | What works | Boundaries |
| --- | --- | --- |
| Local HTTP preview: `python3 -m http.server 8765`, then `http://localhost:8765/` | Full styling, ordinary navigation, shared browser storage across tools, local development, and service-worker testing | Keep the same hostname/port for saved data. Prepared pages are cached by release; apply an update on the offline page after changing cached files. |
| Hosted HTTPS site / prepared installed app | Full tools and shared storage for that origin; installation, preparation, updates, and prepared offline navigation | Prepare online first. Browser/OS storage eviction can remove prepared files. Installed-app lifecycle still needs testing on the actual target device. |
| Direct `file://` opening of the root or a tool's `index.html` | Local shared styling, ordinary links to the other local HTML files, and browser-supported tool interactions | No service-worker installation, offline preparation, or updates. The offline page explains this and disables those actions. This is a lightweight viewing/convenience mode, not the installed offline experience. |

The shared toolbar/registry/Profile scripts resolve navigation from their own local script URL without fetching HTML fragments. Profile → My tools controls the shared Home/header shortcut list; its storage has the same opening-mode boundaries as other preferences.

Document-relative stylesheets and explicit `index.html` navigation keep file URLs inside the checkout. The same paths resolve to the same assets on HTTP/HTTPS. The worker maps `/tool/index.html` navigations to its prepared `/tool/` entry. Stylesheet release query strings and release validation remain in place. The manifest is attached only for HTTP/HTTPS opening, not for direct files.

Direct-file storage is browser-dependent: access, persistence, and sharing between files are not a supported substitute for one HTTP origin. A theme or school edited in one file may not be available in another browser/file context. Moving or renaming the folder can affect file storage. File, localhost, hosted, and installed contexts should not be assumed to share data. Use the local server for dependable development involving schools, progress, backup/restore, or linked files, and make backups before changing opening contexts. No browser data reset is required for these fixes.

## Confirmed causes and fixes

### Tracker school initialization

Tracker's main view already had a fallback school reader. Its separate shared-settings adapter instead parsed `classAutomatorData_v3` directly. An absent key parses to `null`; controller initialization immediately accessed `state.schools`. Invalid JSON also threw before defaults could be used.

Both paths now use one Tracker reader. Missing/empty records use the existing temporary defaults; a valid empty schools array remains empty. Invalid JSON/record shapes use safe temporary defaults with an English/Japanese notice. Reading never rewrites the stored school record. Valid school IDs, classes, schedules, metadata, and unknown fields remain intact.

School edits use a guarded writer. Before replacing unreadable stored school data, it saves the exact original string under `classAutomatorData_v3.recovery.<unique-id>`. If saving that recovery copy fails, it does not replace the original. The visible warning explains fallback/recovery behavior; failed saves are not reported as successful. These recovery entries are retained locally for support/recovery, not automatically deleted or treated as normal schools. This is a targeted safeguard, not a new migration or backup system.

### Narrow header panels

`scrollbar-gutter: stable` can reserve space inside the layout viewport. The header's available width excluded that gutter, but its narrow panels used `calc(100vw - 20px)`. At 390px this positioned the original appearance/language panels 5px beyond the left edge.

The responsive panel width now uses the containing header's percentage width. The existing desktop/tablet sizing and positioning remain. Appearance/language panels also have a viewport-height limit and vertical scrolling for short screens/custom-theme controls. Touch targets, focus styles, Escape handling, and page scrolling remain in place.

### Direct-file styling/navigation

Root-relative `/assets/css/...` under `file://` pointed to the computer's root rather than the checkout. Root-relative navigation had the same problem, and directory URLs did not explicitly select an HTML page. All pages now use relative local asset paths and explicit HTML targets, including Home's generated tool shortcuts and Tracker's Calendar link. The shared-style checker resolves these paths back to the canonical offline inventory and rejects missing or file-unsafe static references.

## Repeatable checks

- `python3 scripts/check_styles.py`: shared rule ownership, order, release markers, local navigation/assets, and offline inventory coverage.
- `node scripts/check_tracker.cjs` (Node 18+): absent/empty/malformed/valid records, read preservation, recovery copying, and quota-failure protection, using the actual reader/writer extracted from Tracker.
- `node scripts/check_browser_fixes.cjs tracker` (optional Playwright): fresh and existing Tracker data in both languages, school editing/settings tabs and checklist persistence.
- `node scripts/check_browser_fixes.cjs matrix` (optional Playwright, local server running): every page in both languages and five themes at phone/tablet/desktop sizes, separately over HTTP and direct files; styling, navigation, panel containment/focus, and direct-file install controls. Set `CHROME_PATH` to use an installed Chrome; `PLAYWRIGHT_MODULE` can point to an existing Playwright package. No owner browser profile is used.

## Verification results — November 9, 2026

- Passed 480 browser combinations: eight pages × HTTP/direct file × English/Japanese × five themes × 390×844, 768×1024, and 1280×900. Checked actual stylesheet loading/rendered tokens, ordinary Home/tool navigation (including generated shortcuts), visible keyboard focus, Escape focus restoration, and panel containment. File-mode install/preparation/update controls were disabled with the protocol explanation visible. Chrome restricts reading file stylesheet rules through CSSOM; rendered styles and loaded sheets were checked instead.
- Compared the actual prior and current header-panel bounds: desktop/tablet positioning and dimensions match in both languages. At 390×320, custom-theme controls scroll within the visible panel; Escape restores focus and releases normal page scrolling.
- Passed 20 Tracker browser data/language cases: absent, empty, JSON null, malformed JSON and shapes, valid empty schools, and existing valid schools. Verified no school-record writes on opening, school edits and tabs, exact recovery copies for unreadable records, preservation of IDs/schedules/custom fields/student counts, and assigned checklist progress after reload.
- Passed the 11-case dependency-free Tracker reader/writer test, including refusing to overwrite the source when recovery storage fails.
- Passed first offline preparation with only the offline page visited; disconnected reload and navigation to all eight prepared pages plus the `index.html`/query alias; missing/truncated/stale/HTML-substitute CSS rejection and cache repair; failed refresh preservation; failed update retaining the prior release; and full update from the actual previous CSS-foundation cache to this release followed by offline navigation to every page.
- Shared-style/path/dependency checks pass for all eight pages, three stylesheets, and 15 offline resources. All 29 inline scripts and the worker parse; diff/whitespace checks pass.
- Tests used isolated Chrome profiles and temporary fixtures, not the owner's browser storage. Existing data was not reset. Safari/physical-device behavior is not established by these Chrome results.

Physical iPad Safari remains necessary for Home Screen installation and update lifecycle, offline relaunch after OS suspension, storage access/eviction, portrait/landscape/split view, short-screen dialog scrolling, touch/native controls, and external-keyboard focus. Direct-file behavior on iPad also depends on how the OS opens the file; a file-manager preview is not the hosted app.
