#!/usr/bin/env python3
"""Embed canonical terms in Home without a runtime fetch (including file://)."""
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parent.parent
page = ROOT / 'index.html'
text, count = re.subn(
    r'(<!-- license:start -->).*?(<!-- license:end -->)',
    lambda match: match[1] + html.escape((ROOT / 'LICENSE.txt').read_text()) + match[2],
    page.read_text(), flags=re.S,
)
assert count == 1, 'Expected exactly one Home terms block'
page.write_text(text)
print('Updated Home terms from LICENSE.txt')
