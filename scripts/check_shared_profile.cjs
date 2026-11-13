/* Optional Playwright check for the shared Profile mount, themes, focus and file mode. */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const origin = 'http://localhost:8765';
const key = 'teacherTools.sitePreferences.v1';
const files = ['index.html', ...['scheduler','calendar','spinner','timer','tracker','tricks','offline'].map(p => p + '/index.html')];
const themes = ['modern-blue','ocean-blue','color-pop','pretty-in-pink','true-dark','custom'];
async function closeTutorial(page) {
    for (let n = 0; n < 3; n++) {
        const close = page.locator('[data-modal-close]:visible').first();
        if (!await close.count()) break;
        await close.click();
    }
}
(async () => {
    const browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
    let cases = 0, themeChecks = 0;
    try {
        for (const protocol of ['http', 'file']) for (const width of [390, 768, 1280]) for (const language of ['en', 'ja']) {
            const context = await browser.newContext({viewport:{width,height:900}, serviceWorkers:'block'});
            await context.addInitScript(({key,language}) => {
                localStorage.setItem('teacherTools.siteLanguage.v1', JSON.stringify({version:1,language}));
                if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({version:1,theme:'modern-blue',extra:'keep',profile:{name:'Component Test',extra:'keep'}}));
            }, {key,language});
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            for (const file of files) {
                await page.goto(protocol === 'file' ? pathToFileURL(path.join(root,file)).href : origin + '/' + file);
                await closeTutorial(page);
                assert.equal(await page.locator('script[data-teacher-tools-profile]').count(), 1);
                assert.equal(await page.locator('#siteThemePanel').count(), 1);
                assert(await page.locator('#siteThemePanel').evaluate(e => e instanceof HTMLDialogElement));
                await page.evaluate(() => {TeacherToolsProfile.open();document.getElementById('siteThemePanel').close();TeacherToolsProfile.openSync();});
                await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
                assert(await page.locator('#siteThemePanel').evaluate(e => e.open && !e.hidden && !!e.getClientRects().length), 'Queued old close event must not hide reopened Profile');
                assert.equal(await page.locator('#siteSettingsButton').getAttribute('aria-expanded'), 'true');
                assert(await page.locator('#siteThemePanel').evaluate(e => e.open));
                assert.equal(await page.locator('#siteThemeTitle').textContent(), language === 'ja' ? 'プロフィール' : 'Profile');
                assert.equal(await page.locator('#siteProfileNameText').textContent(), 'Component Test');
                assert.equal(await page.locator('[name=siteThemeChoice]').count(), themes.length);
                assert.equal(await page.locator('#siteDataButton,#siteDataPanel,#siteDataGoogleTab,#siteDataGooglePanel').count(), 0);
                assert.equal(await page.locator('#siteProfileSync [role=tab]').count(), 2);
                assert.equal(await page.locator('#siteProfileSyncTitle').textContent(), language === 'ja' ? '同期' : 'Sync');
                const palette = await page.locator('.site-profile-themes').boundingBox();
                const nameField = await page.locator('.site-profile-name-field').boundingBox();
                assert(palette.y >= nameField.y + nameField.height && Math.abs(palette.x - nameField.x) < 1, 'Themes must sit directly below Name');
                const dot = await page.locator('.site-theme-preview').first().evaluate(e=>({width:e.offsetWidth,height:e.offsetHeight,radius:getComputedStyle(e).borderRadius,gradient:getComputedStyle(e).backgroundImage}));
                assert.equal(dot.width,22);assert.equal(dot.height,22);assert.equal(dot.radius,'50%');assert(dot.gradient.includes('linear-gradient(135deg'));
                assert.equal(await page.locator('.site-theme-option').first().evaluate(e=>e.offsetWidth),44);
                const sync = await page.locator('#siteProfileSync').boundingBox();
                const field = await page.locator('.site-profile-name-field').boundingBox();
                assert(width <= 760 ? sync.y > field.y + field.height : sync.x >= field.x + field.width, 'Sync must be beside Name or stacked below it');
                assert(await page.locator('#siteThemePanel').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
                await page.locator('#siteDataExportTab').focus();
                await page.keyboard.press('ArrowRight');
                assert.equal(await page.locator('#siteDataFileTab').getAttribute('aria-selected'), 'true');
                assert(await page.locator('#siteDataFilePanel').isVisible());
                if (protocol === 'file') assert(await page.locator('#siteLinkedDataCreate').isDisabled());
                await page.keyboard.press('ArrowRight');
                assert.equal(await page.locator('#siteDataExportTab').getAttribute('aria-selected'), 'true', protocol+' '+file+' '+width+' Sync arrow wrap');
                assert(await page.locator('#siteDataExportPanel').isVisible());
                for (const theme of themes) {
                    await page.locator(`[data-theme-option="${theme}"]`).click();
                    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme || 'modern-blue'), theme);
                    assert.equal(await page.locator('[name=siteThemeChoice]:checked').inputValue(), theme);
                    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
                    assert.equal(saved.theme, theme);
                    assert.equal(saved.profile.name, 'Component Test');
                    assert.equal(saved.profile.extra, 'keep');
                    assert.equal(saved.extra, 'keep');
                    themeChecks++;
                }
                await page.locator('#siteCustomPrimary').evaluate(e => {e.value = '#112233'; e.dispatchEvent(new Event('input', {bubbles:true}));});
                assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).customColors.primary, key), '#112233');
                await page.locator('#siteCustomThemeReset').click();
                assert.equal(await page.locator('#siteCustomPrimary').inputValue(), '#2563eb');
                const box = await page.locator('#siteThemePanel').boundingBox();
                assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= 901);
                await page.locator('#siteThemeCloseButton').focus();
                await page.keyboard.press('Shift+Tab');
                assert.equal(await page.evaluate(() => document.activeElement.id), 'siteDataImportButton');
                await page.keyboard.press('Tab');
                assert.equal(await page.evaluate(() => document.activeElement.id), 'siteThemeCloseButton');
                if (protocol === 'file') {
                    const saved = await page.evaluate(key => localStorage.getItem(key), key);
                    await page.locator('#siteProfileUseSelfie').click();
                    assert(await page.locator('#siteProfileStatus').evaluate(e => e.classList.contains('error')));
                    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), saved);
                }
                await page.locator('#siteThemeCloseButton').click();
                await page.waitForFunction(() => !document.body.classList.contains('site-profile-open') && document.activeElement.id === 'siteSettingsButton');
                assert.equal(await page.evaluate(() => document.activeElement.id), 'siteSettingsButton');
                assert.equal(await page.locator('#siteSettingsButton').getAttribute('aria-expanded'), 'false');
                await page.locator('#siteLanguageButton').click();
                await page.locator('#siteSettingsButton').click();
                assert(await page.locator('#siteLanguagePanel').evaluate(e => e.hidden));
                await page.keyboard.press('Escape');
                if(file==='tricks/index.html'){await page.locator('#diceTab').click();assert(await page.locator('#dicePanel').isVisible());await page.locator('#siteSettingsButton').click();assert.equal(await page.locator('#siteDataExportTab').getAttribute('aria-selected'),'true');assert(await page.locator('#siteDataExportPanel').isVisible());await page.keyboard.press('Escape');}
                cases++;
            }
            assert.deepEqual(errors, []);
            await context.close();
            console.log('checked', protocol, width, language);
        }
        console.log(`PASS ${cases} page/language/size/protocol cases and ${themeChecks} theme selections; single component, persistence, custom reset, focus wrapping/restore, overlay coordination, file-mode transfer refusal.`);
    } finally {
        await browser.close();
    }
})().catch(error => {console.error(error); process.exitCode = 1;});
