# Teacher Tools

A collection of browser-based tools for helping ALTs and teachers with daily tasks, class planning, and classroom activities.

The new deployment target is [tools.letseigo.com](https://tools.letseigo.com). Tools can be installed and prepared for offline use through the `/offline/` page. Data is saved in the user's browser. Open **Profile → Sync** to export/import backups or link a local data file in supported desktop browsers.

## Development and testing

Edit the actual site files in this folder directly. Preview and test the same files; there is no separate Workbench Preview or migration step into a live folder. Local edits do not change the published site.

From the repository root, run `python3 -m http.server 8765`, then open [the local site](http://localhost:8765/). Use the same local address when checking saved data. Prepared pages and styles are served together from the active offline release, even online. On the offline page, check for and apply an update when changes do not appear.

Fix bugs in place and leave changes uncommitted while the owner tests them. The owner decides when to commit and push for rollout. Contributors and coding agents must not commit, push, publish, or deploy unless explicitly asked. See [AGENTS.md](AGENTS.md) for project development standards.

Directly opening `index.html` also supports styling and ordinary local navigation. It does **not** support installation, offline preparation, or updates, and browser storage may not be shared reliably between files. Use the local HTTP server for data and offline testing. See [opening modes and regression checks](docs/opening-and-verification.md).

## Deployment

This is a static site with no build step. Publish the repository root, including `CNAME`, `service-worker.js`, `offline.webmanifest`, and `assets/`. The site expects to run at the root of its custom domain, rather than under a GitHub repository subpath.

Before pushing, confirm that `git remote -v` points to `https://github.com/inkwashed/TeacherHub.git`, not the original ALT-Resources repository. Configure the new repository's GitHub Pages deployment and custom domain for `tools.letseigo.com`, and configure DNS for that deployment. The `CNAME` file alone does not configure hosting or DNS.

## Styling and offline preparation

The approved appearance is permanent. Shared local CSS lives in `assets/css/`; common tool shells, dialogs, controls and school-settings styles have shared owners, with genuine tool variants kept local. Shared JavaScript now includes the early theme bootstrap, general UI runtime, school model/controller, toolbar/tool registry and Profile in `assets/js/`. Tool logic and storage/recovery adapters remain local. Tool/utility SVG geometry is centralized in the registry. Configure Home and header shortcuts in Profile → My tools beneath the themes; all apps remain in the full Home catalog. See [shared asset ownership and next opportunities](docs/shared-assets.md). See [styling and offline ownership](docs/styling-and-offline.md) for the cascade, tool-specific boundaries, offline update behavior, and how to add files. Run `python3 scripts/check_styles.py` to check shared styles and required offline dependencies.

## Original site and development data

The original site will remain available through the end of December 2026. Keep its repository and hosting configuration separate from this deployment.

Browser data and installed web apps belong to their original domain and do not transfer automatically. Users should export a JSON backup from the original site, restore it on the new site, and check their data before retiring the old installation. TeacherHub is unpublished: avoid unnecessary development data loss, but unpublished test-data compatibility does not constrain a cleaner design. Any local test-data reset should be discussed first. Linked data files must be connected again on the new domain. Google Drive sync is not offered.
