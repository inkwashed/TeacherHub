# Styling and offline ownership

TeacherHub owns its local styles. It has no styling dependency on ActivityHub, Let's EiGo!, a CDN, externally hosted fonts, or a build service. Cross-site visual alignment is a later stage. This extraction preserves the current design rather than introducing a new theme system.

## CSS ownership and cascade

Every page loads these stylesheets in this order, before its tool-specific inline `<style>`:

1. `assets/css/foundation.css`: theme tokens (including custom-theme hooks), reset, typography, base page behavior, keyboard focus.
2. `assets/css/site.css`: shared header and navigation, language panel, Profile modal and its Sync/backup/file controls.
3. `assets/css/components.css`: contextual help, form/optional-mode patterns, applet identity, getting-started dialogs, and shared responsive integration. This file also owns the common tool-shell/dialog primitives, shared school-settings styling and approved normal-mode app treatment. Header responsiveness belongs in `site.css`.

The approved appearance is permanent: shared component bases load before local tool variants, and deliberate normal-mode selectors retain sufficient specificity to apply consistent spacing and controls. Fullscreen/presentation exceptions stay explicit. The small local `theme-bootstrap.js` loads synchronously before CSS so the selected theme is applied before rendering. Tool styles load last and retain their existing overrides. Do not wrap this foundation in cascade layers or reorder it without comparing all tools and themes.

Calendar grids/events, spinner graphics, timer displays, presentation modes, tool layouts, and tool-specific dialog variants remain with their tools. Similar-looking tool shells have intentional differences in width, spacing, weight, borders, and responsive behavior; do not normalize these incidentally. The general shared UI runtime lives in `assets/js/ui.js`; the registry, toolbar, Profile component and Selfie modules are local shared scripts. See [shared asset ownership and next opportunities](shared-assets.md).

Put a genuinely common rule in the shared stylesheet that owns it. Keep a tool-only rule local. For a deliberate local override, include only the properties that differ; do not paste the common block into the page. `scripts/check_styles.py` rejects exact shared-rule duplication, including within media queries.

## Add or change shared files

- Use document-relative local stylesheet links so direct-file opening can find the files. Resolve these to root paths when adding them to the offline inventory. Ordinary navigation must target explicit `index.html` files, not local directories. Add a new shared file to every relevant page in the correct cascade position and to `APP_SHELL` in `service-worker.js` in the same change. Update `SHARED` in `scripts/check_styles.py` if the common file list changes.
- Essential files must not depend on `@import` or remote assets. Any local `url(...)` dependency must exist and be in the offline inventory. The check enforces this for shared CSS.
- Give every release a new identifier. Run `python3 scripts/check_styles.py --release teacher-tools-YYYY-MM-DD-description-N` to update the worker, document metadata, stylesheet/component query strings, and CSS/shared-component end markers together, then validate them. Use a unique identifier for subsequent changes to any cached page, stylesheet, icon, or manifest.
- Keep the release marker at the end of each shared CSS file. It helps reject stale/truncated files and fallback HTML. Page release metadata and a closing HTML document are checked too. These are consistency checks, not cryptographic integrity checks.
- Serve the repository root with `python3 -m http.server 8765`. Preview the actual site at `http://localhost:8765/`. There is no separate Workbench or copy-to-live step.

## Offline preparation and updates

Installation prepares all eight pages, the three shared stylesheets, local registry/toolbar/Profile/Selfie scripts, theme bootstrap, shared UI and school-settings modules, icons, four Bag of Tricks card-art atlases, and manifest (30 required files), even when users have only opened the install/offline page. Stylesheet URLs include the release identifier.

The worker validates the complete download before writing it to its release cache. Missing/non-success responses, redirected resources, incorrect CSS/HTML content types, old release markers, and incomplete documents/stylesheets fail preparation. Readiness rechecks the required cache entries rather than assuming a successful installation remains complete. A failed refresh leaves an existing complete cache available; interrupted writes or evicted required files cannot pass readiness.

Prepared pages and styles are served from the active release cache, including when online. This is an intentional change from network-first page navigation: it prevents new HTML from being paired with previously cached styling. A new release is installed completely before activation. On the offline page, **Check for updates**, then **Apply update**, replaces the prepared release and reloads that page. Other open tabs may need reloading. Old caches are removed on activation. `/tool/index.html` and navigation query strings use the prepared `/tool/` page.

The offline page inspects/prepares a waiting update in preference to the active release, and waits for installation to finish before claiming an update check is complete. If installation fails, the prior active release remains usable. The readiness panel clears its ready styling on failure.

Broader follow-ups, outside this extraction: richer update coordination across open tabs, a storage-persistence/quota and eviction strategy, integrity hashes, and clearer recovery guidance. Browser/OS eviction can still remove offline data. Arbitrary unprepared URLs have no guaranteed offline fallback; the inventory covers the site's actual pages. Let's EiGo! offline packs are not part of this foundation.

## Opening modes

Use local HTTP for full development and HTTPS/prepared installation for the hosted offline experience. Direct-file opening supports local styling and ordinary navigation, but not service-worker installation, preparation, or updates; storage availability/sharing is browser-dependent. See [opening modes and regression checks](opening-and-verification.md).

## Verification

Run `python3 scripts/check_styles.py` without installing anything. It checks all pages, stylesheet order, release consistency, exact shared-rule duplication, and offline dependency coverage. No existing automated test suite or package/build system preceded this stage.

For browser verification, compare before/after across every page with Ocean Blue, Color Pop, Pretty in Pink, True Dark, and Custom themes at desktop and tablet sizes. Include keyboard focus, appearance/backup panels, help dialogs, and narrow navigation. Prepare offline from a fresh isolated browser profile, disconnect, then reload and navigate to all pages without first visiting each individually. Test a prior cached worker updating to the current one, a failed update, missing cached files, and missing/truncated/stale/wrong-content-type stylesheet responses. Verify readiness and repair behavior. Do not clear the owner's saved data to run these tests.

Physical iPad checks remain necessary for Safari's installed web app lifecycle and storage eviction, portrait/landscape and split view, touch controls, native selects/color pickers, dialog scrolling/focus with an external keyboard, and offline relaunch/update after the OS suspends the app. Desktop Chrome at tablet dimensions cannot establish these results.

## Typography and visual direction

Teacher Tools follows Let's EiGo!'s rounded system-font stack (`ui-rounded`, Arial Rounded MT Bold, Trebuchet MS, Arial), with Japanese system fallbacks. The same stack serves branding, headings, body copy, and controls. The unused Alegreya/Urbanist/Comfortaa trial font files and their associated licenses have been removed; no bundled font files are needed. Modern Blue is now the default for browsers without a saved theme, using the reference blue-gray palette. Ocean Blue, Color Pop, Pretty in Pink, True Dark, and Custom remain selectable; saved theme selections are respected. Panel shapes and tool layouts are unchanged. Reference values are maintained locally; no ActivityHub files are runtime dependencies.

## Working brand icon

The Home header/favicon, offline-page favicon and install icons use the approved paper-airplane/open-book logo in `assets/pwa/teacher-tools-icon.svg`. It preserves the original Let's EiGo! airplane geometry, blue circle, offset ring, and palette, with a book behind the airplane; the approved composition raises both foreground elements together. The SVG is owned locally and has no ActivityHub runtime dependency. The 192px and 512px install PNGs are rendered from that vector. Header icons use a transparent backing so the logo sits directly on the navigation background. The separate Teacher Tools wordmark uses the shared rounded system typography.

## Profile modal and local avatar copy

The header Profile button opens the native `siteThemePanel` dialog on every page. Its markup, localized controls and Profile-specific behavior now have one owner in `assets/js/profile.js`, mounted synchronously after the shared toolbar and initialized after page parsing; see [shared component loading and audit](shared-assets.md). It retains all six themes and stores a local name and avatar in `teacherTools.sitePreferences.v1`. The receiver's **Use Selfie** / **Update Selfie** flow copies only strictly validated versioned avatar choices through a user-confirmed popup, and renders with locally bundled My Selfie vector artwork. It never reads the main site's storage directly or synchronizes in the background. Custom-photo import and rendering have been removed. The retired photo field is cleared locally while preserving names, validated My Selfie choices, and unrelated preferences; backups cannot restore nonempty photo fields. The name is read-only until the pencil button opens its editor, with Save/Cancel and Escape-to-cancel. Site preferences backups include and validate the editable choices.

The confirmed sender URL is `https://letseigo.com/apps/avatar/transfer.html`, with no `www` alias. The receiver is implemented; the real Let’s EiGo! sender is not. Profile uses a compact icon-and-text Selfie action and a pencil name editor; the explanatory copy and external editor link are intentionally omitted. Runtime files are local and included in the offline app shell; ActivityHub is not a runtime dependency. See [selfie-transfer.md](selfie-transfer.md) for the exact schema, renderer snapshot, configuration, message/ACK contract, storage behavior, sender task, and receiver-only verification limits.

Theme choices sit directly beneath Name, beside the selfie, rather than in a full-width footer row. Each 22px circular preview has a diagonal primary/tertiary split separated by a thin secondary-color line; the existing tertiary preview color is retained (the background color for Custom). Transparent 44px hit areas keep touch targets usable, arranged as a compact three-by-two palette that wraps further when needed. Localized titles and radio names remain, with a selection ring, keyboard-focus outline and forced-color styling. Custom color controls stay beneath the palette.

Profile uses native modal focus/inert behavior, explicit Tab wrapping, Escape/close focus restoration, a scrollable small-screen layout, and localized controls. Physical iPad/Safari checks remain necessary for popup confirmation, focus, and installed/offline lifecycle. Only the retired custom-photo field is removed; other saved data is retained and no origin migration is performed.

## Profile → Sync

Backup and restore live inside the one shared Profile modal. On wider screens the **Sync** section is to the right of Name; at 760px and below it stacks beneath the identity area. Profile remains one scrollable native dialog, with theme choices beneath Name inside the identity area. Name/Selfie feedback stays beside Name so long backup lists do not push it away from its controls.

**Export** retains saved-data selection, full/selected JSON download, and backup import, including supported older backup formats. **File sync** retains create/link, autosave, pull, save, permission/error messages and disconnect. Its beta desktop Chrome/Edge limitations remain; direct-file opening disables linked-file controls while manual export/import remain available. There is no Google sync tab, placeholder or connection flow. No backup schema, saved-data keys or synchronization behavior changed.

The offline-page data-protection button opens Profile's Export tab through `TeacherToolsProfile.openSync()`. Other app help now points to Profile → Sync. The retired header backup button and standalone data panel must not be reintroduced. Sync tabs use roving keyboard focus with arrow/Home/End navigation, and consume those keys before a tool's page shortcuts can act on them. Export download clicks do not dismiss Profile.

## Reusable scroll regions

`foundation.css` owns opt-in `.themed-scroll`: stable gutter, transparent track and theme border-colored thumb, plus WebKit fallback and native forced-color handling. Use `--scrollbar-surface` when a region's backing differs from the default surface. Profile's scrolling body and Home's `.home-scroll` use this class. No other tool's scrolling layout is implicitly changed.

Home uses a viewport-height flex shell: the shared header is outside the independently scrolling main/footer region, so the scrollbar starts below navigation. Root scrollbar gutter is disabled only on `html.home-page`. Modal opening locks the Home region without resetting its position. Navigation menus stay outside that region and retain their own short-screen overflow behavior. The approved spacing and shapes are permanent component styles, with Home-specific rules in `index.html`; there is no removable trial layer or rollback helper.

Verified three viewport widths in Modern Blue and True Dark, fixed header geometry while content/footer scroll, shared Profile colors, scroll-position retention and no horizontal overflow. Browser/OS scrollbar visibility preferences still apply.

The below-navigation shell now applies to all eight pages through `html.site-scroll-page` and `.site-page-scroll.themed-scroll`. Each wrapper contains only page content; shared Profile and app modals stay outside it. Scheduler's existing content/shell/footer structure is retained inside the wrapper. A positioned scroll region contains absolute hidden announcements without changing viewport-fixed presentation behavior. Tool grids and inner panels retain their own sizing.

Verified the seven app/offline pages at 390/768/1280px in Modern Blue/True Dark: scrollbar region below header, fixed document/header while content scrolls, matching Profile thumb colors, retained scroll position and no horizontal overflow. Passed 96 toolbar HTTP/file page/language/size cases, presentation and preference flows, shared-resource checks, offline repair/update and all-page Profile use. Physical iPad installed-app scrolling still requires device testing.


## Permanent styling and redundancy cleanup — November 12, 2026

The approved roomier Home, quiet header, rounded panels and pill-shaped action buttons are now the baseline. Edit the owning rules rather than appending a second visual trial. Home-only declarations live in Home's inline stylesheet; header/Profile/navigation rules and breakpoints live in `site.css`; common tool shells, controls, dialogs and scoped `.shared-school-settings` rules live in `components.css`. The school model/controller and each tool's adapters remain unchanged. Keep tool widths, dense layouts, calendar graphics, spinner/timer visuals and presentation rules local where they differ.

Shared bases replace repeated inline definitions. Generic variants use explicit `data-tool` scopes on each tool body so a common rule cannot accidentally restyle a different tool. Responsive shared variants retain precedence over their base declarations. When adopting an existing component in a new tool, include its ID in the appropriate scope and compare that tool at the relevant breakpoints. Local styles should contain meaningful variants, rather than full copies of the base. The stylesheet check rejects exact shared-rule copies, including matching media contexts. Normal-mode app treatment intentionally excludes presentation/fullscreen; base declarations needed in those modes are not automatically obsolete just because ordinary mode overrides them.

The toolbar controller owns shortcut collapse through `is-compact`, allowing focus to move before shortcuts become hidden. Do not reintroduce breakpoint-only hiding that races the controller. Keep header styles together in `site.css`, including narrow panel containment and the approved touch-target sizing.

Retired navigation/menu selectors, the former Home shortcut-editor strings/styles, unused optional-control styles, trial markers and rollback helper have been removed. The 13 unused font/license files occupied 888,113 bytes and were already outside the required offline inventory. Active Selfie artwork/schema, brand SVG and installation PNG sizes remain local and intact. No preferences or app data are reset by this cleanup. The subsequent shared JavaScript/SVG cleanup centralizes the runtime, bootstrap, school controller and full Home catalog icons; see [shared asset ownership](shared-assets.md).


Verification of the permanent-style cleanup used isolated Chrome contexts and the actual pre-cleanup source snapshot. Passed 816 settled before/after page, Profile and help scenes across all eight pages, English/Japanese, all six themes and widths 320/390/768/1280px. Animation was disabled for comparison; incidental hover on the underlying help trigger was excluded from modal snapshots and tested explicitly in the state checks. Passed 180 before/after scenes covering keyboard focus, hover, existing-school settings and tabs, and Timer/Spinner/Bag of Tricks presentation modes at phone/desktop widths in Modern Blue and True Dark.

The existing 96 toolbar cases and interaction suite passed, including icon-only Home shortcuts, customization, cross-page persistence, responsive focus transfer and Timer presentation entry/exit. The 96 Profile component cases passed, including 576 theme selections, HTTP/direct files, focus wrapping/restoration and custom reset. Registry preference and Tracker recovery unit checks pass. The shared-style checker now recognizes scoped shared variants when detecting copied bare rules, checks each tool's style-scope identity and rejects revival of the retired trial layer. At that stage the worker inventoried 23 local files (the later JavaScript extraction brings it to 26); no new network dependency was introduced.

This pass centralized 48 generic component/control rule groups plus 73 school-settings rules, replacing 375 inline copies with shared definitions and retaining deliberate local variants. HTML/CSS source is approximately 39 KB smaller; font removal saves a further 888 KB in the checkout (those fonts were not part of offline preparation). Shared JavaScript behavior was not consolidated. Physical iPad Safari touch, split-view, external-keyboard/dialog behavior and installed/offline lifecycle still require device testing. No owner browser data was reset, and nothing was committed or deployed.

Final offline fault/repair checks passed for the permanent-style release, including failed refresh preserving a complete cache and a successful update from the captured pre-cleanup release. All eight pages reopened with their shared styles and Profile offline. Desktop/phone Home, Calendar, Tracker settings and Timer presentation screenshots were visually reviewed.


## App favicons

Each tool has exactly one app-specific SVG favicon in its head; Home and the offline page use the site logo. The shared header/UI does not change favicon links. The earlier uniform favicon blocks had pointed every tool directly to the site logo; no second JavaScript override was found.

Run `python3 scripts/build_favicons.py` after changing registry artwork. It generates the self-contained favicon links from `assets/js/tools.js`, using the approved blue tile and a fixed 28px artwork viewport inside a 32px icon. `python3 scripts/build_favicons.py --check` and the normal shared-style check reject stale/wrong/multiple favicon declarations. The generated SVG derivatives are embedded in each cached HTML page, so direct files and prepared offline pages need no extra asset download or runtime icon assignment. Bump the release after generating changed pages. Shared theme/language changes intentionally leave tab identity stable.

Browser tab favicons are separate from `offline.webmanifest` and the offline page's Apple touch icon, which continue to identify the installed collection as Teacher Tools. Existing prepared copies need the normal Check for updates / Apply update flow and a reload of other open tabs. Physical Safari/iPad tab-icon presentation and icon-cache behavior still need device confirmation.


## Bag of Tricks embedded layout — November 13, 2026

Bag of Tricks v1.0.3 is the first tool to use an embedded normal-page layout. Its redundant inner app header is removed; fullscreen and help sit beside the introductory heading, with the description spanning the row beneath. The app shell retains its semantic/runtime role but has no normal-mode background, border, shadow, corner treatment or inner padding. Content uses a centered maximum width of 1060px, and the footer is quiet, unboxed page content. Coin/dice/card stages retain their tool-specific visuals. These overrides are local to `tricks/index.html`; other apps keep their existing layouts until individually updated.

The fullscreen root still contains the controls and randomizers. Presentation mode hides introduction text/help/footer as before, retains the exit control and mode tabs, and uses the viewport-filling layout with a theme background. Browser fullscreen denial still falls back to the same viewport presentation; Escape and the exit button restore the normal embedded layout. Controls keep 44px touch targets, localized labels and visible keyboard focus. The existing shared question-mark styling now supports the in-content action group as well as app headers.

A headerless tool supplies `data-app-version` on its `.app-shell`. The shared toolbar reads that before falling back to the existing inner-header badge used by other tools. Update this attribute and the local footer translations together when changing the tool version; do not keep an empty inner header just to supply version metadata.

Passed 96 HTTP/direct-file theme/language/size cases at 320/390/768/1280px, with no horizontal clipping or heading/control overlap, plus help/focus and version identity checks. Passed eight language/size flows covering standard/cat/dog coin styles, two dice, card draw/shuffle, all modes in presentation, native fullscreen exit and denied-fullscreen fallback/Escape. The 96 all-page toolbar cases and interaction suite passed, preserving other app identities/controls. Desktop/phone and fullscreen screenshots were reviewed. Physical iPad Safari touch, split view, rotation and native/fullscreen behavior remain device checks. No owner data was reset, committed or deployed.

The final embedded-layout release also passed fresh offline preparation, required-file failure/repair checks and updating the actual captured previous cache. All eight prepared pages reopened offline. Shared stylesheet/resource ownership, favicon generation, toolbar syntax and whitespace checks pass.


## Converted app page standard — November 13, 2026

Apply this pattern one tool at a time as requested; currently Bag of Tricks v1.0.6 opts into `body.app-page`. Home and unconverted apps retain their existing layouts. Converted content uses the theme surface directly: `--app-canvas: var(--surface)`. This follows the supplied original-app references: plain white/light content in light themes, dark content in dark themes, subtle tinted panels, and stronger accents on controls and result artwork. The short-lived whole-page accent mix is removed. The pure-white experiment and its gray surface/contrast overrides were removed. Do not replace the selected theme's accent, panel, text or color-scheme tokens to enforce a white canvas; the app region now inherits them unchanged. The site header and Profile retain the normal selected theme.

Normal app footers use a single copyright line: “Let’s EiGo! Teacher Tools © 2026 letseigo.com · All rights reserved.” Remove duplicate version numbers and status messaging there. The version remains in the shared top toolbar via `data-app-version` on the tool shell.

Fullscreen retains a dedicated `.app-presentation-header`, hidden in normal view. It shows a localized app name/version at left and presentation controls at right. Bag of Tricks moves the existing action group into that header on entry and restores it before the introduction paragraph on exit; it does not create duplicate buttons/IDs. The header stays at the top while presentation content scrolls. Help/footer/introduction remain hidden in presentation as before, and both native fullscreen and viewport fallback/Escape restore the normal controls. Presentation and normal app content use the same adaptive canvas; no empty normal-page app header is reintroduced.

`check_app_page.cjs` passes seven built-in/custom light-dark cases, confirming the surface adapts while palette tokens, saved colors and color scheme remain unchanged, and Home/Timer remain outside the new pattern. `check_tricks_layout.cjs` passes 96 HTTP/file language/theme/size layouts and eight complete randomizer/native/fallback fullscreen flows, including copyright and restored title/version assertions. Shared icon and all-page toolbar regressions pass. Prepared offline pages and an update from the captured white-canvas release pass the required-file failure/repair and complete-cache checks. Physical iPad Safari split view, rotation, touch/native fullscreen and installed/offline lifecycle remain device checks. No owner data was reset or deployed.

Converted app title/version pairs use a centered horizontal row in both normal navigation and the fullscreen header. The normal row keeps the version visible and can truncate the title only at constrained widths; narrow layouts use tighter decorative-icon spacing and 14px titles without reducing navigation button touch targets. Home and unconverted app identities retain their current layout. Alignment is checked by bounding-box centers in both languages and phone/tablet/desktop layouts.


## Viewport copyright footer — November 13, 2026

Bag of Tricks v1.0.8 places its copyright footer directly under `body`, after the activity's `.site-page-scroll`, rather than inside the app shell. The existing viewport-height flex layout reserves the actual header and footer heights automatically; only the activity region scrolls. This follows the reference app-shell/copyright/viewport separation in Let’s EiGo! without importing ActivityHub code or assets. The footer stays at the bottom for short and long pages, wraps on narrow screens, includes safe-area bottom padding and cannot cover the last activity controls. It is hidden during native/fallback presentation and restored on exit.

The shared converted-page footer rule owns spacing/color, and the obsolete local scrolling-footer rule is removed. Tests passed 96 HTTP/file theme/language/size layouts, including a forced-scroll assertion that the footer's viewport position stays unchanged, plus all eight native/fallback randomizer flows. Offline preparation/update/failure checks passed against the captured previous footer layout. Card-art concepts are preview-only and have not been installed or added to offline resources.


### Illustrated cards (v1.0.9)

Bag of Tricks uses four local transparent PNG atlases for A/J/Q/K. Number cards,
localized names and rank/suit corners retain their existing behavior. The worker
requires all four atlases before declaring the release ready, including when
Bag of Tricks has never been opened individually. PNG checks reject missing,
HTML fallback and truncated responses. Artwork revisions bump the shared release
so prepared installations receive the current images with the current page.
Shared CSS and file-safe paths remain unchanged.

### Embedded Classroom Timer (v1.0.1)

Timer now opts into `body.app-page`, alongside Bag of Tricks. The converted
transparent app shell and 44px in-content utility controls are owned once in
`components.css` (`.app-actions`); mode layouts and timer visuals remain local.
Normal mode puts Countdown/Stopwatch tabs beside fullscreen/help/settings, with
controls above the tabs on phones. The site toolbar supplies the inline app
name/version; no empty inner header remains. Presentation moves the same control
group into the shared title/version header, retaining Timer's existing hidden
help/settings behavior. Exit restores the controls and focus.

The copyright footer is a direct body child outside the activity scroll region
and is hidden in presentation. The canvas follows the theme surface, including
dark/custom themes, without changing accents. Storage keys, presets, timekeeping,
alerts and keyboard shortcuts are unchanged. `check_timer_layout.cjs` covers
HTTP/file layouts, themes, both languages, countdown/stopwatch, dialogs, saved
presets and fullscreen/fallback. Check alerts/audio, touch, safe areas and
fullscreen behavior on a physical iPad Safari before release.

Timer v1.0.2 places Quick presets in a vertical 144px column (matching the three 44px utility buttons and two 6px gaps) below the utility
controls at widths of 761px and above. The countdown and duration inputs share
the remaining column; saved presets use the same stack. Smaller layouts retain
presets below the timer. Presentation continues to hide setup/presets, and
Stopwatch does not show countdown presets. These grid rules are Timer-local.

On wide Timer layouts, the preset sidebar uses size containment so its contents
cannot enlarge the countdown grid rows. Its button list scrolls independently,
bounded by the main column and viewport; the heading stays above the list.
Buttons retain their minimum touch height and focus padding. Phone layouts
retain ordinary page flow, and presentation continues to hide the sidebar.

Bag of Tricks v1.0.10 removes the general introductory heading/copy. Its mode tabs
and utility controls share a top row; wide layouts use a consistent 144px options
column below the centered utility controls for coin style and dice count. Cards
retain their deck status in the main column. Phones keep options above the
activity; presentation retains its existing compact controls and moves the same
utility group into the title/version header. These variants remain tool-local.

### Embedded Spinner Wheel (v1.2.1)

Spinner now opts into `body.app-page` and reuses the converted shell, shared
utility controls, inline toolbar version, presentation identity and body-level
copyright footer. The normal wheel card is transparent and borderless. Its
summary and fullscreen/help/settings controls share a row on wide screens;
phones put utility controls above the summary. The same controls move into the
presentation header, with help/settings hidden as before. Existing wheel canvas,
result card, responsive presentation layout and sounds remain local. Spin/action
buttons use pills. Spinner storage schemas, saved lists and selection algorithms
are unchanged. `check_spinner_layout.cjs` covers HTTP/file appearance, themes,
languages, dialogs, number/custom spins, exclusions, round removal/restore,
list persistence and native/fallback presentation. Physical iPad Safari touch,
fullscreen, audio and safe-area verification still need device testing.

### Shared converted-app control rows

Timer, Bag of Tricks and Spinner use `.app-control-row` and
`.app-control-content` from `components.css`. The normal-page standard is 56px
high (44px tab/button targets plus 5px inset and 1px border on each edge).
Spinner's status text gets the same minimum content height. Body-level tokens
`--app-control-height`, `--app-sidebar-width` (144px), and `--app-column-gap`
(16px) own these dimensions. Tool-local main/options grids consume these tokens
rather than repeating widths. Utility groups are centered over the side column,
including Bag of Tricks' two-button group. At 620px and below, all three use a
44px utility row, 8px gap and 56px content row. Minimum heights may grow if text
requires extra room for accessibility. Shared rules are scoped out of
presentation mode so each tool retains its dedicated fullscreen layout.

Spinner normal-page bottom padding is 12px, with no reserved empty status height
on wide layouts. Its normal wheel is capped by available viewport height as well
as the 520px maximum, preventing unnecessary desktop scrolling while retaining
ordinary scrolling when a genuinely small viewport needs it. Presentation sizing
remains independent.
