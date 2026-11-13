/* Optional Playwright: first visit, saved choices and language removal across pages. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});let cases=0;try{
for(const locale of ['ja-JP','en-US'])for(const tool of ['','calendar/','tracker/','timer/','spinner/','tricks/','scheduler/','offline/']){
 const c=await b.newContext({locale,serviceWorkers:'block'}),p=await c.newPage();await p.goto('http://localhost:8765/'+tool);
 const lang=locale.slice(0,2);assert.equal(await p.locator('html').getAttribute('lang'),lang);assert.equal(await p.locator('#siteLanguageChoice').inputValue(),lang);assert.equal(await p.evaluate(()=>localStorage.getItem('teacherTools.siteLanguage.v1')),null);
 await p.evaluate(l=>TeacherToolsUI.applyGlobalLanguage(l),lang==='ja'?'en':'ja');await p.reload();assert.equal(await p.locator('html').getAttribute('lang'),lang==='ja'?'en':'ja');cases++;await c.close();
}
for(const raw of ['{broken','{}','{"version":1,"language":"fr"}',null]){
 const c=await b.newContext({locale:'ja-JP',serviceWorkers:'block'});await c.addInitScript(raw=>{if(raw!==null)localStorage.setItem('teacherTools.siteLanguage.v1',raw);},raw);const p=await c.newPage();await p.goto('http://localhost:8765/');assert.equal(await p.locator('html').getAttribute('lang'),'ja');assert.equal(await p.evaluate(()=>localStorage.getItem('teacherTools.siteLanguage.v1')),raw);assert.equal(await p.locator('.home-report-link').textContent(),'不具合を報告');cases++;await c.close();
}
const c=await b.newContext({locale:'ja-JP',serviceWorkers:'block'}),p=await c.newPage();await p.goto('http://localhost:8765/');await p.evaluate(()=>TeacherToolsUI.applyGlobalLanguage('en'));const second=await c.newPage();await second.goto('http://localhost:8765/');await second.evaluate(()=>localStorage.removeItem('teacherTools.siteLanguage.v1'));await p.waitForFunction(()=>document.documentElement.lang==='ja');assert.equal(await p.locator('#siteLanguageChoice').inputValue(),'ja');await c.close();
console.log('PASS',cases,'fresh/saved/malformed locale cases across all eight pages; translated Home and cross-tab preference removal.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
