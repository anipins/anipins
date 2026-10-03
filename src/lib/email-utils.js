function emailFrom(configured) {
  return configured && configured.trim() ? configured.trim() : "AniPins <onboarding@resend.dev>";
}
module.exports = { emailFrom };
