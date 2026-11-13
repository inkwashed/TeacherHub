/* Optional Playwright: all 52 ranks/suits, local atlas loading and layout. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});let draws=0;try{
for(const protocol of ['http','file'])for(const width of [320,768,1280])for(const language of ['en','ja']){
 const c=await b.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'});
 await c.addInitScript(language=>{localStorage.setItem('teacherTools.siteLanguage.v1',JSON.stringify({version:1,language}));localStorage.setItem('teacherTools.bagOfTricks.tutorialSeen.v1','{"version":1,"seen":true}');},language);
 const p=await c.newPage();await p.goto(protocol==='http'?'http://localhost:8765/tricks/':pathToFileURL(path.resolve(__dirname,'../tricks/index.html')).href);
 await p.locator('#cardsTab').click();const names=new Set(),art=new Set();
 for(let n=0;n<52;n++){
  await p.locator('#drawButton').click();const card=p.locator('.playing-card:not(.empty)').first();names.add(await card.getAttribute('aria-label'));
  const sprite=card.locator('.card-art');if(await sprite.count()){
   const data=await sprite.evaluate(async e=>{const s=getComputedStyle(e),url=s.backgroundImage.slice(5,-2);const img=new Image();img.src=url;await img.decode();const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return {id:e.dataset.rank+e.dataset.suit,w:img.naturalWidth,h:img.naturalHeight,inside:a.x>=b.x&&a.y>=b.y&&a.right<=b.right&&a.bottom<=b.bottom};});
   assert(data.w>0&&data.w===data.h&&data.inside);art.add(data.id);
   if(protocol==='http'&&language==='en'&&data.id==='Qhearts')await p.screenshot({path:`/private/tmp/teacherhub-card-art-${width}.png`,fullPage:true});
  }else assert.equal(await card.locator('.card-center').count(),1);
  draws++;
 }
 assert.equal(names.size,52);assert.equal(art.size,16);assert(await p.locator('#drawButton').isDisabled());
 for(const theme of ['modern-blue','ocean-blue','color-pop','pretty-in-pink','true-dark','custom']){await p.evaluate(t=>TeacherToolsUI.applyGlobalTheme(t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.locator('#shuffleButton').click();assert.equal(await p.locator('.card-art').count(),0);assert(!await p.locator('#drawButton').isDisabled());
 await c.close();
}console.log('PASS',draws,'draws: all 52 unique cards, 16 illustrated cards, 36 number cards, both languages, HTTP/file and phone/tablet/desktop; local atlas decode, themes and shuffle.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
