const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("feed passes visible cards into instant artwork overlay rather than waiting for 15s API",()=>{
 const card=read("src/components/ArtCard.tsx");
 const feed=read("src/components/MasonryFeed.tsx");
 const viewer=read("src/components/ArtLightbox.tsx");
 assert.match(card,/detail: \{ id, art, relatedPreview \}/);
 assert.match(card,/contextArtworks\?: any\[\]/);
 assert.match(feed,/contextArtworks=\{items\.slice\(0, 36\)\}/);
 assert.match(viewer,/const \[relatedPreview, setRelatedPreview\] = useState<any\[\]>\(\[\]\)/);
 assert.match(viewer,/const visibleRelated = data\?\.related\?\.length \? data\.related : relatedPreview/);
 assert.match(viewer,/visibleRelated\.slice\(0, 6\)/);
});
test("related previews are scoped to the selected Premium/public feed and keep original card ratio",()=>{
 const viewer=read("src/components/ArtLightbox.tsx");
 const card=read("src/components/ArtCard.tsx");
 assert.match(viewer,/Number\(item\?\.premium \|\| 0\) === Number\(detail\.art\?\.premium \|\| 0\)/);
 assert.match(viewer,/lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,1fr\)\]/);
 assert.match(viewer,/md:grid-cols-\[minmax\(0,0\.95fr\)_minmax\(0,1\.05fr\)\]/);
 assert.match(viewer,/className="columns-2 gap-3 xl:gap-4"/);
 assert.match(card,/style=\{\{ aspectRatio: `1 \/ \$\{ratio\}`/);
});
