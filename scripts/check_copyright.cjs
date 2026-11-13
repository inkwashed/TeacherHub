/* Optional Playwright: Home terms in HTTP/file modes, themes and native-dialog focus. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),terms=fs.readFileSync(path.join(root,'LICENSE.txt'),'utf8');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});let cases=0;try{
for(const protocol of ['http','file'])for(const width of [320,390,768,1280])for(const language of ['en','ja']){
 const c=await b.newContext({viewport:{width,height:800},serviceWorkers:'block',reducedMotion:'reduce'});
 await c.addInitScript(language=>localStorage.setItem('teacherTools.siteLanguage.v1',JSON.stringify({version:1,language})),language);
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(protocol==='http'?'http://localhost:8765/':pathToFileURL(path.join(root,'index.html')).href);
 const opener=p.locator('#open-license'),dialog=p.locator('#license-dialog'),body=dialog.locator('.license-text');
 assert.equal(await body.textContent(),terms);assert.equal(await body.getAttribute('lang'),'en');
 assert.equal(await opener.textContent(),language==='ja'?'利用条件・著作権':'Use & copyright');
 for(const theme of ['modern-blue','ocean-blue','color-pop','pretty-in-pink','true-dark','custom']){
  await p.evaluate(theme=>TeacherToolsUI.applyGlobalTheme(theme),theme);
  await opener.focus();await p.keyboard.press('Enter');assert(await dialog.evaluate(e=>e.open));
  assert.equal(await p.evaluate(()=>document.activeElement.id),'close-license');
  const box=await dialog.boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=800);
  assert(await body.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  const closeBox=await p.locator('#close-license').boundingBox();assert(closeBox.width>=44&&closeBox.height>=44);
  await body.focus();await p.keyboard.press('End');await body.evaluate(e=>e.scrollTop=e.scrollHeight);assert(await body.evaluate(e=>e.scrollTop>0));
  await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'close-license');await p.evaluate(()=>document.getElementById('open-license').focus());assert(await dialog.evaluate(e=>e.contains(document.activeElement)));
  await p.keyboard.press('Escape');assert(!await dialog.evaluate(e=>e.open));assert.equal(await p.evaluate(()=>document.activeElement.id),'open-license');
  await opener.click();await p.locator('#close-license').click();assert(!await dialog.evaluate(e=>e.open));
  cases++;
 }
 assert.deepEqual(errors,[]);await c.close();
}console.log('PASS',cases,'HTTP/file, phone/tablet/desktop, both-language and theme terms dialogs; canonical text, scrolling, focus containment/return, Escape and close.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
