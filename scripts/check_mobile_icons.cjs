/* Optional Playwright: home-screen identity is discoverable before offline preparation. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict'),path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});try{
const tools=['','calendar','tracker','timer','tricks','spinner','scheduler','offline'];let cases=0;
for(const protocol of ['http','file'])for(const tool of tools){
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();const relative=(tool?tool+'/':'')+'index.html';await page.goto(protocol==='http'?'http://localhost:8765/'+relative:pathToFileURL(path.resolve(__dirname,'..',relative)).href);
 const touch=page.locator('link[rel=apple-touch-icon]');assert.equal(await touch.count(),1);assert.equal(await touch.getAttribute('sizes'),'180x180');assert((await touch.getAttribute('href')).endsWith('assets/pwa/apple-touch-icon.png'));
 assert.equal(await page.locator('link[rel=manifest]').count(),protocol==='http'?1:0);assert.equal(await page.locator('link[rel=icon]').count(),1);
 if(protocol==='http'){
  assert.equal(new URL(await page.locator('link[rel=manifest]').getAttribute('href')).pathname,'/offline.webmanifest');
  const pixels=await page.evaluate(async()=>{
   const results=[];
   for(const [url,size]of [['/assets/pwa/apple-touch-icon.png',180],['/assets/pwa/teacher-tools-icon-192.png',192],['/assets/pwa/teacher-tools-icon-512.png',512]]){
    const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,size,size).data;
    results.push({w:img.naturalWidth,h:img.naturalHeight,size,opaque:data.every((v,i)=>i%4!==3||v===255),whiteCorner:[...data.slice(0,4)].every(v=>v===255),hasArtwork:data.some((v,i)=>i%4!==3&&v<200)});
   }return results;
  });for(const icon of pixels){assert.equal(icon.w,icon.size);assert.equal(icon.h,icon.size);assert(icon.opaque&&icon.whiteCorner&&icon.hasArtwork);}
  assert.equal(await page.evaluate(async()=> (await caches.keys()).length),0,'Icon discovery must not require preparing an offline cache');
 }await context.close();cases++;
}console.log('PASS',cases,'HTTP/file page cases: declared Apple icon, opaque padded 180/192/512 PNGs, HTTP manifest, file guard, no offline preparation and preserved browser favicons.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
