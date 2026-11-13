# CSS foundation verification — November 9, 2026

This records the initial extraction. The two existing issues below were subsequently fixed; see [opening modes and follow-up verification](opening-and-verification.md).

## Structural and browser comparison

- All eight pages now load the same three local stylesheets before their tool-specific styles.
- Compared the actual pre-extraction HTML captured at the start of this change against the refactored pages. Both were tested in isolated Chrome profiles with service workers blocked for the appearance comparison.
- Coverage: eight pages × five themes (Ocean Blue, Color Pop, Pretty in Pink, True Dark, Custom) × three viewports (1280 × 900, 768 × 1024, 1024 × 768): 120 combinations before and after.
- Compared sampled computed styles for the page, header, app shell/title, primary tool elements where present, appearance/backup panels, and help/customization dialogs. Also compared keyboard focus. With a fixed date and transitions disabled, all sampled values matched in all 120 combinations; keyboard focus was visible in all 120.
- Reviewed desktop and portrait-tablet screenshot comparisons for every page. No extraction layout regression was found. Minor border rasterization differences remained between browser runs. The offline status now resolves to “Not prepared” when no worker is available instead of remaining in its previous waiting state; this is an intentional readiness fix.
- The complete shared CSS declaration sequence matches the pre-extraction block exactly after ignoring comments and whitespace.
- Additional dialog checks covered all eight pages and five themes at 1280, 768, and 390 pixels: keyboard focus visibility, Escape focus restoration, tool settings/help dialog containment, and narrow navigation. A pre-existing narrow header-panel clipping issue is recorded below.
- Tool-specific CSS is byte-for-byte unchanged except for removal of Spinner's two exact redundant `.field-full` rules, already supplied by the shared components stylesheet.

## Offline browser verification

Used real Chrome service workers and Cache Storage through a local fixture server. The prior-version test served the actual worker and HTML captured before this extraction, then switched to the current source. Only isolated test profiles were used; no owner browser data was cleared.

Passed:

- First installation and manual preparation after opening only `/offline/`.
- Disconnected reload and navigation to all eight prepared pages, including tools never opened individually before preparation. Confirmed all three stylesheets were available and parsed, the document release matched, and the base theme rendered.
- Offline navigation using `/timer/index.html` and a query string mapped to its prepared page.
- Missing, truncated, stale-release, and HTML-substitute CSS in the cache reported not ready; complete preparation repaired each case.
- Missing, truncated, stale-release, and HTML-substitute network stylesheet responses prevented fresh preparation from reporting ready.
- A failed refresh left an existing complete cache unchanged and usable.
- Failed installation of the new release preserved the prior active worker and its usable offline page.
- Complete update from the actual prior cached version: waiting release reported ready, Check/Apply update activated it, old cache was removed, and all eight pages then worked offline with the shared stylesheets.

## Automated checks

`python3 scripts/check_styles.py` passes: eight pages, three shared stylesheets, 15 required offline resources, consistent release markers/load order, no exact shared-rule duplication, and all local CSS dependencies included offline.

All 28 inline script blocks and the service worker pass JavaScript syntax checks. Git whitespace/diff checks pass. There was no pre-existing automated test suite or build command in this checkout.

## Existing issue and limits

Class Tracker logs `Cannot read properties of null (reading 'schools')` on a fresh profile. The same error occurred in all 15 Tracker combinations before and after the extraction. It was not introduced or changed by this work and remains a separate JavaScript issue.

At 390 pixels wide, the shared appearance and language panels start 5 pixels beyond the left edge when a stable scrollbar gutter occupies space. The original Home page and refactored Home page produced identical panel bounds; the shared rules explain the same behavior on the other tools. This is a pre-existing narrow-screen issue, left for a separate visual fix rather than folded into the extraction.

These checks establish desktop Chrome behavior, including tablet viewport sizes; they do not establish Safari or physical iPad behavior. Still check iPad Safari and an installed Home Screen app: offline relaunch after suspension, update application, portrait/landscape and split view, touch/native select/color-picker behavior, dialog scrolling, and keyboard focus with an external keyboard. Storage eviction and cross-tab update coordination remain broader offline-system follow-ups.
