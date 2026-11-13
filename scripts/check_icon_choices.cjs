/* Optional Playwright: approved detail styling in every icon host, including synced notes. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const origin='http://localhost:8765';
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});let cases=0;try{
for(const width of [390,768,1280])for(const language of ['en','ja']){
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 await c.addInitScript(language=>{localStorage.setItem('teacherTools.siteLanguage.v1',JSON.stringify({version:1,language}));localStorage.setItem('teacherTools.sitePreferences.v1',JSON.stringify({version:1,theme:'modern-blue',appPanel:{version:1,order:['calendar','tracker','tricks','timer','spinner','scheduler'],visible:['calendar','tracker','tricks','timer','spinner','scheduler']}}));localStorage.setItem('classAutomatorData_v3',JSON.stringify({version:3,schools:[{id:'test',name:'Test School',classes:['A'],periods:[],alternateSchedules:[],workingHours:{start:'08:00',end:'16:00'},teachersByClass:{},studentCounts:{},lunch:{enabled:false},irregular:{enabled:false,periods:[],lunch:{enabled:false}},calendarColor:'#43877d'}],schedule:{},preferences:{selectedSchoolId:'test'}}));localStorage.setItem('teacherTools.classCalendar.state.v1',JSON.stringify({version:1,timeZone:'Asia/Tokyo',preferences:{view:'week',days:[1,2,3,4,5],ghostMode:'off',working:false,school:'',category:''},events:[{id:'review',title:'Review',schoolId:'test',className:'A',location:'',category:'Class',notes:'Source note',created:'',modified:'',date:'2026-11-12',start:'09:00',end:'09:45',mode:'custom'}]}));},language);
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const tool of ['home','tricks','tracker']){
  await p.goto(origin+'/'+(tool==='home'?'index.html':tool+'/index.html'));for(let n=0;n<3;n++){const b=p.locator('[data-modal-close]:visible').first();if(!await b.count())break;await b.click();}
  if(tool==='tracker'){await p.locator('#schoolSelect').selectOption('test');await p.locator('#classSelect').selectOption('A');await p.locator('#dashboardTab-notes').click();assert.equal(await p.locator('.calendar-note-badge .icon-cell').count(),1);assert.equal(await p.locator('.calendar-note-badge').getAttribute('aria-hidden'),null);assert.equal(await p.locator('.calendar-note-badge').getAttribute('role'),'img');}
  await p.evaluate(()=>TeacherToolsProfile.openNavigation());
  for(const theme of ['modern-blue','ocean-blue','color-pop','pretty-in-pink','true-dark','custom']){
   await p.evaluate(theme=>TeacherToolsUI.applyGlobalTheme(theme),theme);
   const result=await p.evaluate(()=>{const probe=document.createElement('span');document.body.append(probe);probe.style.color='var(--accent)';const accent=getComputedStyle(probe).color;probe.style.color='var(--accent-soft)';const soft=getComputedStyle(probe).color;probe.remove();const expected=(element,token)=>{const check=document.createElement('span');check.style.color=getComputedStyle(element).getPropertyValue(token);document.body.append(check);const value=getComputedStyle(check).color;check.remove();return value;};return {accent,soft,stars:[...document.querySelectorAll('.icon-star')].map(e=>({fill:getComputedStyle(e).fill,stroke:getComputedStyle(e).stroke,accent:expected(e,'--accent'),soft:expected(e,'--accent-soft')})),cells:[...document.querySelectorAll('.icon-cell')].map(e=>({fill:getComputedStyle(e).fill,stroke:getComputedStyle(e).stroke,accent:expected(e,'--accent'),soft:expected(e,'--accent-soft')}))};});
   assert(result.stars.length>=2);assert(result.cells.length>=2);for(const star of result.stars){assert.equal(star.stroke,star.accent);assert.equal(star.fill,star.soft);}for(const cell of result.cells){assert.equal(cell.fill,cell.soft);assert.equal(cell.stroke,'none');}cases++;
  }
  await p.keyboard.press('Escape');
 }
 await p.goto(origin+'/offline/index.html');assert.equal(await p.locator('#prepareButton svg[data-shared-icon="download"]').count(),1);await p.locator('#siteSettingsButton').click();assert.equal(await p.locator('#siteInstallButton svg[data-shared-icon="download"]').count(),1);assert.equal(await p.locator('#prepareButton svg').innerHTML(),await p.locator('#siteInstallButton svg').innerHTML());
 assert.deepEqual(errors,[]);await c.close();
}
console.log('PASS',cases,'language/theme/size/host cases: outlined Tricks stars, light Calendar cells, accessible synced-note badge and identical Download 2A artwork.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
