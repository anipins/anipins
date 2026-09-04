import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { rows, row, run, slugify } from "@/lib/db";
import { hashPassword, ADMIN_EMAIL } from "@/lib/auth";
import { PG_SCHEMA } from "@/lib/pgschema";
import { BUCKET, saveImage } from "@/lib/media";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SB_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

export async function GET() {
  const log: string[] = [];
  try {
    // 1. Schema (Postgres only; SQLite auto-creates)
    if (process.env.DATABASE_URL) {
      for (const stmt of PG_SCHEMA) await run(stmt);
      log.push("Database schema ready");
    } else {
      await rows("SELECT 1");
      log.push("SQLite schema ready (local mode)");
    }

    // 2. Storage bucket (public)
    if (SB_URL && SB_KEY) {
      const r = await fetch(`${SB_URL}/storage/v1/bucket`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
      });
      if (r.ok) log.push("Storage bucket created");
      else {
        const t = await r.text();
        if (t.includes("already") || r.status === 409 || r.status === 400) log.push("Storage bucket already exists");
        else throw new Error(`Bucket creation failed: ${t}`);
      }
    } else {
      log.push("Local file storage (no Supabase keys set)");
    }

    // 3. Admin account
    const admin = await row("SELECT id FROM users WHERE email=?", ADMIN_EMAIL);
    if (!admin) {
      const pw = process.env.ADMIN_PASSWORD || "AniPins@2026";
      await run("INSERT INTO users (email,password_hash,name,role) VALUES (?,?,?,?)", ADMIN_EMAIL, hashPassword(pw), "AniPins Admin", "ADMIN");
      log.push(`Admin account created (${ADMIN_EMAIL})`);
    } else log.push("Admin account already exists");

    // 4. Seed artworks
    const count = await row("SELECT COUNT(*) AS c FROM artworks");
    if ((count?.c ?? 0) === 0) {
      let seeded = 0;
      for (const s of SEED) {
        const p = path.join(process.cwd(), "seed", s.file);
        if (!fs.existsSync(p)) continue;
        const buf = fs.readFileSync(p);
        const m = await saveImage(buf, s.file);
        await run(
          `INSERT INTO artworks (title, character_name, character_slug, anime_name, anime_slug, description, tags, category, featured, published, orig, thumb, width, height, views, downloads)
           VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?)`,
          s.title, s.ch, slugify(s.ch), s.an, slugify(s.an), s.desc, s.tags, s.cat, s.featured,
          m.orig, m.thumb, m.width, m.height,
          40 + Math.floor(Math.random() * 400), 5 + Math.floor(Math.random() * 90));
        seeded++;
      }
      log.push(`Seeded ${seeded} artworks`);
    } else log.push(`Artworks already present (${count.c})`);

    return NextResponse.json({ ok: true, log, next: "Setup complete. Sign in at /login with the admin email." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, log, error: String(e?.message || e) }, { status: 500 });
  }
}
