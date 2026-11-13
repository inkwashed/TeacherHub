/* Optional Playwright: canonical utility icons across site and presentation modes. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});let cases=0;try{
for(const width of [390,1280])for(const locale of ['en-US','ja-JP']){
 const c=await b.newContext({viewport:{width,height:900},locale,serviceWorkers:'block',reducedMotion:'reduce'});await c.addInitScript(()=>{localStorage.setItem('teacherTools.classroomTimer.tutorialSeen.v1','1');localStorage.setItem('teacherTools.bagOfTricks.tutorialSeen.v1','1');});
 for(const tool of ['','timer/','tricks/','spinner/','calendar/','tracker/','scheduler/','offline/']){const p=await c.newPage();await p.goto('http://localhost:8765/'+tool);
 async function verify(){for(const kind of ['presentation','settings'])for(const svg of await p.locator(`svg[data-shared-icon="${kind}"]`).all()){const style=await svg.evaluate(e=>{const s=getComputedStyle(e);return {w:s.width,h:s.height,fill:s.fill,stroke:s.stroke,line:s.strokeWidth,caps:s.strokeLinecap,join:s.strokeLinejoin,color:s.color};});assert.equal(style.w,kind==='presentation'?'21px':'23px');assert.equal(style.h,style.w);if(kind==='presentation'){assert.equal(style.fill,'none');assert.equal(style.stroke,style.color);assert.equal(style.line,'2px');assert.equal(style.caps,'round');assert.equal(style.join,'round');}else{assert.equal(style.fill,style.color);assert.equal(style.stroke,'none');}assert.equal(await svg.locator('path').count(),1);}}
 for(const theme of ['modern-blue','true-dark']){await p.evaluate(t=>TeacherToolsUI.applyGlobalTheme(t),theme);await verify();cases++;}
 if(['timer/','tricks/','spinner/'].includes(tool)){await p.locator('#presentationButton').click();await p.waitForFunction(()=>document.body.classList.contains('presentation-open'));await verify();await p.locator('#presentationButton').click();await p.waitForFunction(()=>!document.body.classList.contains('presentation-open'));}
 await p.close();}await c.close();
}console.log('PASS',cases,'page/size/language/theme cases: standard fullscreen/settings geometry, sizing, fill/stroke and presentation relocation.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
