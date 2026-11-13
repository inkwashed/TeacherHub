# Approved appearance — adopted November 12, 2026

The spacing and shape trial was approved and incorporated into TeacherHub's permanent styling. Home retains the broader content column, roomier spacing and stronger headings; the shared toolbar keeps its quiet background and touch controls; tool shells and normal-mode buttons retain the approved rounding and spacing. Current appearance and saved choices are preserved.

There is no longer a trial override block or `revert_style_trial.py` helper. Change the owning rules directly: Home-only styling in `index.html`, header/Profile/navigation in `assets/css/site.css`, and shared tool components/normal-mode treatment in `assets/css/components.css`. See [styling and offline ownership](styling-and-offline.md) for the cascade and verification record.

The original reference values were consulted from ActivityHub at the user's request. All implementation remains local to TeacherHub, with no runtime dependency. Physical iPad/Safari touch, split-view, dialog focus and installed-app lifecycle still need device testing.
