/* Optional browser regression checks: requires Playwright. See docs/opening-and-verification.md. */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const origin = process.env.TEACHERHUB_URL || 'http://localhost:8765';
const files = ['index.html', ...['tracker','scheduler','calendar','spinner','timer','tricks','offline'].map(p => p + '/index.html')];
const launch = process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH,headless:true} : {headless:true};
const key = 'classAutomatorData_v3';
const valid = JSON.stringify({version:3,schools:[{id:'kept',name:'Existing School',location:'Kyoto',classes:['A'],periods:[],alternateSchedules:[],workingHours:{start:'08:00',end:'16:00'},teachersByClass:{A:'Teacher'},studentCounts:{A:25},lunch:{enabled:false},irregular:{enabled:false,periods:[],lunch:{enabled:false}},calendarColor:'#43877d',extra:'keep'}],schedule:{kept:['2026-11-09']},preferences:{selectedSchoolId:'kept',selectedClassBySchool:{kept:'A'}},extra:'keep'});
async function closeTutorial(page) {
  for (let i=0; i<3; i++) {const close=page.locator('[data-modal-close]:visible').first();if(!await close.count())break;await close.click();}
}
(async () => {
  const browser = await chromium.launch(launch);
  try {
    if (process.argv[2] === 'tracker') {
      const samples=[undefined,'','null','{}','[]','{broken','{"version":3,"schools":[null]}','{"version":3,"schools":{},"schedule":{}}','{"version":3,"schools":[],"schedule":{},"preferences":{}}',valid];
      for (const language of ['en','ja']) for (const raw of samples) {
        const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(({raw,key,language})=>{if(raw!==undefined&&!sessionStorage.getItem('seeded'))localStorage.setItem(key,raw);sessionStorage.setItem('seeded','yes');localStorage.setItem('teacherTools.siteLanguage.v1',JSON.stringify({version:1,language}));},{raw,key,language});
        await page.goto(origin+'/tracker/index.html');await closeTutorial(page);
        assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),raw??null,'Opening must preserve school data');
        assert.equal(await page.locator('#schoolSelect option').count(),raw?.includes('"schools":[]')?0:1);
        if(raw&&raw!==valid&&!raw.includes('"schools":[]')){const notice=await page.locator('#schoolDataNotice').textContent();assert(notice.includes(language==='ja'?'元のデータは変更されていません':'the original is unchanged'));}
        await page.locator('[data-modal-open="settingsModal"]').click();
        if(raw?.includes('"schools":[]'))await page.locator('[data-add-school]').click();
        const field=page.locator('[data-school-field="name"]');assert(await field.isVisible());
        if(raw===valid)assert.equal(await field.inputValue(),'Existing School');
        await field.fill('Edited School');await field.press('Tab');
        assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).schools[0].name,key),'Edited School');
        if(raw===valid){const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.extra,'keep');assert.equal(saved.schools[0].extra,'keep');assert.equal(saved.schedule.kept[0],'2026-11-09');assert.equal(saved.schools[0].studentCounts.A,25);}
        if(raw&&!['',valid].includes(raw)&&!raw.includes('"schools":[]'))assert(await page.evaluate(({key,raw})=>Object.keys(localStorage).some(k=>k.startsWith(key+'.recovery.')&&localStorage.getItem(k)===raw),{key,raw}));
        await page.locator('[data-school-settings-tab="periods"]').click();await page.locator('[data-school-settings-tab="schedule"]').click();await page.keyboard.press('Escape');
        if(raw===valid){await page.locator('#templateSelect').selectOption({index:1});await page.locator('#assignButton').click();const checkbox=page.locator('#checklist input[type=checkbox]').first();await checkbox.check();await page.reload();await closeTutorial(page);assert.equal(await page.locator('#schoolSelect').inputValue(),'kept');assert(await page.locator('#checklist input[type=checkbox]').first().isChecked());}
        assert.deepEqual(errors,[],`${language} ${raw}`);await context.close();
      }
      for (const language of ['en','ja']) {
        const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
        const raw='{recoverable-but-malformed';
        await context.addInitScript(({key,raw,language})=>{localStorage.setItem(key,raw);localStorage.setItem('teacherTools.siteLanguage.v1',JSON.stringify({version:1,language}));},{key,raw,language});
        await page.goto(origin+'/tracker/index.html');await closeTutorial(page);await page.locator('[data-modal-open="settingsModal"]').click();
        await page.evaluate(key=>{const real=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key||k.startsWith(key+'.recovery.'))throw new DOMException('Full','QuotaExceededError');return real.call(this,k,v);};},key);
        const field=page.locator('[data-school-field="name"]');await field.fill('Must not overwrite');await field.press('Tab');
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),raw);
        assert.equal(await page.locator('[data-settings-status]').textContent(),await page.locator('#schoolDataNotice').textContent());
        assert((await page.locator('[data-settings-status]').textContent()).length>0);
        await context.close();
      }
      console.log('PASS Tracker: 20 fresh/empty/malformed/valid language cases, school editing, settings tabs, preserved source/recovery, existing-data checklist reload, and 2 failed-save controller/adapter cases.');
    } else {
      let checked=0;const errors=[];
      for(const protocol of ['http','file'])for(const size of [{width:390,height:844},{width:768,height:1024},{width:1280,height:900}])for(const language of ['en','ja'])for(const theme of ['modern-blue','ocean-blue','color-pop','pretty-in-pink','true-dark','custom']){
        const context=await browser.newContext({viewport:size,serviceWorkers:'block',hasTouch:size.width<1000});
        await context.addInitScript(({theme,language})=>{try{localStorage.setItem('teacherTools.sitePreferences.v1',JSON.stringify({version:1,theme,customColors:{primary:'#2563eb',secondary:'#7c3aed',background:'#f5f8ff'}}));localStorage.setItem('teacherTools.siteLanguage.v1',JSON.stringify({version:1,language}));}catch{}},{theme,language});
        const page=await context.newPage();page.on('pageerror',e=>errors.push({protocol,theme,language,width:size.width,error:e.message}));
        for(const file of files){
          await page.goto(protocol==='file'?pathToFileURL(path.join(root,file)).href:origin+'/'+file);await closeTutorial(page);await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
          assert.equal(await page.evaluate(()=>document.documentElement.lang),language);
          assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme||'modern-blue'),theme);
          const sheets=await page.evaluate(()=>[...document.styleSheets].filter(s=>s.href).map(s=>{try{return s.cssRules.length}catch{return 'restricted'}}));assert.equal(sheets.length,3);assert(sheets.every(n=>n==='restricted'||n>0));
          assert(await page.evaluate(()=>[...document.querySelectorAll('link[rel=stylesheet]')].every(e=>!!e.sheet)));
          assert((await page.evaluate(()=>getComputedStyle(document.body).fontFamily)).includes('ui-rounded'));
          assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()),({'modern-blue':'#294f70','ocean-blue':'#1e40af','color-pop':'#8b5cf6','pretty-in-pink':'#db2777','true-dark':'#8ab4f8','custom':'#2563eb'})[theme]);
          // Every static and dynamically generated local link must stay inside this checkout.
          const links=await page.locator('a[href]').evaluateAll(es=>es.map(e=>e.href));
          for(const href of links){const u=new URL(href);if(u.protocol==='file:'){assert(u.pathname.startsWith(root+'/'));assert(u.pathname.endsWith('index.html'));}else if(u.origin===origin)assert(u.pathname.endsWith('index.html')||u.pathname.endsWith('/'));}
          for(const [button,panel] of [['siteSettingsButton','siteThemePanel'],['siteLanguageButton','siteLanguagePanel']]){
            await page.keyboard.press('Tab');await page.locator('#'+button).focus();assert(await page.locator('#'+button).evaluate(e=>e.matches(':focus-visible')));
            await page.locator('#'+button).click();const box=await page.locator('#'+panel).boundingBox();const width=await page.evaluate(()=>document.documentElement.clientWidth);assert(box&&box.x>=0&&box.x+box.width<=width+0.5,`${protocol} ${file} ${size.width}: clipped ${panel}`);assert(box.y+box.height<=size.height+0.5);
            await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),button);
          }
          if(file==='offline/index.html'&&protocol==='file'){assert(await page.locator('#protocolWarning').isVisible());for(const id of ['prepareButton','installButton','updateButton'])assert(await page.locator('#'+id).isDisabled());assert.equal(await page.locator('link[rel=manifest]').count(),0);}
          // Follow Home and a tool link, rather than only constructing file URLs in the test.
          if(file==='tracker/index.html'){await page.locator('a.site-brand').click();assert(page.url().endsWith('/index.html'));await page.locator('.app-shortcut[href="scheduler/index.html"]').click();assert(page.url().endsWith('/scheduler/index.html'));}
          checked++;
        }
        await context.close();console.log('matrix',protocol,size.width,language,theme);
      }
      assert.deepEqual(errors,[]);console.log('PASS',checked,'HTTP/file page-language-theme-size cases; local styles, navigation, panels, focus and disabled file-only installation.');
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
