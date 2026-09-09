import sharp from "sharp";

const base = "https://anipins-three.vercel.app";
const artworks = [];
for (let page = 0; ; page++) {
  const response = await fetch(`${base}/api/artworks?page=${page}&limit=40&sort=latest`);
  if (!response.ok) throw new Error(`Artwork page ${page} failed: ${response.status}`);
  const data = await response.json();
  artworks.push(...data.items);
  if (!data.hasMore) break;
}

const results = [];
for (const artwork of artworks) {
  const response = await fetch(`${base}/api/img/${artwork.thumb}`);
  if (!response.ok) continue;
  const buffer = Buffer.from(await response.arrayBuffer());
  const { data } = await sharp(buffer).grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += data[y * 9 + x] > data[y * 9 + x + 1] ? "1" : "0";
  let hash = "";
  for (let i = 0; i < bits.length; i += 4) hash += parseInt(bits.slice(i, i + 4), 2).toString(16);
  results.push([artwork.id, hash]);
}
process.stdout.write(JSON.stringify(results));
