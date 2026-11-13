/* User-authored SVG parts. No raster images or external references in exports. */
(() => {
 const parts=window.TeacherToolsAvatarSVGParts;
 const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16));
 // Preserve each source shade's offset from its base color, including the
 // original palette exactly at the default. Keep dark outlines unchanged.
 function recolor(markup,base,target,shades){
  if(!/^#[\da-f]{6}$/i.test(target)||base===target)return markup;
  const from=rgb(base),to=rgb(target);
  const palette=Object.fromEntries(shades.map(shade=>[shade,'#'+rgb(shade).map((v,i)=>Math.max(0,Math.min(255,v+to[i]-from[i])).toString(16).padStart(2,'0')).join('')]));
  return markup.replace(/fill:(#[\da-f]{6})/gi,(match,color)=>palette[color]?'fill:'+palette[color]:match);
 }
 const neutralSkinTones=new Set(['#b6845d','#845d40','#573f31']);
 const shadeSkin=(skin,factor)=>'#'+rgb(skin).map((v,i)=>Math.round(v*factor*[1.025,.99,.97][i]).toString(16).padStart(2,'0')).join('');
 // One skin-derived detail tone shared by lid creases and nose.
 function skinDetail(skin='#f8cfa9'){
  if(neutralSkinTones.has(skin))return shadeSkin(skin,.8);
  const base=rgb('#f8cfa9'),detail=rgb('#deaa87');
  return '#'+rgb(skin).map((v,i)=>Math.round(v*detail[i]/base[i]).toString(16).padStart(2,'0')).join('');
 }
 function layer(key,s){
  if(key==='eyes'&&s.eyes==='mixed'){
   // Picture-left Cheerful and picture-right Worried, retaining their own offsets.
   return ['cheerful','worried'].map((eyes,i)=>`<svg x="${i*1592.381}" y="0" width="1592.381" height="3184.762" viewBox="${i*1592.381} 0 1592.381 3184.762" overflow="hidden">${layer('eyes',{...s,eyes})}</svg>`).join('');
  }
  if(key==='hairBack')return s.hair==='longBangs'?recolor(parts.hairLongBangsBack,'#503529',s.hairColor,['#503529','#2f1a13','#8e6750']):'';
  if(key==='accessories')return ''; // Reserved above front hair for future accessories.

  let art=parts[key==='clothes'?({pointedCollar:'clothesPointedCollar',roundedCollar:'clothesRoundedCollar'}[s.clothes]||'clothes'):key==='eyes'?({angry:'eyesAngry',worried:'eyesWorried',sleepy:'eyesSleepy',happy:'eyesHappy',heart:'eyesHeart',starry:'eyesStarry'}[s.eyes]||'eyes'):key==='nose'?({tinyWedge:'noseTinyWedge',softHook:'noseSoftHook',largerArch:'noseLargerArch',buttonCurve:'noseButtonCurve'}[s.nose]||'nose'):key==='mouth'?({teethSmile:'mouthTeethSmile',closedSmile:'mouthClosedSmile',frown:'mouthFrown',smirk:'mouthSmirk',surprisedO:'mouthSurprisedO',neutral:'mouthNeutral'}[s.mouth]||'mouth'):key==='face'?({slim:'faceSlim',round:'faceRound'}[s.face]||'face'):key==='hair'?({curly:'hairCurly',centerPart:'hairCenterPart',longBangs:'hairLongBangsFront'}[s.hair]||'hair'):key];
  if(key==='clothes')art=['pointedCollar','roundedCollar'].includes(s.clothes)?recolor(art,'#edf0f4',s.shirtColor,['#edf0f4','#c5cfdd']):recolor(art,'#5d9698',s.shirtColor,['#5d9698','#467577']);
  if(key==='face'){
   if(neutralSkinTones.has(s.skin)){
    const palette={'#f8cfa9':s.skin,'#efac85':shadeSkin(s.skin,.85),'#af755b':shadeSkin(s.skin,.63)};
    art=art.replace(/fill:(#[\da-f]{6})/gi,(match,color)=>palette[color]?'fill:'+palette[color]:match);
   }else art=recolor(art,'#f8cfa9',s.skin,['#f8cfa9','#efac85','#af755b']);
  }
  if(key==='hair')art=s.hair==='none'?'':s.hair==='curly'?recolor(art,'#523529',s.hairColor,['#523529','#351d16','#8a5c48']):recolor(art,'#503529',s.hairColor,['#503529','#2f1a13','#8e6750']);
  if(key==='eyes'){
   const browColor='#'+rgb(s.hairColor||'#503529').map(v=>Math.round(v*.75).toString(16).padStart(2,'0')).join('');
   art=art.replace(/<path\b[^>]*data-brows="true"[^>]*\/>/g,path=>path.replace(/fill:#[\da-f]{6}/i,'fill:'+browColor));
   if(s.eyeStyle!=='eyelashes')art=art.replace(/<path\b[^>]*data-lashes="true"[^>]*\/>/g,'');
   art=art.replaceAll('fill:#deaa87','fill:SKIN_DETAIL');
   art=recolor(art,'#9b6643',s.eyeColor,['#9b6643','#bf8454','#502d16']);
   art=art.replaceAll('fill:SKIN_DETAIL','fill:'+skinDetail(s.skin));
   // About 1px lower in a 400px portrait; move the whole expression together.
   if(s.eyes==='angry')art=`<g transform="translate(0 8)">${art}</g>`;
   if(s.eyes==='worried')art=`<g transform="translate(-8 -24)">${art}</g>`;
   if(s.eyes==='sleepy')art=`<g transform="translate(0 16)">${art}</g>`;
   // The original compound path shared rings with pupils; only rings follow iris.
   art=art.replace(/<path\b[^>]*data-iris-ring="true"[^>]*\/>/g,path=>path.replace('fill:#2f211d','fill:'+s.eyeColor));
  }
  if(key==='nose'){
   if(s.nose==='tinyWedge'){
    const plane=skinDetail(s.skin);
    const contour='#'+rgb(plane).map(v=>Math.round(v*.85).toString(16).padStart(2,'0')).join('');
    art=art.replaceAll('fill:#eea67f','fill:'+plane).replaceAll('fill:#915837','fill:'+contour);
   }else art=s.nose==='none'?'':art.replace(/fill:#(?:925938|915837)/g,'fill:'+skinDetail(s.skin));
   // About 10px lower in a 400px portrait.
   if(s.nose==='softHook'||s.nose==='buttonCurve')art=`<g transform="translate(0 80)">${art}</g>`;
  }
  // 55 canvas units is about 7px in a 400px portrait; applies to every mouth.
  if(key==='mouth')art=`<g transform="translate(${s.mouth==='smirk'?55:s.mouth==='teethSmile'?24:0} 55)">${art}</g>`;
  return art;
 }
 const svg=(body,viewBox='0 0 3184.762 3184.762')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
 window.TeacherToolsRenderSelfie=s=>svg(`<rect width="3184.762" height="3184.762" fill="${s.background}"/>`+['hairBack','face','clothes','eyes','nose','mouth','hair','accessories'].map(key=>layer(key,s)).join(''));
})();
