const sharp=require('sharp');const fs=require('fs');
(async()=>{
 const sym=fs.readFileSync('public/brand/ap-symbol.svg');
 for(const s of [1080,512,256,192]) await sharp(sym,{density:400}).resize(s,s).png().toFile('public/brand/ap-symbol-'+s+'.png');
 const igSvg=Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1080'>
  <defs><linearGradient id='au' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#D4AF37'/><stop offset='0.5' stop-color='#C6A15B'/><stop offset='1' stop-color='#9C7B3C'/></linearGradient>
  <radialGradient id='vg' cx='0.5' cy='0.42' r='0.75'><stop offset='0' stop-color='#161616'/><stop offset='1' stop-color='#060606'/></radialGradient></defs>
  <rect width='1080' height='1080' fill='url(#vg)'/>
  <circle cx='540' cy='540' r='430' fill='none' stroke='#2a2a2a' stroke-width='3'/>
  <circle cx='540' cy='540' r='418' fill='none' stroke='rgba(198,161,91,0.35)' stroke-width='2'/>
  <g transform='translate(240,240) scale(5)'>
    <path d='M28 92 L52 30 L64 30' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>
    <path d='M36 72 L58 72' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round'/>
    <path d='M64 30 L64 92' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round'/>
    <path d='M64 30 L74 30 A17 17 0 0 1 74 64 L64 64' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>
    <circle cx='91' cy='47' r='4' fill='#D4AF37'/>
  </g>
 </svg>`);
 await sharp(igSvg,{density:300}).resize(1080,1080).png().toFile('public/brand/instagram-profile-1080.png');
 await sharp(igSvg,{density:300}).resize(512,512).png().toFile('public/brand/instagram-profile-512.png');
 await sharp(igSvg,{density:300}).resize(256,256).png().toFile('public/brand/instagram-profile-256.png');
 const og=Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630' font-family='sans-serif'>
  <defs><linearGradient id='au' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#D4AF37'/><stop offset='1' stop-color='#9C7B3C'/></linearGradient></defs>
  <rect width='1200' height='630' fill='#080808'/>
  <rect x='40' y='40' width='1120' height='550' fill='none' stroke='#232323' stroke-width='2' rx='24'/>
  <line x1='90' y1='330' x2='330' y2='330' stroke='rgba(198,161,91,0.5)' stroke-width='2'/>
  <g transform='translate(84,120) scale(1.5)'>
    <path d='M28 92 L52 30 L64 30' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>
    <path d='M36 72 L58 72' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round'/>
    <path d='M64 30 L64 92' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round'/>
    <path d='M64 30 L74 30 A17 17 0 0 1 74 64 L64 64' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>
    <circle cx='91' cy='47' r='4' fill='#D4AF37'/>
  </g>
  <text x='90' y='420' font-size='84' font-weight='700' fill='#f0efec'>AniPins</text>
  <text x='90' y='480' font-size='30' fill='#a0a0a0'>Discover. Save. Create. Anime.</text>
  <text x='90' y='545' font-size='24' fill='#C6A15B'>@_anipins_</text>
 </svg>`);
 await sharp(og,{density:200}).resize(1200,630).png().toFile('public/brand/og-image.png');
 for(const [c,n] of [['#ffffff','white'],['#111111','black'],['#C6A15B','gold']]){
  const wm=Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 60'><text x='0' y='40' font-family='sans-serif' font-size='34' font-weight='600' fill='${c}' fill-opacity='0.85'>AniPins</text></svg>`);
  await sharp(wm,{density:300}).resize(600,120).png().toFile('public/brand/watermark-'+n+'.png');
 }
 const story=Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1920' font-family='sans-serif'>
  <defs><linearGradient id='au' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#D4AF37'/><stop offset='1' stop-color='#9C7B3C'/></linearGradient></defs>
  <rect width='1080' height='1920' fill='#080808'/>
  <rect x='60' y='60' width='960' height='1800' rx='36' fill='none' stroke='#222222' stroke-width='2'/>
  <line x1='390' y1='300' x2='690' y2='300' stroke='rgba(198,161,91,0.5)' stroke-width='2'/>
  <g transform='translate(444,120) scale(1.6)'>
    <path d='M28 92 L52 30 L64 30' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>
    <path d='M36 72 L58 72' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round'/>
    <path d='M64 30 L64 92' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round'/>
    <path d='M64 30 L74 30 A17 17 0 0 1 74 64 L64 64' fill='none' stroke='url(#au)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>
    <circle cx='91' cy='47' r='4' fill='#D4AF37'/>
  </g>
  <rect x='140' y='420' width='800' height='1060' rx='24' fill='#131313' stroke='#2a2a2a' stroke-width='2'/>
  <text x='540' y='990' font-size='34' fill='#3a3a3a' text-anchor='middle'>ARTWORK HERE</text>
  <text x='540' y='1650' font-size='58' font-weight='700' fill='#f0efec' text-anchor='middle'>AniPins</text>
  <text x='540' y='1720' font-size='34' fill='#C6A15B' text-anchor='middle'>@_anipins_</text>
 </svg>`);
 await sharp(story,{density:150}).resize(1080,1920).png().toFile('public/brand/instagram-story-template.png');
 console.log('brand assets exported');
})();
