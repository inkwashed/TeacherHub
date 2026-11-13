/* Optional Playwright: Profile cache faults and release updates, with a local fixture server.
 * Set TEACHERHUB_PRIOR_SOURCE to a JSON map of paths->contents captured before a refactor
 * to test the actual prior release. Otherwise a prior release is synthesized in memory.
 */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
    const worker = await fs.readFile(path.join(root,'service-worker.js'),'utf8');
    const release = worker.match(/const RELEASE = "([^"]+)"/)[1];
    const components = ['profile','tools','toolbar','theme-bootstrap','ui','school-settings'].map(name=>`/assets/js/${name}.js?v=${release}`);
    const cardAssets=['ace','jack','queen','king'].map(name=>`/assets/tricks/cards/${name}-suits-v1.png`);
    let component=components[0], failingFile='assets/js/profile.js';
    const prior = process.env.TEACHERHUB_PRIOR_SOURCE ? JSON.parse(await fs.readFile(process.env.TEACHERHUB_PRIOR_SOURCE,'utf8')) : null;
    let mode = 'current', failure = '';
    const server = http.createServer(async (req,res) => {
        const url = new URL(req.url,'http://localhost');
        const file = url.pathname.endsWith('/') ? url.pathname.slice(1)+'index.html' : url.pathname.slice(1);
        const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : 'application/json';
        res.setHeader('Content-Type',type); res.setHeader('Cache-Control','no-store');
        if (failure && file === failingFile) {
            if (failure === 'missing') {res.writeHead(404);res.end('missing');return;}
            if (failure === 'fallback') {res.setHeader('Content-Type','text/html');res.end('<html>fallback</html>');return;}
            res.end(failure === 'stale' ? '/* teacher-tools-release: old */' : '(() => {');return;
        }
        try {
            let body = mode === 'prior' && prior?.[file] !== undefined ? prior[file] : await fs.readFile(path.join(root,file));
            if (mode === 'prior' && !prior && !file.endsWith('.png')) body = body.toString().replaceAll(release,'teacher-tools-profile-test-prior');
            res.end(body);
        } catch {res.writeHead(404);res.end('missing');}
    });
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
    async function poll(page,predicate) {
        for (let n=0;n<200;n++) {
            try {if(await predicate()) return;} catch(e) {if(!e.message.includes('Execution context was destroyed'))throw e;}
            await page.waitForTimeout(100);
        }
        throw Error('Timed out waiting for worker state');
    }
    async function message(page,type='STATUS') {
        return page.evaluate(async type => {
            const reg=await navigator.serviceWorker.getRegistration('/');
            const worker=reg?.waiting||reg?.active||reg?.installing;
            if(!worker)return {ready:false};
            return new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(Error('worker timeout')),10000);channel.port1.onmessage=e=>{if(e.data.type==='PROGRESS')return;clearTimeout(timer);resolve(e.data);};worker.postMessage({type},[channel.port2]);});
        },type);
    }
    async function ready(page) {await poll(page,async()=>await page.evaluate(()=>!!navigator.serviceWorker.controller));await poll(page,async()=>(await message(page)).ready);}
    try {
        let context=await browser.newContext(),page=await context.newPage();
        await page.goto(origin+'/offline/');await ready(page);
        for(component of [...components,...cardAssets])for(const kind of ['missing','truncated','stale','fallback']){
            await page.evaluate(async({component,kind})=>{
                const reg=await navigator.serviceWorker.getRegistration('/');
                const keys=await caches.keys();const cache=await caches.open(keys.find(k=>k.startsWith('teacher-tools-')));
                if(kind==='missing')await cache.delete(component);
                else await cache.put(component,new Response(kind==='fallback'?'<html>fallback</html>':kind==='stale'?'/* teacher-tools-release: old */':'(() => {',{headers:{'Content-Type':kind==='fallback'?'text/html':'application/javascript'}}));
            },{component,kind});
            assert.equal((await message(page)).ready,false,kind+' cached component');
            assert.equal((await message(page,'CACHE_NOW')).ready,true);
        }
        failure='stale';assert.equal((await message(page,'CACHE_NOW')).ready,false);failure='';assert.equal((await message(page)).ready,true);
        await context.close();
        for(const source of [...components,...cardAssets])for(const kind of ['missing','truncated','stale','fallback']){
            failingFile=source.slice(1).split('?')[0];failure=kind;context=await browser.newContext();page=await context.newPage();await page.goto(origin+'/offline/');await page.waitForTimeout(700);
            assert.equal((await message(page)).ready,false,kind+' fresh preparation');await context.close();
        }
        failure='';console.log('PASS Profile and card artwork missing/truncated/stale/fallback cache and network responses cannot report Ready; repair succeeds; failed refresh retains a complete cache.');
        mode='prior';context=await browser.newContext();page=await context.newPage();await page.goto(origin+'/offline/');await ready(page);const old=await message(page);assert.notEqual(old.release,release);
        mode='current';failingFile='assets/js/toolbar.js';failure='missing';await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration('/');await r.update();});await page.waitForTimeout(700);assert.equal((await message(page)).release,old.release);
        await context.setOffline(true);await page.reload();await ready(page);await context.setOffline(false);failure='';
        await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration('/');await r.update();});await poll(page,async()=>await page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration('/'))?.waiting));
        assert.equal((await message(page)).release,release);assert.equal((await message(page)).ready,true);
        await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration('/');r.waiting.postMessage({type:'SKIP_WAITING'});});
        await poll(page,async()=>await page.evaluate(async()=>{const keys=await caches.keys();return keys.length===1;})&&(await message(page)).release===release);
        await ready(page);await context.setOffline(true);
        for(const tool of ['','scheduler/','calendar/','spinner/','timer/','tracker/','tricks/','offline/']){
            await page.goto(origin+'/'+tool);await page.reload();
            for(let n=0;n<3;n++){const close=page.locator('[data-modal-close]:visible').first();if(!await close.count())break;await close.click();}
            assert.equal(await page.locator('script[data-teacher-tools-profile]').count(),1);
            assert.equal(await page.locator('[data-teacher-tools-header]').count(),1);
            assert.equal(await page.locator('script[data-teacher-tools-toolbar]').count(),1);
            assert.equal(await page.locator('#sitePinnedTools>a').count(),(await page.evaluate(()=>TeacherToolsTools.read().visible)).length);
            assert.equal(await page.locator('script[data-teacher-tools-bootstrap]').count(),1);assert.equal(await page.locator('script[data-teacher-tools-ui]').count(),1);assert(await page.evaluate(()=>!!TeacherToolsUI&&!!TeacherToolsCalendarValidate));if(['calendar/','tracker/','scheduler/'].includes(tool))assert(await page.evaluate(()=>!!TeacherToolsSchoolSettings&&!!TeacherToolsSchoolSettingsModel));for(const svg of await page.locator('svg[data-shared-icon]').all())assert(await svg.locator('path').count());if(tool==='')assert.equal(await page.locator('[data-tool-icon] svg').count(),6);
            if(tool===''){
                await page.locator('#open-license').click();
                assert(await page.locator('#license-dialog').evaluate(e=>e.open));
                assert.equal(await page.locator('.license-text').textContent(),await fs.readFile(path.join(root,'LICENSE.txt'),'utf8'));
                await page.keyboard.press('Escape');
            }
            if(tool==='tricks/'){
                await page.evaluate(async assets=>{await Promise.all(assets.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=src;})));},cardAssets);
                await page.locator('#cardsTab').click();
                for(let n=0;n<52;n++)await page.locator('#drawButton').click();
                assert(await page.locator('#drawButton').isDisabled());
                await page.locator('#shuffleButton').click();
            }
            const favicon=page.locator('link[rel~="icon"]');assert.equal(await favicon.count(),1);const faviconPrefix=tool===''?'assets/pwa/teacher-tools-icon.svg':tool==='offline/'?'../assets/pwa/teacher-tools-icon.svg':'data:image/svg+xml,';assert((await favicon.getAttribute('href')).startsWith(faviconPrefix));
            assert.equal(await page.locator('#siteThemePanel').count(),1);
            assert.equal(await page.locator('#siteProfileSync').count(),1);
            assert.equal(await page.locator('#siteDataButton,#siteDataGoogleTab').count(),0);
            assert.equal(await page.locator('#siteProfileSync [role=tab]').count(),2);
            assert.equal(await page.locator('.site-profile-details .site-theme-options').count(),1);
            await page.locator('#siteSettingsButton').click();assert(await page.locator('#siteThemePanel').evaluate(e=>e.open));assert.equal(await page.locator('.site-theme-preview').first().evaluate(e=>e.offsetWidth),22);await page.keyboard.press('Escape');
        }
        await context.close();
        console.log(`PASS ${prior?'actual captured':'synthetic'} prior cache: failed component update retains prior release; complete update activates shared Profile, cleans old cache, and all eight pages reload/open Profile offline.`);
    } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
