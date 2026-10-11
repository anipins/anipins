function connectionMessage({ online, effectiveType, saveData }) {
  if (!online) return "You're offline. Check your connection and try again.";
  if (saveData || effectiveType === "slow-2g" || effectiveType === "2g") {
    return "Your connection is slow. Artwork may take a little longer to load.";
  }
  return null;
}

function shouldTreatAsExpiredSession(status, body) {
  return status === 401 && Boolean(body && body.sessionExpired);
}

module.exports = { connectionMessage, shouldTreatAsExpiredSession };
