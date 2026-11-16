/* Optional Playwright: dialog scrollbar paint follows the same theme as page scrollers. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});let cases=0;try{
for(const tool of ['','calendar','tracker','timer','tricks','spinner','scheduler'])for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:800},serviceWorkers:'block'}),page=await context.newPage();await page.goto('http://localhost:8765/'+(tool?tool+'/':''));
 for(const theme of ['modern-blue','ocean-blue','color-pop','pretty-in-pink','true-dark','custom']){
  await page.evaluate(theme=>TeacherToolsUI.applyGlobalTheme(theme),theme);
  const result=await page.evaluate(()=>{
   const probe=document.createElement('span');probe.style.color='var(--accent-border)';document.body.append(probe);const expected=getComputedStyle(probe).color;probe.remove();
   const targets=[...document.querySelectorAll('dialog, [role=dialog], dialog .site-profile-scroll, [role=dialog] .modal-content, [role=dialog] .tutorial-scroll, #previousNoteText')];
   return {expected,targets:targets.map(e=>({id:e.id||e.className,color:getComputedStyle(e).scrollbarColor,gutter:getComputedStyle(e).scrollbarGutter,existingGutter:e.classList.contains('themed-scroll'),thumb:getComputedStyle(e,'::-webkit-scrollbar-thumb').backgroundColor}))};
  });
  assert(result.targets.length>0);for(const target of result.targets){assert.equal(target.color,result.expected+' rgba(0, 0, 0, 0)',tool+' '+target.id);assert.equal(target.thumb,result.expected);assert.equal(target.gutter,target.existingGutter?'stable':'auto',tool+' '+target.id+' must not reserve new gutter');}cases++;
 }
 await page.emulateMedia({forcedColors:'active'});assert.equal(await page.locator('dialog, [role=dialog]').first().evaluate(e=>getComputedStyle(e).scrollbarColor),'auto');await context.close();
}console.log('PASS',cases,'page/size/theme cases: native and app dialogs, nested scrollers, theme thumbs, unchanged gutter and forced-color fallback.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
