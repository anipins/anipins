import { emailFrom } from "@/lib/email-utils";

type Email = { to: string; subject: string; text: string };

export async function sendTransactionalEmail(message: Email) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || !message.to) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: emailFrom(process.env.EMAIL_FROM), to: [message.to], subject: message.subject, text: message.text }),
  }).catch(() => null);
  return !!response?.ok;
}

export async function sendWelcomeEmail(email: string, name = "") {
  const greeting = name.trim() || "there";
  return sendTransactionalEmail({
    to: email,
    subject: "Welcome to AniPins",
    text: `Hi ${greeting},\n\nWelcome to AniPins — your space for anime artwork references, sketching inspiration, and curated collections.\n\nStart exploring: https://anipins.com/explore\n\nIf you did not create this account, you can safely ignore this email.`,
  });
}
