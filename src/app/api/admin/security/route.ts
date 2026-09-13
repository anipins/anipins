import crypto from "crypto";
import QRCode from "qrcode";
import { NextRequest, NextResponse } from "next/server";
import { checkPassword, COOKIE, getUser, isAdmin } from "@/lib/auth";
import { row, rows, run } from "@/lib/db";
import { audit, createRecoveryCodes, decryptSecret, encryptSecret, ensureSecuritySchema, generateTotpSecret, hashRecovery, requestInfo, verifyTotp } from "@/lib/admin-security";

const sessionId = (token: string) => crypto.createHash("sha256").update(token).digest("hex").slice(0, 24);
async function guard() { await ensureSecuritySchema(); const user = await getUser(); return isAdmin(user) ? user : null; }

export async function GET(req: NextRequest) {
  const user = await guard(); if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const current = req.cookies.get(COOKIE)?.value || "";
  const [account, rawSessions, alerts, log] = await Promise.all([
    row("SELECT two_factor_enabled FROM users WHERE id=?", user.id),
    rows("SELECT token,created_at,last_seen_at,ip_address,user_agent,expires_at FROM sessions WHERE user_id=? AND expires_at>? ORDER BY created_at DESC", user.id, Date.now()),
    rows("SELECT id,kind,message,ip_address,user_agent,read_at,created_at FROM security_alerts WHERE user_id=? ORDER BY id DESC LIMIT 50", user.id),
    rows("SELECT id,action,target_type,target_id,detail,ip_address,created_at FROM admin_audit_log WHERE admin_id=? ORDER BY id DESC LIMIT 150", user.id),
  ]);
  return NextResponse.json({ twoFactorEnabled: Number(account?.two_factor_enabled)===1, sessions: rawSessions.map((s:any)=>({ id:sessionId(s.token), current:s.token===current, created_at:s.created_at, last_seen_at:s.last_seen_at, ip_address:s.ip_address, user_agent:s.user_agent, expires_at:s.expires_at })), alerts, audit:log }, { headers:{"Cache-Control":"private, no-store"} });
}

export async function POST(req: NextRequest) {
  const user = await guard(); if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json(); const action=String(body.action||""); const account=await row("SELECT password_hash,two_factor_secret,two_factor_pending_secret,two_factor_enabled FROM users WHERE id=?",user.id); const info=requestInfo(req);
  if(action==="begin"){
    if(!checkPassword(String(body.password||""),account.password_hash))return NextResponse.json({error:"Incorrect password."},{status:401});
    const secret=generateTotpSecret(); await run("UPDATE users SET two_factor_pending_secret=? WHERE id=?",encryptSecret(secret),user.id);
    const uri=`otpauth://totp/${encodeURIComponent("AniPins:"+user.email)}?secret=${secret}&issuer=${encodeURIComponent("AniPins")}&algorithm=SHA1&digits=6&period=30`;
    return NextResponse.json({secret,qr:await QRCode.toDataURL(uri,{width:240,margin:1,color:{dark:"#17140d",light:"#ffffff"}})});
  }
  if(action==="confirm"){
    if(!account.two_factor_pending_secret)return NextResponse.json({error:"Start setup again."},{status:400});
    const secret=decryptSecret(account.two_factor_pending_secret); if(!verifyTotp(secret,String(body.code||"")))return NextResponse.json({error:"Incorrect code. Check your phone time and try again."},{status:400});
    const recovery=createRecoveryCodes();await run("UPDATE users SET two_factor_secret=?,two_factor_pending_secret='',two_factor_enabled=1,recovery_codes=? WHERE id=?",encryptSecret(secret),JSON.stringify(recovery.map(hashRecovery)),user.id);await audit(user.id,"TWO_FACTOR_ENABLED","account",String(user.id),"",info.ip);return NextResponse.json({ok:true,recoveryCodes:recovery});
  }
  if(action==="disable"){
    if(!checkPassword(String(body.password||""),account.password_hash))return NextResponse.json({error:"Incorrect password."},{status:401});
    if(Number(account.two_factor_enabled)===1&&!verifyTotp(decryptSecret(account.two_factor_secret),String(body.code||"")))return NextResponse.json({error:"Incorrect authentication code."},{status:400});
    await run("UPDATE users SET two_factor_secret='',two_factor_pending_secret='',two_factor_enabled=0,recovery_codes='' WHERE id=?",user.id);await audit(user.id,"TWO_FACTOR_DISABLED","account",String(user.id),"",info.ip);return NextResponse.json({ok:true});
  }
  if(action==="recovery"){
    if(Number(account.two_factor_enabled)!==1||!verifyTotp(decryptSecret(account.two_factor_secret),String(body.code||"")))return NextResponse.json({error:"Incorrect authentication code."},{status:400});
    const recovery=createRecoveryCodes();await run("UPDATE users SET recovery_codes=? WHERE id=?",JSON.stringify(recovery.map(hashRecovery)),user.id);await audit(user.id,"RECOVERY_CODES_REGENERATED","account",String(user.id),"",info.ip);return NextResponse.json({ok:true,recoveryCodes:recovery});
  }
  if(action==="read-alerts"){await run("UPDATE security_alerts SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL",user.id);return NextResponse.json({ok:true});}
  return NextResponse.json({error:"Unknown action"},{status:400});
}

export async function DELETE(req:NextRequest){
  const user=await guard();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});const body=await req.json();const wanted=String(body.sessionId||"");const current=req.cookies.get(COOKIE)?.value||"";const sessions=await rows("SELECT token FROM sessions WHERE user_id=?",user.id);const found=sessions.find((s:any)=>sessionId(s.token)===wanted);if(!found)return NextResponse.json({error:"Session not found"},{status:404});await run("DELETE FROM sessions WHERE token=?",found.token);const info=requestInfo(req);await audit(user.id,"SESSION_REVOKED","session",wanted,found.token===current?"Current session":"",info.ip);const res=NextResponse.json({ok:true,current:found.token===current});if(found.token===current)res.cookies.set(COOKIE,"",{path:"/",maxAge:0});return res;
}
