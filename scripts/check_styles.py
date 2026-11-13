#!/usr/bin/env python3
"""No dependencies: validate shared CSS ownership and offline dependencies."""
from html.parser import HTMLParser
from pathlib import Path
import re
import json
import posixpath
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SHARED = ['foundation.css', 'site.css', 'components.css']


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links, self.releases, self.styles, self.local_links = [], [], [], []
        self.scripts = []
        self.inline_scripts = []
        self.script_buffer = None
        self.profile_inline = False
        self.tool = None
        self.shared_icons, self.tool_icons = [], []
        self.favicons = []
        self.in_style = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('href', 'src'):
            value = attrs.get(key, '')
            if value and not urlsplit(value).scheme and not value.startswith(('#', '//')):
                self.local_links.append(value)
        if tag == 'link' and 'icon' in attrs.get('rel', '').split():
            self.favicons.append(attrs)
        if tag == 'svg' and 'data-shared-icon' in attrs:
            self.shared_icons.append(attrs['data-shared-icon'])
        if 'data-tool-icon' in attrs:
            self.tool_icons.append(attrs['data-tool-icon'])
        if tag == 'body':
            self.tool = attrs.get('data-tool')
        if tag == 'script' and 'src' not in attrs and attrs.get('type', '') in ('', 'text/javascript', 'application/javascript'):
            self.script_buffer = []
        if tag == 'script' and 'src' in attrs:
            self.scripts.append(attrs)
        if tag == 'dialog' and attrs.get('id') == 'siteThemePanel':
            self.profile_inline = True
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.links.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name') == 'teacher-tools-release':
            self.releases.append(attrs.get('content'))
        if tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_style = False
        if tag == 'script' and self.script_buffer is not None:
            self.inline_scripts.append(''.join(self.script_buffer))
            self.script_buffer = None

    def handle_data(self, data):
        if self.in_style:
            self.styles.append(data)
        if self.script_buffer is not None:
            self.script_buffer.append(data)


def rules(css, context=()):
    """Walk balanced CSS blocks, retaining media context and declaration order."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    result = set()
    pos = 0
    while (opening := css.find('{', pos)) != -1:
        selector = re.sub(r'\s+', ' ', css[pos:opening]).strip()
        depth, end = 1, opening + 1
        quote = None
        while end < len(css) and depth:
            char = css[end]
            if quote:
                if char == quote and css[end - 1] != '\\':
                    quote = None
            elif char in ('"', "'"):
                quote = char
            elif char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
            end += 1
        assert depth == 0, 'Unbalanced CSS block'
        body = css[opening + 1:end - 1]
        if selector.startswith(('@media', '@supports', '@layer', '@container')):
            result.update(rules(body, context + (selector,)))
        else:
            result.add((context, selector, re.sub(r'\s+', '', body)))
        pos = end
    return result


def check():
    from build_favicons import expected_href
    worker = (ROOT / 'service-worker.js').read_text()
    release = re.search(r'const RELEASE = "([^"]+)"', worker)[1]
    inventory = re.search(r'const APP_SHELL = \[(.*?)\];', worker, re.S)[1]
    urls = [x[1].replace('${RELEASE}', release) for x in re.findall(r'(["`])([^"`]+)\1', inventory)]
    assert len(urls) == len(set(urls)), 'Duplicate offline inventory entries'
    for url in urls:
        assert url.startswith('/') and not url.startswith('//'), f'Nonlocal offline resource: {url}'
        path = ROOT / url.split('?')[0].lstrip('/')
        if path.is_dir():
            path /= 'index.html'
        assert path.is_file(), f'Missing offline resource: {url}'

    card_page = (ROOT / 'tricks/index.html').read_text()
    card_art = re.findall(r'url\("(\.\./assets/tricks/cards/[^"\s]+)"\)', card_page)
    assert len(card_art) == 4, 'Cards must use one atlas for each illustrated rank'
    for source in card_art:
        asset = (ROOT / 'tricks' / source).resolve()
        assert asset.is_file(), f'Missing card artwork: {source}'
        assert '/' + asset.relative_to(ROOT).as_posix() in urls, f'Card artwork missing offline: {source}'

    import html
    home = (ROOT / 'index.html').read_text()
    embedded_terms = re.search(r'<!-- license:start -->(.*?)<!-- license:end -->', home, re.S)
    assert embedded_terms and html.unescape(embedded_terms[1]) == (ROOT / 'LICENSE.txt').read_text(), 'Home terms differ from LICENSE.txt; run scripts/sync_terms.py'

    shared_rules = set()
    dependencies = set()
    for filename in SHARED:
        path = ROOT / 'assets/css' / filename
        css = path.read_text()
        assert css.rstrip().endswith(f'/* teacher-tools-release: {release} */'), f'{path}: stale release marker'
        assert '@import' not in css, f'{path}: use explicit local stylesheet links instead of @import'
        assert 'EIGO-STYLE-TRIAL:' not in css, f'{path}: approved styles must live with their component owners'
        parsed = rules(css)
        shared_rules.update(parsed)
        # Shared variants use zero-specificity page scopes; copied bare rules are still duplicates.
        scope = r'(?:body)?:where\((?:\[data-tool="[a-z]+"\](?:,\s*)?)+\)\s*'
        shared_rules.update((context, re.sub(scope, '', selector), body) for context, selector, body in parsed)
        for dependency in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)', css):
            if dependency.startswith(('data:', '#')):
                continue
            assert not dependency.startswith(('http:', 'https:', '//')), f'External CSS dependency: {dependency}'
            local = ROOT / dependency.lstrip('/') if dependency.startswith('/') else path.parent / dependency
            local = local.resolve()
            assert local.is_file(), f'Missing CSS dependency: {dependency}'
            dependencies.add('/' + local.relative_to(ROOT).as_posix())

    for filename in ('tools.js', 'toolbar.js', 'theme-bootstrap.js', 'ui.js', 'school-settings.js'):
        assert (ROOT / 'assets/js' / filename).read_text().rstrip().endswith(f'/* teacher-tools-release: {release} */'), f'{filename}: release mismatch'
    component_path = ROOT / 'assets/js/profile.js'
    component = component_path.read_text()
    assert component.rstrip().endswith(f'/* teacher-tools-release: {release} */'), 'Profile component release differs'
    assert component.count('id="siteProfileSync"') == 1, 'Profile must own one Sync section'
    assert 'data-site-data-tab="google"' not in component, 'Google sync is retired'
    assert component.count('data-site-data-tab=') == 2, 'Sync must have exactly two tabs'
    assert component.count('<dialog id="siteThemePanel"') == 1, 'Profile component must own exactly one modal template'
    catalog = json.loads(re.search(r'const catalog = (\[.*?\]);\n', (ROOT / 'assets/js/tools.js').read_text(), re.S)[1])
    home_page = Page((ROOT / 'index.html').read_text())
    home_links = home_page.local_links
    icons = json.loads(re.search(r'const icons = Object.freeze\((\{.*?\})\);', (ROOT / 'assets/js/tools.js').read_text(), re.S)[1])
    assert set(home_page.tool_icons) == {tool['id'] for tool in catalog}, 'Full Home catalogue must reuse registry icons'
    used_icons = set(Page(component).shared_icons)
    assert used_icons <= set(icons), 'Profile uses an unknown shared icon'
    inline_owners = {}
    assert len({tool['id'] for tool in catalog}) == len(catalog), 'Tool IDs must be unique'
    for tool in catalog:
        assert tool['href'] in home_links, f"Tool missing from the full Home catalogue: {tool['id']}"
        assert (ROOT / tool['href']).is_file(), f"Missing tool page: {tool['id']}"
    pages = [ROOT / 'index.html', *sorted(ROOT.glob('*/index.html'))]
    for path in pages:
        page = Page(path.read_text())
        assert set(page.shared_icons) <= set(icons), f'{path}: unknown shared icon'
        used_icons.update(page.shared_icons)
        assert len(page.favicons) == 1, f'{path}: keep exactly one favicon declaration'
        assert page.favicons[0].get('href') == expected_href(path, catalog), f'{path}: wrong/stale favicon; run python3 scripts/build_favicons.py'
        assert page.favicons[0].get('type') == 'image/svg+xml', f'{path}: wrong favicon type'
        for script in page.inline_scripts:
            if len(script) < 1000:
                continue
            normalized = re.sub(r'\s+', '', script)
            assert normalized not in inline_owners, f'{path}: large inline script duplicated from {inline_owners.get(normalized)}; use a shared local module'
            inline_owners[normalized] = path
        prefix = posixpath.relpath('assets/css', path.parent.relative_to(ROOT).as_posix())
        expected = [f'{prefix}/{name}?v={release}' for name in SHARED]
        for link in page.local_links:
            assert not link.startswith('/'), f'{path}: root-relative file link: {link}'
            target = (path.parent / urlsplit(link).path).resolve()
            assert target.is_relative_to(ROOT) and target.is_file(), f'{path}: missing/file-unsafe local link: {link}'
        for script in page.scripts:
            source = urlsplit(script['src'])
            assert not source.scheme and not script['src'].startswith('/'), f'{path}: external/file-unsafe script'
            resource = '/' + (path.parent / source.path).resolve().relative_to(ROOT).as_posix() + ('?' + source.query if source.query else '')
            assert resource in urls, f'{path}: script missing offline: {resource}'
        assert page.links == expected, f'{path}: shared stylesheet links/order differ'
        mounts = [attrs for attrs in page.scripts if 'data-teacher-tools-profile' in attrs]
        profile_scripts = [attrs for attrs in page.scripts if urlsplit(attrs['src']).path.endswith('/profile.js')]
        assert len(mounts) == len(profile_scripts) == 1, f'{path}: load Profile exactly once'
        mount = mounts[0]
        toolbar = [attrs for attrs in page.scripts if 'data-teacher-tools-toolbar' in attrs]
        registry = [attrs for attrs in page.scripts if 'data-teacher-tools-tools' in attrs]
        assert len(toolbar) == len(registry) == 1, f'{path}: toolbar/registry must load once'
        if path.parent.name not in ('offline', ROOT.name):
            assert page.tool == path.parent.name, f'{path}: shared tool-style scope missing/wrong'
        assert toolbar[0].get('data-page') == ('home' if path == ROOT / 'index.html' else path.parent.name), f'{path}: wrong toolbar identity'
        assert not re.search(r'<header[^>]*data-teacher-tools-header', path.read_text()), f'{path}: inline header returned'
        assert path.read_text().index(registry[0]['src']) < path.read_text().index(toolbar[0]['src']) < path.read_text().index(mount['src']), f'{path}: registry/toolbar/Profile order differs'
        assert not any(attr in toolbar[0] for attr in ('async','defer','type')), f'{path}: toolbar must mount synchronously'
        for filename, marker in [('theme-bootstrap.js', 'data-teacher-tools-bootstrap'), ('ui.js', 'data-teacher-tools-ui')]:
            scripts = [attrs for attrs in page.scripts if marker in attrs]
            assert len(scripts) == 1, f'{path}: shared {filename} must load exactly once'
            assert scripts[0]['src'].endswith('/' + filename + '?v=' + release), f'{path}: wrong shared script release'
            assert not any(attr in scripts[0] for attr in ('async','defer','type')), f'{path}: preserve synchronous {filename} startup'
        bootstrap = next(attrs for attrs in page.scripts if 'data-teacher-tools-bootstrap' in attrs)
        runtime = next(attrs for attrs in page.scripts if 'data-teacher-tools-ui' in attrs)
        source = path.read_text()
        assert source.index(bootstrap['src']) < source.index(page.links[0]), f'{path}: theme bootstrap must run before styling'
        assert source.index(mount['src']) < source.index(runtime['src']), f'{path}: shared UI must see mounted Profile'
        assert 'window.TeacherToolsUI = Object.freeze' not in source and 'const SHARED_TRANSLATIONS =' not in source, f'{path}: embedded shared runtime returned'
        assert 'let browserThemeColor =' not in source, f'{path}: embedded theme bootstrap returned'
        school = [attrs for attrs in page.scripts if 'data-teacher-tools-school-settings' in attrs]
        expected_school = path.parent.name in ('calendar','tracker','scheduler')
        assert len(school) == int(expected_school), f'{path}: school component ownership differs'
        if school:
            assert school[0]['src'].endswith('/school-settings.js?v=' + release), f'{path}: school component release differs'
            assert not any(attr in school[0] for attr in ('async','defer','type')), f'{path}: preserve school adapter startup order'
            assert source.index(runtime['src']) < source.index(school[0]['src']), f'{path}: shared UI must precede school component'
        assert 'window.TeacherToolsSchoolSettings = Object.freeze' not in source, f'{path}: embedded school controller returned'
        assert not re.search(r'<svg[^>]*>\s*<path d="M12,15\.5',source), f'{path}: copied settings artwork returned'
        assert not page.profile_inline, f'{path}: duplicated inline Profile modal'
        assert not any(token in path.read_text() for token in ['id="siteDataButton"','id="siteDataPanel"','googleSync.']), f'{path}: retired backup dropdown/Google sync returned'
        assert not any(attr in mount for attr in ('async', 'defer', 'type')), f'{path}: Profile mount must execute synchronously'
        expected_profile = posixpath.relpath('assets/js/profile.js', path.parent.relative_to(ROOT).as_posix()) + f'?v={release}'
        assert mount['src'] == expected_profile, f'{path}: wrong Profile component version/path'
        assert '/' + (path.parent / urlsplit(mount['src']).path).resolve().relative_to(ROOT).as_posix() + '?' + urlsplit(mount['src']).query in urls, f'{path}: Profile missing offline'
        assert path.read_text().index(mount['src']) < path.read_text().index('TEACHER-TOOLS:SHARED-BEHAVIOR:START'), f'{path}: mount Profile before shared UI initialization'
        assert page.releases == [release], f'{path}: stale document release'
        resolved = {'/' + (path.parent / urlsplit(link).path).resolve().relative_to(ROOT).as_posix() + '?' + urlsplit(link).query for link in page.links}
        assert resolved <= set(urls), f'{path}: stylesheet missing from offline inventory'
        assert not (rules('\n'.join(page.styles)) & shared_rules), f'{path}: shared CSS duplicated inline'
        document = path.read_text()
        assert document.index(page.links[-1]) < document.index('<style>'), f'{path}: tool styles must follow shared styles'
        assert 'TEACHER-TOOLS:SHARED-STYLES' not in document, f'{path}: embedded shared block remains'
    assert used_icons == set(icons), f'Unused shared SVG definitions: {set(icons) - used_icons}'
    assert dependencies <= set(urls), f'CSS dependencies missing offline: {dependencies - set(urls)}'
    print(f'PASS: {len(pages)} pages, {len(SHARED)} shared stylesheets, {len(urls)} offline resources; shared CSS/JS mounts and icons verified; no shared-rule or large inline-script duplication.')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release', help='Set a new release in the worker, pages, and shared CSS before checking')
    args = parser.parse_args()
    if args.release:
        assert re.fullmatch(r'teacher-tools-[a-z0-9-]+', args.release), 'Use a teacher-tools- release identifier'
        old = re.search(r'const RELEASE = "([^"]+)"', (ROOT / 'service-worker.js').read_text())[1]
        assert old != args.release, 'Choose a new release identifier'
        paths = [ROOT / 'service-worker.js', ROOT / 'index.html', *ROOT.glob('*/index.html'), *ROOT.glob('assets/css/*.css'), *ROOT.glob('assets/js/*.js')]
        for path in paths:
            path.write_text(path.read_text().replace(old, args.release))
    check()
