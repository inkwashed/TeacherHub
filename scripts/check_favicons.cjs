/* Optional Playwright: browser-tab identity stays app-specific, including direct files. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),origin='http://localhost:8765';
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});let cases=0;try{
for(const protocol of ['http','file']){
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),toolIcons=new Set();
 for(const tool of ['home','calendar','tracker','timer','spinner','tricks','scheduler','offline']){
  const file=tool==='home'?'index.html':tool+'/index.html';await page.goto(protocol==='file'?pathToFileURL(path.join(root,file)).href:origin+'/'+file);
  const icons=page.locator('link[rel~="icon"]');assert.equal(await icons.count(),1);const href=await icons.getAttribute('href');
  if(['home','offline'].includes(tool))assert(href.endsWith('assets/pwa/teacher-tools-icon.svg'));
  else {assert(href.startsWith('data:image/svg+xml,'));toolIcons.add(href);const svg=decodeURIComponent(href.split(',').slice(1).join(','));assert(svg.includes('viewBox="0 0 32 32"'));assert(!svg.includes('teacher-tools-icon'));}
  assert(await page.evaluate(href=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth>0);image.onerror=()=>resolve(false);image.src=href;}),href),'Favicon must decode/render');
  for(const language of ['en','ja'])for(const theme of ['modern-blue','ocean-blue','color-pop','pretty-in-pink','true-dark','custom']){await page.evaluate(({language,theme})=>{TeacherToolsUI.applyGlobalLanguage(language);TeacherToolsUI.applyGlobalTheme(theme);},{language,theme});assert.equal(await icons.count(),1);assert.equal(await icons.getAttribute('href'),href,'Shared UI must not replace app favicon');cases++;}
 }
 assert.equal(toolIcons.size,6,'Every tool has a distinct favicon');await context.close();
}
console.log('PASS',cases,'HTTP/file page/language/theme cases: one stable favicon, six distinct app icons, decodable local artwork, site identity retained on Home/offline.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
