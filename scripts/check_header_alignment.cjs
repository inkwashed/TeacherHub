/* Optional Playwright: shared header edges match the approved Let's EiGo! spacing. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});let cases=0;try{
for(const width of [320,390,620,768,1096,1280,1920])for(const locale of ['en-US','ja-JP']){
 const context=await browser.newContext({viewport:{width,height:900},locale,serviceWorkers:'block'}),page=await context.newPage();
 for(const tool of ['','calendar','tracker','timer','tricks','spinner','scheduler','offline']){
  await page.goto('http://localhost:8765/'+(tool?tool+'/':''));
  const rect=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,right:r.right,h:r.height,cy:r.y+r.height/2}};return {identity:box('.site-identity'),actions:box('.site-header-actions'),profile:box('#siteSettingsButton'),header:box('.site-header-inner'),brand:box('.site-brand-mark'),title:box('.site-brand-copy'),cloud:box('#siteOfflineStatusButton svg'),cloudButton:box('#siteOfflineStatusButton'),pinned:box('#sitePinnedTools'),lastPin:box('#sitePinnedTools a:last-child'),compact:document.querySelector('.site-header').classList.contains('is-compact'),overflow:document.documentElement.scrollWidth>innerWidth};});
  const edge=width<=380?12:width<=620?20:Math.max(24,(width-1096)/2);
  assert(Math.abs(rect.identity.x-edge)<1,JSON.stringify({tool,width,locale,edge,rect})+' left edge');assert(Math.abs(rect.actions.right-(width-edge))<1,tool+' right edge');assert(Math.abs(rect.profile.right-rect.actions.right)<1,'Profile remains at the outer right edge');assert.equal(rect.brand.h,38);assert.equal(rect.header.h,width<=480? (width<=380?104:106):56,JSON.stringify({tool,width,locale,rect}));assert(!rect.overflow);assert(Math.abs(rect.cloud.cy-rect.cloudButton.cy)<1,'Cloud artwork stays vertically centered');if(!rect.compact)assert(Math.abs(rect.lastPin.right-rect.pinned.right)<1,'Shortcuts align to the right of the middle column');
  if(!tool)assert(Math.abs(rect.title.x-(edge+(width<=380?44:46)))<1,'Home title follows the 38px logo and responsive gap');cases++;
 }await context.close();
}console.log('PASS',cases,'page/language/size cases: matching left/right edges, responsive header height, 38px mark, title position and containment.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
