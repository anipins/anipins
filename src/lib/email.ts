import { emailFrom } from "@/lib/email-utils";

type Email = { to: string; subject: string; text: string; html?: string };

export async function sendTransactionalEmail(message: Email) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !message.to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(process.env.EMAIL_FROM),
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    }),
  }).catch(() => null);

  return !!response?.ok;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

export async function sendWelcomeEmail(email: string, name = "") {
  const greeting = name.trim() || "there";
  const safeGreeting = escapeHtml(greeting);

  return sendTransactionalEmail({
    to: email,
    subject: "Welcome to AniPins - your anime reference library",
    text: `Hi ${greeting},

Welcome to AniPins - your space for anime artwork references, sketching inspiration, and curated collections.

Here is what you can do:
- Discover character and anime references for sketching.
- Save artwork into your own collection.
- Download available HD artwork and wallpapers.
- Browse dedicated phone and desktop wallpaper feeds.
- Follow characters and series you want to revisit.

AniPins Premium unlocks exclusive reference collections, full-quality HD downloads, and early access to new artwork drops.

Explore artwork: https://anipins.com/explore
Explore Premium: https://anipins.com/premium

If you did not create this account, you can safely ignore this email.`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#090909;color:#f8f7f3;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Save anime references, download wallpapers, and discover Premium early access.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#090909;padding:32px 12px;"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#151515;border:1px solid #3e3218;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:30px 32px 22px;background:#17130a;border-bottom:1px solid #3e3218;"><p style="margin:0 0 18px;color:#d4aa55;font-size:12px;font-weight:700;letter-spacing:3px;">ANIPINS</p><h1 style="margin:0;color:#ffffff;font-size:34px;line-height:1.15;">Welcome to your anime reference library.</h1></td></tr>
        <tr><td style="padding:30px 32px 12px;">
          <p style="margin:0 0 18px;color:#f8f7f3;font-size:17px;line-height:1.6;">Hi ${safeGreeting},</p>
          <p style="margin:0 0 24px;color:#c9c5bd;font-size:16px;line-height:1.65;">AniPins is built for discovering anime artwork references, practicing sketches, and keeping creative inspiration within reach.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;"><tr><td style="padding:17px 18px;background:#0d0d0d;border:1px solid #302c24;border-radius:12px;"><p style="margin:0 0 10px;color:#d4aa55;font-size:13px;font-weight:700;letter-spacing:1.2px;">START EXPLORING</p><p style="margin:0;color:#ece9e2;font-size:15px;line-height:1.7;">&bull; Discover character and anime references for sketching<br>&bull; Save artwork into your own collection<br>&bull; Download available HD artwork and wallpapers<br>&bull; Browse dedicated phone and desktop wallpaper feeds<br>&bull; Follow characters and series you want to revisit</p></td></tr></table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;"><tr><td style="padding:17px 18px;background:#211b10;border:1px solid #745a29;border-radius:12px;"><p style="margin:0 0 8px;color:#e6c071;font-size:13px;font-weight:700;letter-spacing:1.2px;">ANIPINS PREMIUM</p><p style="margin:0;color:#f1e5c7;font-size:15px;line-height:1.65;">Unlock exclusive reference collections, full-quality HD downloads, and early access to new artwork drops.</p></td></tr></table>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:#d4aa55;"><a href="https://anipins.com/explore" style="display:inline-block;padding:14px 22px;color:#17120a;font-size:15px;font-weight:700;text-decoration:none;">Explore artwork</a></td><td width="12"></td><td style="border-radius:10px;border:1px solid #725a2d;"><a href="https://anipins.com/premium" style="display:inline-block;padding:13px 21px;color:#e6c071;font-size:15px;font-weight:700;text-decoration:none;">View Premium</a></td></tr></table>
        </td></tr>
        <tr><td style="padding:18px 32px 30px;"><p style="margin:0;color:#8d897f;font-size:12px;line-height:1.6;">If you did not create this account, you can safely ignore this email.</p></td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`,
  });
}
