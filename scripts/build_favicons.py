#!/usr/bin/env python3
"""Build self-contained app favicons from the shared tool registry; no dependencies."""
from pathlib import Path
import argparse
import json
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]


def catalog():
    source = (ROOT / 'assets/js/tools.js').read_text()
    return json.loads(re.search(r'const catalog = (\[.*?\]);\n', source, re.S)[1])


def favicon_href(tool):
    # These are generated derivatives, not a second hand-maintained icon source.
    source = tool['icon']
    assert 'viewBox="0 0 28 28"' in source, 'Review favicon scaling for a changed registry viewBox'
    geometry = re.fullmatch(r'<svg\b[^>]*>(.*)</svg>', source, re.S)[1]
    geometry = geometry.replace('class="icon-fill"', 'fill="#deecf7" stroke="none"')
    geometry = geometry.replace('class="icon-cell"', 'fill="#deecf7" stroke="none"')
    geometry = geometry.replace('class="icon-star"', 'fill="#deecf7" stroke="#fff"')
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
           '<rect width="32" height="32" rx="7" fill="#294f70"/>'
           '<g transform="translate(2 2)" fill="none" stroke="#fff" stroke-width="1.7" '
           'stroke-linecap="round" stroke-linejoin="round">' + geometry + '</g></svg>')
    return 'data:image/svg+xml,' + quote(svg, safe='')


def expected_href(page, tools):
    if page == ROOT / 'index.html':
        return 'assets/pwa/teacher-tools-icon.svg'
    tool = next((tool for tool in tools if tool['id'] == page.parent.name), None)
    return favicon_href(tool) if tool else '../assets/pwa/teacher-tools-icon.svg'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if generated favicon declarations are stale')
    args = parser.parse_args()
    tools = catalog()
    for page in [ROOT / 'index.html', *sorted(ROOT.glob('*/index.html'))]:
        source = page.read_text()
        pattern = r'<!-- TEACHER-TOOLS:FAVICON:START -->.*?<!-- TEACHER-TOOLS:FAVICON:END -->'
        assert len(re.findall(pattern, source, re.S)) == 1, f'{page}: expected one managed favicon block'
        block = ('<!-- TEACHER-TOOLS:FAVICON:START -->\n'
                 f'    <link rel="icon" type="image/svg+xml" href="{expected_href(page, tools)}">\n'
                 '<!-- TEACHER-TOOLS:FAVICON:END -->')
        result = re.sub(pattern, lambda match: block, source, flags=re.S)
        if args.check:
            assert result == source, f'{page}: stale favicon; run python3 scripts/build_favicons.py'
        elif result != source:
            page.write_text(result)
    print('PASS: one generated app favicon per tool; Home/offline retain the site icon.')


if __name__ == '__main__':
    main()
