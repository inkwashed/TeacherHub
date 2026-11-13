/* No browser needed: early bootstrap locale order and storage preservation. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/theme-bootstrap.js'),'utf8');
let count=0;
for(const [languages,language,raw,expected,blocked] of [
 [['ja-JP'],'ja-JP',null,'ja'],[['en-US','ja-JP'],'en-US',null,'en'],
 [['fr-FR','ja-JP','en-US'],'fr-FR',null,'ja'],[['fr-FR','de-DE'],'fr-FR',null,'en'],
 [undefined,'ja-JP',null,'ja'],[[],'JA_jp',null,'ja'],
 [['ja-JP'],'ja-JP','{"version":1,"language":"en"}','en'],
 [['en-US'],'en-US','{"version":1,"language":"ja"}','ja'],
 [['ja-JP'],'ja-JP','{broken','ja'],[['ja-JP'],'ja-JP','{"language":"fr"}','ja'],
 [['ja-JP'],'ja-JP',null,'ja',true],[undefined,undefined,null,'en']
]){
 let writes=0;const document={documentElement:{lang:'en',setAttribute(){},style:{setProperty(){}}},querySelector:()=>({}),head:{appendChild(){}}};
 const window={};const storage={getItem(key){if(blocked)throw Error('blocked');return key==='teacherTools.siteLanguage.v1'?raw:null;},setItem(){writes++;}};
 vm.runInNewContext(source,{window,document,navigator:{languages,language},localStorage:storage});
 assert.equal(document.documentElement.lang,expected);assert.equal(writes,0);count++;
}
console.log('PASS',count,'bootstrap cases: regional tags, preference order, unsupported languages, saved overrides, malformed/blocked storage and no automatic writes.');
