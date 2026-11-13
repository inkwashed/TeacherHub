/* Dependency-free receiver/schema regression checks. Not a real Let’s EiGo! sender test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');
const root = path.resolve(__dirname, '..');
let checks = 0;
function environment(options = {}) {
    const listeners = new Map(), timeouts = new Map(), intervals = new Map(), statuses = [], busy = [], sent = [], opened = [], writes = [];
    let id = 0, rollbackCount = 0;
    const popup = {closed:false, close() { this.closed = true; }, postMessage(data, origin) { if (options.ackThrows) throw new Error('ACK failed'); sent.push({data,origin}); }};
    const window = {
        addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type,new Set()); listeners.get(type).add(callback); },
        removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
        open(url, name) { opened.push({url,name}); return options.blocked ? null : popup; }
    };
    const context = vm.createContext({window, location:{origin:options.receiverOrigin || 'http://localhost:8765'}, URL, crypto:webcrypto, Uint8Array,
        setTimeout(fn) { timeouts.set(++id,fn); return id; }, clearTimeout(id) { timeouts.delete(id); },
        setInterval(fn) { intervals.set(++id,fn); return id; }, clearInterval(id) { intervals.delete(id); }});
    for (const file of ['schema.js','transfer-config.js','transfer.js']) vm.runInContext(fs.readFileSync(path.join(root,'assets/js/selfie',file),'utf8'),context);
    const model = value => vm.runInContext('('+JSON.stringify(value)+')',context);
    const defaults = model({schemaVersion:1,choices:window.TeacherToolsSelfieSchema.catalog.defaults});
    const api = window.TeacherToolsSelfieTransfer.create({validate:window.TeacherToolsSelfieSchema.normalize,
        save(value) { if (options.saveFails) return null; writes.push(value); return {rollback() { rollbackCount++; writes.pop(); }}; },
        status(key,error) { statuses.push({key,error}); }, busy(value) { busy.push(value); }});
    const emit = (type,event) => [...(listeners.get(type)||[])].forEach(fn=>fn(event));
    const envelope = extra => ({type:'letseigo.selfie.import',version:1,requestId:new URL(opened.at(-1).url).searchParams.get('requestId'),avatar:defaults,...extra});
    const send = (extra={},event={}) => emit('message',{origin:'https://letseigo.com',source:popup,data:envelope(extra),...event});
    const clean = () => { assert.equal(api.pending,false); assert.equal(listeners.get('message')?.size||0,0); assert.equal(listeners.get('pagehide')?.size||0,0); assert.equal(timeouts.size,0); assert.equal(intervals.size,0); };
    return {api,popup,sent,opened,writes,statuses,busy,timeouts,intervals,emit,send,envelope,clean,model,schema:window.TeacherToolsSelfieSchema,rollbackCount:()=>rollbackCount};
}
function test(name, fn) { fn(); checks++; console.log('PASS',name); }
test('unprompted messages never import',()=>{const e=environment();e.emit('message',{origin:'https://letseigo.com',source:e.popup,data:{type:'letseigo.selfie.import',version:1,requestId:'guess',avatar:{}}});assert.equal(e.writes.length,0);e.clean()});
test('confirmed exact URL and fresh random request IDs; no personal data in query',()=>{const e=environment();e.api.start();const first=new URL(e.opened[0].url);assert.equal(first.origin,'https://letseigo.com');assert.equal(first.pathname,'/apps/avatar/transfer.html');assert.deepEqual([...first.searchParams.keys()].sort(),['receiverOrigin','requestId']);assert.match(first.searchParams.get('requestId'),/^[0-9a-f]{32}$/);e.api.cancel();e.api.start();assert.notEqual(e.envelope().requestId,first.searchParams.get('requestId'));e.api.cancel();e.clean()});
test('valid choices commit before exact-origin ACK and all pending resources clean up',()=>{const e=environment();e.api.start();const request=e.envelope().requestId;e.send();assert.equal(e.writes.length,1);assert.deepEqual(JSON.parse(JSON.stringify(e.sent)),[{data:{type:'letseigo.selfie.import.ack',version:1,requestId:request},origin:'https://letseigo.com'}]);e.clean();e.send();assert.equal(e.writes.length,1)});
for (const [name,event] of Object.entries({www:{origin:'https://www.letseigo.com'},attacker:{origin:'https://evil.example'},nullOrigin:{origin:'null'},wrongSource:{source:{}},wrongId:{data:'wrongId'},wrongType:{data:'wrongType'}})) test(name+' is ignored without cancelling the real request',()=>{const e=environment();e.api.start();if(event.data==='wrongId')e.send({requestId:'wrong'});else if(event.data==='wrongType')e.send({type:'other'});else e.send({},event);assert.equal(e.writes.length,0);assert(e.api.pending);e.send();assert.equal(e.writes.length,1);e.clean()});
for(const [name,extra]of Object.entries({protocolVersion:{version:2},schemaVersion:{avatar:{schemaVersion:2,choices:{}}},missingFields:{avatar:{schemaVersion:1,choices:{face:'classic'}}},extraPersonalData:{teacherName:'Never accepted'},markup:{avatar:'<svg onload="alert(1)"/>'}}))test(name+' is rejected, unacknowledged and cleaned up',()=>{const e=environment();e.api.start();e.send(extra);assert.equal(e.writes.length,0);assert.equal(e.sent.length,0);e.clean()});
test('unknown choices, settings, URLs, injected colors and missing keys fail schema',()=>{const e=environment();const good={schemaVersion:1,choices:JSON.parse(JSON.stringify(e.schema.catalog.defaults))};assert(e.schema.normalize(e.model(good)));for(const changes of [{hair:'futureHair'},{eyeStyle:'url(https://example.com)'},{hairColor:'red'},{shirtColor:'\"/><script/>'},{background:'https://example.com/a.png'},{skin:'#000000'},{extra:'value'}])assert.equal(e.schema.normalize(e.model({...good,choices:{...good.choices,...changes}})),null);const missing={...good.choices};delete missing.eyes;assert.equal(e.schema.normalize(e.model({...good,choices:missing})),null);assert.equal(e.schema.normalize(e.model({...good,name:'Not allowed'})),null);assert.equal(e.schema.normalize(e.model({...good,choices:[]})),null)});
test('all catalog options and valid custom colors normalize; JSON schema matches runtime',()=>{const e=environment();const schema=JSON.parse(fs.readFileSync(path.join(root,'docs/selfie-avatar.schema.v1.json')));assert.deepEqual(schema.properties.choices.properties,JSON.parse(JSON.stringify(e.schema.catalog.fields)));for(const[key,rule]of Object.entries(e.schema.catalog.fields))for(const value of rule.enum||['#aB12Cd'])assert(e.schema.normalize(e.model({schemaVersion:1,choices:{...e.schema.catalog.defaults,[key]:value}})));});
test('blocked popup produces retry guidance without listeners or writes',()=>{const e=environment({blocked:true});e.api.start();assert.equal(e.statuses.at(-1).key,'profile.selfieBlocked');assert.equal(e.writes.length,0);e.clean()});
test('unsupported receiver origin cannot open a popup',()=>{const e=environment({receiverOrigin:'https://www.tools.letseigo.com'});e.api.start();assert.equal(e.opened.length,0);e.clean()});
test('closure and messages arriving after closure preserve old profile',()=>{const e=environment();e.api.start();e.popup.closed=true;e.send();assert.equal(e.writes.length,0);e.clean();const f=environment();f.api.start();f.popup.closed=true;[...f.intervals.values()][0]();f.clean()});
test('cancel, timeout and navigation clean up without writes',()=>{for(const action of ['cancel','timeout','pagehide']){const e=environment();e.api.start();if(action==='cancel')e.api.cancel();if(action==='timeout')[...e.timeouts.values()][0]();if(action==='pagehide')e.emit('pagehide',{});assert.equal(e.writes.length,0);e.clean()}});
test('failed persistence sends no ACK and clears pending state',()=>{const e=environment({saveFails:true});e.api.start();e.send();assert.equal(e.writes.length,0);assert.equal(e.sent.length,0);e.clean()});
test('synchronous ACK error rolls back the local commit',()=>{const e=environment({ackThrows:true});e.api.start();e.send();assert.equal(e.writes.length,0);assert.equal(e.rollbackCount(),1);e.clean()});
test('profile backups allow only My Selfie choices; custom photo data is rejected',()=>{const e=environment();const avatar={schemaVersion:1,choices:e.schema.catalog.defaults};assert(e.schema.validProfile(e.model({name:'Teacher',selfie:avatar})));assert(e.schema.validProfile(e.model({name:'Teacher',avatar:'',selfie:avatar})));assert(!e.schema.validProfile(e.model({name:'Teacher',avatar:'data:image/png;base64,YQ=='})));assert(!e.schema.validProfile(e.model({name:'Teacher',avatar:'https://example.com/photo.png'})));assert(!e.schema.validProfile(e.model({name:'Teacher',selfie:{schemaVersion:2,choices:avatar.choices}})));});
console.log(`PASS ${checks} receiver/schema groups. Simulated popup events only; real sender integration is not implemented.`);
