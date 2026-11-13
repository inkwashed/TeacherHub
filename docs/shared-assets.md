# Shared assets and Profile ownership

## Profile: one component on all eight pages

Before this change, Teacher Tools shared Profile CSS and its name/Selfie behavior, but copied the same 7,849-character modal markup into every page. Profile open/close and theme-control event bindings also lived in each page's embedded shared UI. A change to the modal's controls required eight edits.

The Let’s EiGo! reference (`ActivityHub/shared/profile.js`) creates one standard modal from a shared script. TeacherHub now follows that architectural pattern with its own local implementation; it does not import ActivityHub at runtime or copy its badge system or app-specific behavior.

`assets/js/profile.js` now owns:

- The single native-dialog template, including icons, localized name editor, Selfie actions, six theme choices and custom-color controls.
- Profile-specific open/close handlers, focus wrapping/restoration, backdrop/Escape behavior and coordination with the header's other overlays.
- Name saving/cancelling, local avatar rendering, Selfie transfer integration, status messages, and Profile translations.
- The **Sync** section beside Name, with Export and File sync tabs. All backup/file-sync markup is now owned here as well; there is no separate backup dropdown or Google sync tab.
- Theme picker/custom-color input and reset bindings. The shared UI still owns the theme computation/persistence engine and provides `applyGlobalTheme`, `resetCustomTheme`, and `closeSiteOverlays` as a small integration API. The backup/restore and linked-file engines live in the shared `assets/js/ui.js`; `refreshSiteData` refreshes the Sync summary/controls on opening Profile. `TeacherToolsProfile.openSync()` opens Profile on its Export tab for shortcuts such as the offline page.

Each page includes these synchronous, document-relative, release-versioned scripts in this order at its header position:

```html
<script src="assets/js/tools.js?v=RELEASE" data-teacher-tools-tools></script>
<script src="assets/js/toolbar.js?v=RELEASE" data-teacher-tools-toolbar data-page="home"></script>
<script src="assets/js/profile.js?v=RELEASE" data-teacher-tools-profile></script>
```

Tool pages use `../assets/js/` and their registry ID as `data-page`; the offline page uses `offline`. The real release identifier is maintained by `python3 scripts/check_styles.py --release ...`; do not literally use `RELEASE`. Do not add a second footer include, inline copy of the modal, `async`, `defer`, or `type="module"` to this mount.

The script mounts static, project-owned markup immediately so the existing shared UI can initialize theme/language controls. It binds Profile behavior once at `DOMContentLoaded`, after `ui.js` and local Selfie dependencies exist. User names are assigned with `textContent`; imported choices still pass the strict schema and local vector renderer. No user/imported strings are interpolated into the template. Repeat loading does not create a second dialog.

Styling stays in `assets/css/site.css` and the existing shared foundation/components files. No new CSS file or fetch-based HTML fragment is needed. Keeping the template in the local script preserves direct-file opening; using `fetch()` for a fragment would introduce file-origin restrictions.

Profile remains available in prepared offline pages. The versioned component is in `APP_SHELL`; readiness checks its JavaScript content type and end-of-file release marker, rejecting a stale script, fallback HTML, or truncated component. Component changes require a release bump just like shared CSS. Existing name, Selfie choices, themes, other preferences, schools and progress retain their data formats. The existing targeted retirement of legacy photo fields is unchanged; this refactor introduces no data cleanup or reset.

Direct-file Profile styling, name/theme controls and ordinary navigation remain available subject to browser storage limitations. Selfie transfer is still restricted to its allowed HTTP/HTTPS origins; file opening is not service-worker installation/offline preparation. The actual remote Let’s EiGo! sender integration remains a separate task; local receiver fixtures do not establish production sender behavior.

## Current ownership and next opportunities

| Area | Current state | Recommendation |
| --- | --- | --- |
| Themes, base, controls, header/Profile CSS | Three local shared stylesheets used by every page; approved trial values folded into permanent ownership | Keep this foundation; do not add near-duplicate stylesheets per tool. |
| Profile | One template and controller in `assets/js/profile.js` | Implement future Profile changes here and verify all pages. |
| Selfie artwork/schema/receiver | Shared local modules in `assets/js/selfie/`, including a recorded artwork snapshot | Keep the strict schema and local rendering boundary; update snapshots deliberately. |
| Brand and favicons | Site SVG/install PNGs for Home/offline/installation; tool favicons generated from the registry | Run `python3 scripts/build_favicons.py` after registry artwork changes. Keep one favicon link per page. |
| General shared UI runtime | One local `assets/js/ui.js` for translations, theme engine, modal/tooltips, backup/restore and linked-file controls | Change this source once; keep its synchronous footer position before app code and registration. |
| Theme bootstrap | One synchronous `assets/js/theme-bootstrap.js` in every head before CSS | Preserve early theme/language application. The small startup color calculation is deliberately self-contained so it does not load the full UI runtime before rendering. |
| Header/navigation/language markup and tool icons | One synchronous toolbar in `assets/js/toolbar.js`, backed by `assets/js/tools.js` | Edit these shared sources; never copy the header or registry back into individual pages. |
| School model/settings controller | One `assets/js/school-settings.js` used by Calendar, Tracker and Scheduler | Keep storage validation/recovery/edit rules in the local adapters. A false write result stops success feedback; Tracker supplies its specific error text through `writeError()`. |
| Tool shells, controls, dialogs and school-settings CSS | Common definitions in `components.css`, with deliberate tool variants kept local | Edit shared bases once. School-settings behavior/adapters and presentation visuals remain tool-owned. |
| Typography | Rounded system-font stack; unused trial font/license files removed (888,113 bytes) | Keep core styling local and avoid restoring unused font bundles. |

A whole-site bundler or remote stylesheet dependency is not necessary for these gains. Keep shared files local, cache them with their consumers, and add focused guards against duplication and missing offline dependencies. Reuse design values from Let’s EiGo! deliberately; the repositories must remain independently usable.

## Checks

`python3 scripts/check_styles.py` now checks one Profile component mount per page, no inline modal copies, synchronous startup order, correct release/path, and offline coverage for **all** external local scripts as well as shared CSS. It also verifies the Profile template/release marker, registry pages and full Home catalog links, and one registry/toolbar mount per page in the correct order. The release helper updates the component marker and versioned includes together.

Browser checks (optional Playwright; `PLAYWRIGHT_MODULE` and `CHROME_PATH` may point at an existing installation):

- `node scripts/check_tools.cjs`: dependency-free registry/preference validation, legacy/default/empty selections, preservation and failed writes.
- `node scripts/check_toolbar.cjs`: all-page HTTP/file, language and responsive toolbar cases; configuration/order, cross-page/cross-tab persistence, focus, presentation, empty/reset and storage failures.
- `node scripts/check_profile_name.cjs`: the existing all-page/language/size profile/name/avatar/persistence regression tests.
- `node scripts/check_shared_profile.cjs`: all eight pages, English/Japanese, phone/tablet/desktop, HTTP/direct files; one dialog, all six themes/custom reset, preference preservation, focus wrapping/restoration and overlay coordination.
- `node scripts/check_selfie_browser.cjs`: receiver with a simulated sender, backup/restore and prepared offline Profile use on all pages.
- `node scripts/check_selfie_transfer.cjs`: dependency-free schema/receiver security and failure cases.
- `node scripts/check_profile_sync.cjs`: full/selected exports, selected/legacy restores, invalid/cancelled imports, and linked-file create/autosave/pull/disconnect/relink. File handles are isolated browser-local OPFS fixtures in place of OS picker dialogs.
- `node scripts/check_profile_offline.cjs`: required-component cache/network faults and release updates on an isolated local fixture server. By default it synthesizes the prior release; `TEACHERHUB_PRIOR_SOURCE` can supply captured prior source for a structural-update test.

## Original component-extraction verification — November 11, 2026

- Confirmed that the mounted template is identical to the previous modal markup and that shared CSS changed only in its release markers.
- Passed the 48-case existing Profile/name suite across all pages, English/Japanese, and phone/tablet/desktop, including failed writes and preference/avatar preservation.
- Passed 96 component cases across all pages, both languages, three widths and HTTP/direct files, with 576 actual theme selections, custom reset, single-instance checks, focus wrapping/restoration and overlay coordination.
- Passed the 23 dependency-free schema/receiver groups and browser receiver fixture tests, including backup round-trip, invalid-backup rejection, simulated transfer failures and prepared Profile rendering on all eight pages offline. No real sender integration was tested.
- Passed missing/truncated/stale/HTML-fallback Profile script rejection from both cache and network; incomplete fresh preparation never reports ready, repair succeeds, and a failed refresh keeps a complete cache usable.
- Updated from the actual source/cache captured before this refactor: a missing component preserved the prior active release; successful installation/activation replaced it and all eight pages reloaded and opened the single Profile offline.
- Shared CSS/component/offline inventory checks and JavaScript/diff checks pass. Tests used isolated browser profiles; no personal test data was reset, and nothing was committed or deployed.

Physical iPad Safari still needs popup confirmation, native dialog focus, keyboard/color-picker interaction, short-screen scrolling and installed/offline lifecycle checks.

## Sync integration verification — November 12, 2026

Backup and restore now occupy the shared Profile's Sync column rather than a separate header dropdown. Export and File sync are its only tabs; Google sync UI/translations/styles were removed. Profile stacks Sync beneath the identity area on narrow screens and keeps it to the right of Name on wider screens.

- Passed the 96 HTTP/direct-file component cases across all eight pages, both languages and three widths, including 576 theme selections, two-tab keyboard navigation, panel placement, focus handling and absence of the retired menu/Google tab.
- Passed the 48-case name/avatar regression suite and the Selfie receiver browser fixture, including Profile backup round-trip and all-page prepared offline rendering.
- Passed full/selected export, selected restore preserving unrelated records, invalid/cancelled import without writes, and older Spinner backup import through Profile → Sync.
- Passed linked-file create, automatic save, pull/reload, stored-handle recovery, disconnect without deleting the file, and linking an existing file. These checks use native browser-local OPFS handles behind test picker functions, not personal files or native OS picker dialogs. The offline-page shortcut opens Profile on Export.
- Passed incomplete/stale/missing Profile asset rejection, repair, failed update preserving the prior release, and complete update from the captured pre-Sync cache followed by offline Profile use on all eight pages.
- Fixed two integration details found by tests: export's synthetic download click no longer dismisses Profile, and Bag of Tricks' mode-tab selector is scoped to its own tablist so it cannot alter the Sync tabs. Sync arrow/Home/End handling also stays inside its own widget.
- Shared component/style/offline checks, syntax checks and diff/whitespace checks pass. Native OS picker permission prompts and physical iPad Safari download/import/scrolling/lifecycle checks remain. No saved data was reset and no backup formats changed.

## Compact theme controls — November 12, 2026

Color choices now sit directly under Name beside the selfie, including custom-color controls when selected. The full-width theme footer is removed. The six local palette previews are 22px circles with a 135-degree primary/tertiary split and a thin secondary divider; the existing third preview color is retained (Custom uses its chosen background). Each circle keeps a transparent 44px hit area, localized radio name/title, selection ring, keyboard focus and forced-color styling. The compact three-by-two arrangement can wrap further if the name column is narrower. No theme colors, stored choices, or Sync behavior changed.

Passed 96 HTTP/file component cases across eight pages, both languages and three widths, including 576 theme selections, under-Name placement, circle geometry, custom editing/reset, saved preferences and focus wrapping. The 48-case name/avatar regression suite passed. Phone and desktop screenshots were visually reviewed. Offline preparation, missing/stale asset rejection, and updating a captured prior cache passed; all eight pages reopened Profile offline with the 22px circles. Shared CSS/component/offline dependency and diff checks pass. Physical iPad Safari color-picker/focus and installed-app lifecycle checks remain.

## Shared My tools toolbar — November 12, 2026

`assets/js/tools.js` owns the six-tool registry, SVG navigation icons, localized short names, file-safe paths and shortcut preference adapter. `assets/js/toolbar.js` inserts the shared header and language panel synchronously. Home shows the Teacher Tools brand; tool pages show their registry icon/name and the version read from `data-app-version` on a headerless tool shell, or the existing app-owned badge on tools that retain inner headers, with a Home back arrow. Tool help/settings/presentation controls remain in the tool so they work in fullscreen. The original app title/version reappears in presentation/fullscreen mode.

Profile → **My tools**, below the color themes, shows a non-interactive selected-icon preview and pencil edit button. Editing displays app icons/names, left drag handles and right checkboxes; Save commits the draft; Cancel or Escape returns to the saved preview. Handles support mouse/touch dragging and Arrow Up/Down/Home/End keyboard ordering. Changes remain a local editor draft until Save. Changes remain a local editor draft until Save. The Home My tools cards and toolbar share the existing `sitePreferences.appPanel` selection. Existing selections/order (including an empty list) and the legacy Home setting are respected; fresh defaults are Calendar, Tracker, Timer and Spinner. Reset restores those shortcuts only. All six apps remain in Home's full catalog regardless of selection. Home shortcut buttons are icon-only, with localized accessible names and hover titles; text labels belong in the compact toolbar menu, not inside Home's fixed-size buttons. The toolbar browser check guards this distinction in both languages and opening modes.

The toolbar has identity at left, selected icons in the center and permanent language/offline/Profile buttons at right. At 800px and below, or whenever the selected icons cannot fit, shortcuts move into the hamburger menu with labels, All tools on Home and Customize My tools. Focus follows shortcuts across the responsive boundary. Menu and Profile settings scroll on short screens.

Loading does not write defaults. Explicit edits merge with the latest saved preferences, preserving names, themes, Selfies, unrelated fields and unknown future tool IDs. Malformed/unsupported preferences and failed storage writes report an error without replacing the saved record. Existing Profile → Sync backups include the shortcut choices through the existing validated `appPanel` field; there is no new data format or reset. Direct-file storage availability/sharing remains browser-dependent.

To add a tool, add its registry entry and full Home catalog card, mount the three scripts with its `data-page`, keep its version in the app-owned badge, and add its page/dependencies to the worker inventory. Keep app visuals local. Run the shared-style/registry/browser checks and bump the release. The local registry and toolbar scripts are required offline resources with release markers; the shell now inventories 23 files. Missing, stale, truncated or HTML-fallback shared scripts must fail readiness just like required CSS. Do not fetch markup or depend on another repository.

Toolbar verification used isolated Chrome profiles: 96 page/protocol/language/size cases (eight pages, HTTP and direct files, English/Japanese, 390/768/1280px); settings/order/empty/reset, existing preferences, failed writes, cross-page/cross-tab updates, overflow fallback and keyboard focus across resizing; Timer presentation enter/exit; 48 Profile/name cases and 96 Profile/theme cases with 576 theme selections. Phone/desktop screenshots were reviewed. Registry unit tests, shared-style/offline inventory, script syntax and diff checks pass. Offline fault tests reject missing/truncated/stale/HTML-substitute Profile, registry and toolbar scripts; repair and prior-cache preservation pass. Updating the actual captured pre-toolbar cache succeeds, removes the old cache and opens all eight pages offline with the generated toolbar and Profile. These are Chrome results; physical iPad Safari still needs touch/reordering, split view, external-keyboard focus, dialog scrolling and installed/offline relaunch/update checks. No owner data was reset and nothing was committed or deployed.

The Sync regression suite also passed full/selected exports, selected/legacy restores, invalid/cancelled imports and browser-local file-sync fixtures. The Selfie receiver fixture passed with a custom toolbar selection carried through export/import, unrelated preferences retained and all eight prepared pages available offline. Popup/download tests used isolated browser fixtures; real sender and native OS picker behavior remain outside these results.

## My tools pencil editor — November 12, 2026

The shared Profile component owns the My tools heading, preview/edit views and Save/Cancel buttons. The registry controller renders the preview, editor rows and pointer/keyboard reordering. Preview icons are not links; their combined accessible label names the selected shortcuts. Each drag handle has a localized tool name and a 44px target. Checkboxes remain native labeled inputs on the right. Existing preferences, unknown fields, and failed-write behavior are preserved. Escape closes the editor before closing Profile; closing Profile resets the editor view. Home and toolbar Customize shortcuts open the editor directly. Install & offline use remains beneath it.

Passed the 96-case all-page HTTP/direct-file toolbar matrix in English/Japanese at phone/tablet/desktop widths, preference and failed-write flows, mouse/touch drag and touch cancellation, keyboard ordering, preview icons, reload persistence and presentation. Offline fault/repair and previous-cache update tests passed with all eight pages reopened offline. Physical iPad Safari dragging/scrolling still needs device testing. Run `scripts/check_my_tools_editor.cjs` for the focused interaction check.

## Explicit editor confirmation — November 12, 2026

Name and My tools use checkmark + Save and x-mark + Cancel actions. My tools now keeps visibility, order and Defaults changes in memory until Save; Cancel, Escape or closing Profile discards the draft. Defaults has a reset icon and changes only the draft. Save merges through the existing preference adapter, preserves unrelated settings, and leaves failed drafts editable without changing saved data. Name retains its existing explicit-save behavior. English/Japanese labels wrap only the text spans so translation preserves icons.

Passed 48 Name page/language/size cases, focused mouse/touch/keyboard My tools tests including draft cancellation, Defaults cancellation and persistence, and toolbar preference/failed-write flows.

## Fixed Profile header — November 12, 2026

Profile uses a non-scrolling semantic header for its title and 44px close button, plus a separate shrinking `.site-profile-scroll` body. The dialog itself clips content; only the body scrolls, with contained overscroll, stable gutter and a transparent track/theme-colored thumb following the ActivityHub builder-panel reference. Tool dragging auto-scrolls this body rather than the dialog. Native modal focus and existing controls remain shared on all pages.

Verified stationary header at bottom scroll on 600px-high phone/tablet/desktop viewports; 96 page/language/size/HTTP-file cases and 576 theme selections; keyboard focus/restore; mouse/touch/keyboard tool editing; offline fault/repair and prior-cache update followed by all-page offline Profile use. Physical Safari/iPad scrollbar rendering and touch lifecycle still require device testing.

## My tools simplification — November 12, 2026

Removed the Defaults action from the editor; Save/Cancel and manual choices remain. The underlying fresh-profile defaults are unchanged. The Calendar registry SVG now paints the filled cell before the grid strokes, so the lines remain visible in Home, toolbar, and Profile. Focused editor checks cover absence of Defaults, paint order, cancellation and saved edits.


## Shared JavaScript and SVG cleanup — November 12, 2026

`theme-bootstrap.js` replaces the identical 4.3 KB head script copied eight times. `ui.js` replaces the identical 105 KB shared behavior copied eight times, retaining its public APIs and adding a guard against duplicate runtime initialization. Unused translations and references for the retired desktop Tools dropdown were removed. Tool-specific application logic is still local.

`school-settings.js` owns the common school compatibility model and Schools/Schedule/Periods controller. Calendar/Scheduler's common code matched exactly; Tracker differed only in failed-write handling. That behavior is now an explicit adapter contract: `write(next, detail) === false` prevents success feedback, and optional `writeError()` supplies the existing tool-specific notice. Exceptions and normal successful writes retain their existing behavior. Each page keeps its own storage reader/writer, recovery safeguards, defaults, extra tabs and app integration. No saved-data schema or initialization write was added. Shared school-dialog markup remains in the pages; template centralization would be a separate component change.

### Loading order

1. In the head, load the local Selfie schema and then the release-versioned, synchronous **theme bootstrap before CSS**. Do not defer it or move it to the footer.
2. At the header position, mount registry → toolbar → Profile synchronously as shown above.
3. At the former shared-behavior position near the footer, load release-versioned `ui.js` synchronously, **before** page-specific translation registration and application code. It needs the parsed page controls and mounted Profile.
4. On Calendar/Tracker/Scheduler, load release-versioned `school-settings.js` at the former common-model/controller position, immediately before the local adapter/application code that consumes it. The existing page-specific ordering is deliberate.
5. Profile/registry/toolbar bind at `DOMContentLoaded`, after the shared UI and late local Selfie dependencies exist. Do not add `async`, `defer`, module loading or fetch-based fragments to these mounts.

All three new scripts are required offline resources, bringing the app shell to **26 files**. All release-versioned root JavaScript modules require the correct JavaScript MIME type and end-of-file release marker. The release helper updates their markers and every page include together. Direct-file opening loads the same classic scripts locally, subject to the documented browser storage restrictions; it still cannot install a service worker or prepare/update the site offline.

### SVG ownership

`tools.js` owns each tool icon and a small static utility-artwork table. Home's six full-catalog cards use `data-tool-icon` holders and receive the same registry artwork as its My tools cards and toolbar. Their links/content remain independent of the chosen shortcut list. Twelve static settings/presentation/chevron SVG instances now use `data-shared-icon` on their existing SVG wrappers, backed by three geometry definitions. ViewBoxes, classes, accessibility labels and tool-specific styling remain with the controls. The marker renderer inserts only project-owned artwork; no user/imported SVG is accepted and no external SVG fetch or sprite dependency was introduced.

The active brand SVG/favicon, installation PNG sizes, Selfie artwork/options and tool-specific result graphics are retained. They are used assets, not obsolete duplicates. Each button still renders its own icon; the repeated source geometry has one owner.

The style/dependency checker now also enforces one synchronous bootstrap/UI mount, school-module ownership/order, no inline copies of extracted runtime/controller code, known shared-icon markers, full Home registry icons and no unused utility-icon definitions. No byte-identical inline script blocks over 1 KB remain. The cleanup reduces HTML/JavaScript/CSS source by approximately **857 KB**, measured before compression; it does not claim that amount as a compressed download saving.


JavaScript/SVG verification used isolated browser profiles: the existing toolbar's 96 HTTP/direct-file page/language/size cases and customization/persistence/focus flows passed; the Profile/name suite passed 48 cases; shared Profile/theme checks passed 96 cases with 576 theme selections, including the added rapid-close/reopen regression. Settings/focus/hover/presentation matched 180 prior-source scenes with existing school data. Tracker passed 20 first-visit/empty/malformed/valid data/language cases plus two failed-save adapter/controller cases. Export/restore/legacy import and browser-local File sync fixtures passed, as did My tools keyboard/mouse/touch editing and cancellation. Selfie receiver fixtures passed import/update/error handling, backup restoration, custom shortcut restoration and all-page offline rendering; no real remote sender or native OS picker UI was exercised.

A reproducible pre-existing Profile race was found while testing: a queued native close event could arrive after `openSync()` reopened the dialog and mark the open dialog hidden. The close handler now ignores stale close events when the dialog is already open again. A synchronous close/reopen regression is checked across all Profile cases, and focus assertions wait for native close-event restoration rather than only its earlier observer notification. No backup schema or saved-data changes were needed.

Final offline tests reject missing, truncated, stale and HTML-fallback responses for all six versioned shared root scripts, repair an incomplete cache and preserve a complete active release after a failed update. A successful update from the actual captured pre-extraction cache prepares all eight pages, including pages not individually visited, with the shared runtime/controller and all marked icons available offline. Profile, tool registry and cache/style checks pass; screenshots of Home, Calendar, settings and Timer presentation were visually reviewed. Physical iPad Safari touch, native file pickers, popup behavior, focus and installed-app/offline lifecycle still require device testing. No owner test data was reset; nothing was committed or deployed.

Favicon verification passed 192 HTTP/direct-file page/language/theme cases: six distinct app icons, one declaration per page, decodable SVGs and stable identity after theme/language changes. Offline preparation and prior-cache updates additionally check that every prepared page retains its correct favicon.


## Icon audit — November 12, 2026

The six app identities already have one canonical registry definition each; toolbar identities, Home shortcuts/catalog and Profile previews reuse those definitions. App favicon SVGs are intentionally generated derivatives rather than competing designs. The active site logo/install sizes and Selfie/result artwork remain required assets; no orphan standalone tool SVG files were found.

Three exact Profile geometry pairs (edit pencil, confirmation tick and cancel cross) now use the existing `data-shared-icon` mechanism. Their six SVG wrappers retain their original attributes, sizing and labels; each geometry has one definition in `tools.js`. Static icon coverage includes markers in the shared Profile template, so unused/unknown utility artwork is checked there as well as in pages.

Two related variants were initially left for review: (1) the main Calendar registry icon versus Tracker's synchronized-calendar note badge, which has a solid highlighted cell and different paint order; (2) Profile's Install/offline arrow-and-tray versus the offline preparation button, whose tray sits 0.5 SVG units lower. The subsequent approved choices are recorded below. Purpose-specific Tracker activity markers and Bag of Tricks result drawings are not interchangeable tool identities and remain local.

Profile's 96 HTTP/file page/language/size cases with 576 theme selections passed after exact-duplicate consolidation, as did My tools preview/edit/keyboard/mouse/touch flows. Favicon derivation and shared-style/JS/icon ownership checks pass. The release inventory remains 26 files; changes are local and no saved data is reset.


## Approved icon choices — November 12, 2026

Calendar **1A** is canonical, including Tracker's synchronized-note badge. The badge now clones the registry SVG and retains its accessible image role/label instead of maintaining a second solid-cell drawing. A semantic `icon-cell` style keeps its light fill and no stroke consistent in every host.

Download/offline **2A** is the single `download` utility definition used by Profile and the offline preparation button. Their existing wrapper sizes and accessibility labels remain intact; the former lower-tray variant is removed.

The Bag of Tricks header used the same registry path as all other views. Its outlined star was a styling difference: the header inherited a stroke, whereas Home/menu/Profile `icon-fill` rules suppressed it. The star now has its own `icon-star` detail class with a light fill and accent outline everywhere. The favicon generator explicitly supplies the matching light fill/white outline on the blue tile, so no second hand-maintained drawing is introduced. Spinner and other intentional generic filled areas keep their existing treatment.

`node scripts/check_icon_choices.cjs` checks the approved rendered detail styles across themes, both languages, phone/tablet/desktop and Home/header/Profile hosts, including an actual synchronized Tracker note badge and matching download artwork. Run `python3 scripts/build_favicons.py` whenever registry artwork changes, followed by the shared/offline checks and a new release.

Converted apps opt into the adaptive-canvas/copyright/presentation-header standard described in [styling and offline ownership](styling-and-offline.md). Bag of Tricks now uses a dedicated fullscreen-only title/version header while its normal-page actions stay in the introduction. Theme colors remain untouched; the abandoned white-canvas palette override is not part of the shared runtime.

### Bag of Tricks card illustrations

Cards mode owns four transparent PNG atlases in `assets/tricks/cards/`: Ace, Jack,
Queen and King (`*-suits-v1.png`). Each atlas uses a 2×2 grid: hearts and diamonds
on the top row, clubs and spades on the bottom. The local `.card-art` rules in
`tricks/index.html` select the rank image and suit position; number cards keep
their existing symbols. The localized card name and rank/suit corners remain
independent of decorative artwork. Queens have a continuous closed chin outline.

These assets were created with the built-in image-generation tool from the
approved concept. Prompt specification: rounded navy monoline chibi busts, oval
eyes, flat colors, no text or background; preserve King/Queen/Jack identity; use
heart/diamond/club/spade crown or cap gems and red/coral/teal/blue clothing by
suit. For Queens require a continuous U-shaped chin, separate from the neck.
Aces use only enlarged plain suit shapes, without flourishes or filigree.
Revision prompt: change only the club/spade royal emblems to navy-outlined
green/blue fills and match the two outer King/Queen crown gems; preserve the
heart/diamond artwork, closed Queen chin and atlas positions.

Keep artwork local and file-safe. New or replacement image filenames must be
added to the worker's app-shell inventory and the release bumped. PNG readiness
checks require the PNG type, signature and complete end marker. Run
`check_styles.py` (also checks the four artwork dependencies),
`check_card_art.cjs`, `check_tricks_layout.cjs` and `check_profile_offline.cjs`.
The artwork is supplied as four shared sheets rather than sixteen separate
requests; the current offline inventory contains 30 resources. Physical iPad
Safari sizing, fullscreen and offline behavior still need device verification.

My Tools defaults include every current catalog app except Google Class Scheduler.
Bag of Tricks is enabled. Defaults apply only without an existing selection;
saved selections (including an empty selection) remain unchanged. Home keeps
the full catalog independently of shortcut visibility.
