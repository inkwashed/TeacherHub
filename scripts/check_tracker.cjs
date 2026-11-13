// Run with Node 18+: exercise the actual Tracker reader/writer without a browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../tracker/index.html'), 'utf8');
const code = html.slice(html.indexOf('        const fallbackSchools ='), html.indexOf('        function readTracker()'));
const key = 'classAutomatorData_v3';
function fixture(raw, failRecovery = false) {
  const records = new Map(raw === undefined ? [] : [[key, raw]]);
  const notice = {textContent:'', hidden:true};
  const context = vm.createContext({
    SCHEDULER_KEY:key, window:{}, document:{documentElement:{lang:'en'}, getElementById:() => notice},
    localStorage:{getItem:k => records.get(k) ?? null, setItem(k, v) {
      if (failRecovery && k.startsWith(key + '.recovery.')) throw Error('Quota exceeded');
      records.set(k, String(v));
    }}, StorageEvent:class {},
  });
  context.window.dispatchEvent = () => {};
  vm.runInContext(code, context);
  return {records, notice, api:context.window.TeacherToolsTrackerSchools};
}
const valid = JSON.stringify({version:3,schools:[{id:'kept',name:'Existing School',classes:['A'],extra:'preserve'}],schedule:{kept:['2026-11-09']},preferences:{selectedSchoolId:'kept'},extra:{preserve:true}});
const samples = [undefined, '', 'null', '{}', '[]', '{broken', '{"version":3,"schools":[null]}', '{"version":3,"schools":{}}', '{"version":3,"schools":[{"id":"x","name":"X","classes":[null]}]}', '{"version":3,"schools":[],"schedule":{},"preferences":{}}', valid];
for (const raw of samples) {
  const {api, records} = fixture(raw);
  const state = api.read();
  assert(Array.isArray(state.schools));
  assert(state.schedule && state.preferences);
  assert.equal(records.get(key), raw, 'Reading must not change the original record');
  if (raw === valid) {
    assert.equal(state.schools[0].name, 'Existing School');
    assert.equal(state.schools[0].extra, 'preserve');
    assert.equal(state.schedule.kept[0], '2026-11-09');
    assert.equal(state.extra.preserve, true);
  }
}
for (const raw of ['{broken', 'null', '{"version":3,"schools":[null]}']) {
  const {api, records, notice} = fixture(raw);
  const next = api.read();
  assert.equal(notice.hidden, false);
  next.schools[0].name = 'Edited School';
  assert.equal(api.write(next), true);
  assert([...records].some(([k,v]) => k.startsWith(key + '.recovery.') && v === raw));
  assert.equal(JSON.parse(records.get(key)).schools[0].name, 'Edited School');
}
const failed = fixture('{broken', true);
assert.equal(failed.api.write(failed.api.read()), false);
assert.equal(failed.records.get(key), '{broken', 'Never overwrite if the recovery copy cannot be saved');
console.log(`PASS: ${samples.length} stored-data cases; reads preserve original bytes; recovery copies and failed-save protection.`);
