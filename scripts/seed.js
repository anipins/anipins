const Database = require("better-sqlite3");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const UP = path.join(ROOT, "uploads");
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(path.join(UP, "o"), { recursive: true });
fs.mkdirSync(path.join(UP, "t"), { recursive: true });

const db = new Database(path.join(DATA, "anipins.db"));
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const SEED = [
  { file: "asta.jpg", ch: "Asta", an: "Black Clover", title: "Anti-Magic Unleashed", tags: "black clover,asta,sword,dark,action,male", cat: "Male Characters", featured: 1, desc: "Asta grips the Demon-Slayer sword as anti-magic surges around him." },
  { file: "noelle.jpg", ch: "Noelle Silva", an: "Black Clover", title: "Sea Dragon's Roar", tags: "black clover,noelle,water magic,royal,female", cat: "Female Characters", featured: 1, desc: "Noelle Silva channels her valkyrie water magic." },
  { file: "gojo.jpg", ch: "Satoru Gojo", an: "Jujutsu Kaisen", title: "The Honored One", tags: "jujutsu kaisen,gojo,infinity,blindfold,male", cat: "Male Characters", featured: 1, desc: "Satoru Gojo reveals the six eyes." },
  { file: "itadori.jpg", ch: "Yuji Itadori", an: "Jujutsu Kaisen", title: "Divergent Fist", tags: "jujutsu kaisen,itadori,cursed energy,action,male", cat: "Male Characters", featured: 0, desc: "Yuji Itadori strikes with cursed energy." },
  { file: "naruto.jpg", ch: "Naruto Uzumaki", an: "Naruto", title: "Sage of the Leaf", tags: "naruto,rasengan,sage mode,male", cat: "Male Characters", featured: 1, desc: "Naruto in sage mode, rasengan blazing." },
  { file: "sasuke.jpg", ch: "Sasuke Uchiha", an: "Naruto", title: "Storm of the Uchiha", tags: "naruto,sasuke,sharingan,chidori,dark,male", cat: "Male Characters", featured: 0, desc: "Sasuke under the rain, chidori crackling." },
  { file: "nezuko.jpg", ch: "Nezuko Kamado", an: "Demon Slayer", title: "Blood Demon Bloom", tags: "demon slayer,nezuko,pink,kimono,female", cat: "Female Characters", featured: 1, desc: "Nezuko wrapped in soft demon flame." },
  { file: "tanjiro.jpg", ch: "Tanjiro Kamado", an: "Demon Slayer", title: "Water Breathing", tags: "demon slayer,tanjiro,katana,water,action,male", cat: "Male Characters", featured: 0, desc: "Tanjiro flows through the water-breathing forms." },
  { file: "mikasa.jpg", ch: "Mikasa Ackerman", an: "Attack on Titan", title: "Wings of Freedom", tags: "attack on titan,mikasa,scarf,blades,female", cat: "Female Characters", featured: 1, desc: "Mikasa at dusk above the rooftops." },
  { file: "zerotwo.jpg", ch: "Zero Two", an: "Darling in the Franxx", title: "Darling", tags: "darling in the franxx,zero two,pink hair,horns,female", cat: "Female Characters", featured: 1, desc: "Zero Two, elegant and untouchable." },
];

const insert = db.prepare(`INSERT INTO artworks
 (title, character_name, character_slug, anime_name, anime_slug, description, tags, category, featured, published, orig, thumb, width, height, views, downloads)
 VALUES (@title,@ch,@chs,@an,@ans,@desc,@tags,@cat,@featured,1,@orig,@thumb,@w,@h,@views,@downloads)`);

(async () => {
  const count = db.prepare("SELECT COUNT(*) c FROM artworks").get().c;
  if (count > 0) { console.log("Already seeded, skipping artworks."); return; }
  for (const s of SEED) {
    const src = path.join(ROOT, "seed", s.file);
    if (!fs.existsSync(src)) { console.log("missing", s.file); continue; }
    const buf = fs.readFileSync(src);
    const id = crypto.randomBytes(8).toString("hex");
    const orig = `o/${id}.jpg`, thumb = `t/${id}.jpg`;
    fs.writeFileSync(path.join(UP, orig), buf);
    const meta = await sharp(buf).metadata();
    await sharp(buf).resize({ width: 560, withoutEnlargement: true }).jpeg({ quality: 72 }).toFile(path.join(UP, thumb));
    insert.run({
      title: s.title, ch: s.ch, chs: slug(s.ch), an: s.an, ans: slug(s.an),
      desc: s.desc, tags: s.tags, cat: s.cat, featured: s.featured,
      orig, thumb, w: meta.width || 0, h: meta.height || 0,
      views: 40 + Math.floor(Math.random() * 400), downloads: 5 + Math.floor(Math.random() * 90),
    });
    console.log("seeded", s.ch);
  }
})();
