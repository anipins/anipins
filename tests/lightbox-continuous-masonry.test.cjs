const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("opened artwork resembles video: 2/3 image and details card, 1/3 two related columns",()=>{
 const s=read("src/components/ArtLightbox.tsx");
 assert.ok(s.includes("lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"));
 assert.ok(s.includes("md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"));
 assert.ok(s.includes('aria-label="Related artwork"'));
 assert.ok(s.includes('className="columns-2 gap-3 xl:gap-4"'));
 assert.ok(s.includes("data.related.slice(0, 6).map"));
 assert.ok(s.includes("<ArtCard art={relatedArt}"));
 assert.ok(!s.includes("md:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]"));
});
test("related recommendations continue in masonry below without duplicating desktop six cards",()=>{
 const v=read("src/components/ArtLightbox.tsx"),f=read("src/components/MasonryFeed.tsx"),c=read("src/components/ArtCard.tsx");
 assert.ok(v.includes("desktopHiddenIds={data.related.slice(0, 6).map"));
 assert.ok(f.includes("desktopHiddenIds?: number[]"));
 assert.ok(f.includes("desktopHidden={desktopHiddenIds.includes(art.id)}"));
 assert.ok(c.includes("desktopHidden?: boolean"));
 assert.ok(c.includes('desktopHidden ? "lg:hidden" : ""'));
});
