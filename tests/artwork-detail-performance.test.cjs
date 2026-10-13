const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("detail API caches related metadata and overlaps adjacent lookup",()=>{
 const s=read("src/app/api/artworks/[id]/route.ts");
 assert.match(s,/unstable_cache/);
 assert.match(s,/cachedRelatedArtworks/);
 assert.match(s,/revalidate: 30/);
 assert.match(s,/Promise\.all\(\[/);
 assert.match(s,/await canAccessPremium\(user\)/);
 assert.match(s,/"Cache-Control": "private, no-store"/);
});
test("desktop viewer matches reference: left image beside details, two portrait-card columns right, flowing masonry below",()=>{
 const s=read("src/components/ArtLightbox.tsx");
 assert.match(s,/lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,1fr\)\]/);
 assert.match(s,/md:grid-cols-\[minmax\(0,0\.95fr\)_minmax\(0,1\.05fr\)\]/);
 assert.match(s,/aria-label="Related artwork"/);
 assert.match(s,/className="columns-2 gap-3 xl:gap-4"/);
 assert.match(s,/Array\.from\(\{ length: 6 \}/);
 assert.match(s,/<MasonryFeed/);
});
