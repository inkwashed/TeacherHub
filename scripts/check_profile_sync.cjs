/* Optional Playwright: Sync export/import and real browser-local file handles.
 * Native OS picker dialogs are replaced with OPFS handles inside an isolated profile.
 * No files outside that temporary browser profile are selected or modified.
 */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const origin = 'http://localhost:8765';
const prefKey = 'teacherTools.sitePreferences.v1';
const timerKey = 'teacherTools.classroomTimer.state.v1';
const schoolKey = 'classAutomatorData_v3';
const filename = 'teacher-tools-sync-test.json';
async function poll(page, read, check, label) {
    for (let i=0;i<150;i++) {
        try {if (check(await page.evaluate(read))) return;} catch (error) {if(!error.message.includes('Execution context was destroyed')&&!/NotFoundError|NotReadableError/.test(error.message)) throw error;}
        await page.waitForTimeout(100);
    }
    throw Error('Timed out: '+label);
}
async function openSync(page) {await page.evaluate(() => window.TeacherToolsProfile.openSync());}
(async () => {
    const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
    try {
        const context=await browser.newContext({serviceWorkers:'block'});
        await context.addInitScript(({prefKey,timerKey,schoolKey,filename}) => {
            if(!sessionStorage.getItem('sync-seeded')){
                sessionStorage.setItem('sync-seeded','yes');
                localStorage.setItem(prefKey,JSON.stringify({version:1,theme:'modern-blue',profile:{name:'Sync Test'},extra:'keep'}));
                localStorage.setItem(timerKey,JSON.stringify({version:1,soundEnabled:true,defaultSeconds:60,quickPresets:[60],presets:[]}));
                localStorage.setItem(schoolKey,JSON.stringify({version:3,schools:[{id:'kept',name:'Kept School',classes:['A']}],schedule:{kept:['2026-11-11']},preferences:{},extra:'keep'}));
            }
            window.showSaveFilePicker = async () => (await navigator.storage.getDirectory()).getFileHandle(filename,{create:true});
            window.showOpenFilePicker = async () => [await (await navigator.storage.getDirectory()).getFileHandle(filename)];
        },{prefKey,timerKey,schoolKey,filename});
        const page=await context.newPage();const errors=[];let accept=true;
        page.on('pageerror',error=>errors.push(error.message));
        page.on('dialog',dialog=>dialog.type()==='confirm'&&!accept?dialog.dismiss():dialog.accept());
        await page.goto(origin+'/');await openSync(page);
        const downloadPromise=page.waitForEvent('download');await page.locator('#siteDataExportButton').click();
        const backup=JSON.parse(await fs.readFile(await (await downloadPromise).path(),'utf8'));
        assert.equal(backup.app,'teacher-tools-site-backup');assert.equal(backup.schemaVersion,1);
        assert.equal(backup.records.appearance.profile.name,'Sync Test');assert.equal(backup.records.scheduler.extra,'keep');assert.equal(backup.records.timer.defaultSeconds,60);
        for (const checkbox of await page.locator('[data-site-data-record]').all()) if(await checkbox.isEnabled()) await checkbox.uncheck();
        await page.locator('[data-site-data-record="timer"]').check();
        const selectedPromise=page.waitForEvent('download');await page.locator('#siteDataExportButton').click();
        const selected=JSON.parse(await fs.readFile(await (await selectedPromise).path(),'utf8'));assert.deepEqual(Object.keys(selected.records),['timer']);
        console.log('PASS full and selected JSON exports through Profile → Sync.');
        const target=await browser.newContext({serviceWorkers:'block'});await target.addInitScript(({prefKey,schoolKey})=>{if(!sessionStorage.getItem('seed')){sessionStorage.setItem('seed','1');localStorage.setItem(prefKey,JSON.stringify({version:1,theme:'modern-blue',profile:{name:'Keep Name'}}));localStorage.setItem(schoolKey,JSON.stringify({version:3,schools:[],schedule:{},preferences:{},extra:'untouched'}));}},{prefKey,schoolKey});
        const restored=await target.newPage();let restoreAccept=true;
        restored.on('dialog',dialog=>dialog.type()==='confirm'&&!restoreAccept?dialog.dismiss():dialog.accept());
        await restored.goto(origin+'/');await openSync(restored);
        await Promise.all([restored.waitForEvent('load'),restored.locator('#siteDataImportFile').setInputFiles({name:'timer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(selected))})]);
        await poll(restored,()=>JSON.parse(localStorage.getItem('teacherTools.classroomTimer.state.v1')),value=>value?.defaultSeconds===60,'selected backup restore');
        await restored.waitForLoadState();await openSync(restored);
        assert.equal(await restored.evaluate(key=>JSON.parse(localStorage.getItem(key)).profile.name,prefKey),'Keep Name');
        assert.equal(await restored.evaluate(key=>JSON.parse(localStorage.getItem(key)).extra,schoolKey),'untouched');
        const before=await restored.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
        await restored.locator('#siteDataImportFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
        await restored.waitForFunction(()=>document.getElementById('siteDataStatus').classList.contains('error'));
        assert.equal(await restored.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),before);
        restoreAccept=false;const cancelled=structuredClone(selected);cancelled.records.timer.defaultSeconds=999;
        await restored.locator('#siteDataImportFile').setInputFiles({name:'cancel.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(cancelled))});
        await restored.waitForFunction(()=>document.getElementById('siteDataStatus').textContent.includes('cancelled'));
        assert.equal(await restored.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),before);
        restoreAccept=true;
        const spinner={app:'teacher-tools-spinner-wheel',schemaVersion:1,state:{version:1,mode:'numbers',minimum:'1',maximum:'10',exclusions:'',customChoices:''}};
        await Promise.all([restored.waitForEvent('load'),restored.locator('#siteDataImportFile').setInputFiles({name:'old-spinner.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(spinner))})]);
        await poll(restored,()=>JSON.parse(localStorage.getItem('teacherTools.spinnerWheel.state.v1')),value=>value?.maximum==='10','legacy Spinner restore');
        await target.close();console.log('PASS selected restore preserves unrelated records; invalid/cancelled imports do not write; legacy Spinner import still works.');
        await page.bringToFront();await page.locator('#siteDataFileTab').click();await page.locator('#siteLinkedDataCreate').click();
        await poll(page,async()=>{try{return JSON.parse(await (await (await navigator.storage.getDirectory()).getFileHandle('teacher-tools-sync-test.json')).getFile().then(f=>f.text()));}catch{return null;}},value=>value?.records?.appearance?.profile?.name==='Sync Test','linked file creation');
        await page.locator('#siteProfileNameEdit').click();await page.locator('#siteProfileName').fill('Autosaved Name');await page.locator('#siteProfileNameForm button[type=submit]').click();
        await poll(page,async()=>JSON.parse(await (await (await navigator.storage.getDirectory()).getFileHandle('teacher-tools-sync-test.json')).getFile().then(f=>f.text())),value=>value?.records?.appearance?.profile?.name==='Autosaved Name','linked autosave');
        await page.evaluate(async()=>{const handle=await (await navigator.storage.getDirectory()).getFileHandle('teacher-tools-sync-test.json');const data=JSON.parse(await (await handle.getFile()).text());data.records.appearance.profile.name='Pulled Name';const writable=await handle.createWritable();await writable.write(JSON.stringify(data));await writable.close();});
        await Promise.all([page.waitForEvent('load'),page.locator('#siteLinkedDataLoad').click()]);
        await poll(page,()=>JSON.parse(localStorage.getItem('teacherTools.sitePreferences.v1'))?.profile?.name,value=>value==='Pulled Name','linked pull');
        await page.waitForLoadState();await openSync(page);await page.locator('#siteDataFileTab').click();
        await poll(page,()=>document.getElementById('siteLinkedDataDisconnect').disabled,value=>value===false,'stored file handle reconnect');
        await page.locator('#siteLinkedDataDisconnect').click();
        await poll(page,()=>document.getElementById('siteLinkedDataLoad').disabled,value=>value===true,'disconnect completion');
        assert(await page.evaluate(async()=>!!(await (await navigator.storage.getDirectory()).getFileHandle('teacher-tools-sync-test.json')).getFile()));
        await Promise.all([page.waitForEvent('load'),page.locator('#siteLinkedDataLink').click()]);
        await poll(page,()=>document.getElementById('siteLinkedDataDisconnect').disabled,value=>value===false,'link existing file');
        await page.waitForLoadState();await page.goto(origin+'/offline/index.html');await page.locator('#backupButton').click();
        assert(await page.locator('#siteThemePanel').evaluate(e=>e.open));assert.equal(await page.locator('#siteDataExportTab').getAttribute('aria-selected'),'true');
        assert.deepEqual(errors,[]);await context.close();
        console.log('PASS linked-file create, autosave, pull/reload, saved handle, disconnect without deletion, link existing, and offline-page Sync shortcut. Native OS picker UI was not exercised.');
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
