#!/usr/bin/env node
/* Generate mobile/PWA PNGs from the canonical vector logo. Requires Playwright/Chromium. */
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),directory=path.join(root,'assets/pwa');
 const source=await fs.readFile(path.join(directory,'teacher-tools-icon.svg'),'utf8');
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const page=await browser.newPage();
  for(const [size,name] of [[180,'apple-touch-icon.png'],[192,'teacher-tools-icon-192.png'],[512,'teacher-tools-icon-512.png']]){
   const png=await page.evaluate(async({source,size})=>{
    // Square, opaque and full bleed. The OS supplies its own corner mask.
    const inset=size*.08,logo=source.replace('<svg ','<svg x="'+inset+'" y="'+inset+'" width="'+(size-2*inset)+'" height="'+(size-2*inset)+'" ');
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'"><rect width="100%" height="100%" fill="#fff"/>'+logo+'</svg>';
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/png').split(',')[1];}finally{URL.revokeObjectURL(url);}
   },{source,size});
   await fs.writeFile(path.join(directory,name),Buffer.from(png,'base64'));
  }
  console.log('Built Apple 180px and PWA 192/512px icons from assets/pwa/teacher-tools-icon.svg.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
