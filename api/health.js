/**
 * Vercel Serverless Function: /api/health
 * Lightweight, zero-cold-start health check endpoint.
 * Returns 200 OK immediately for frontend connectivity verification.
 */
module.exports = (req, res) => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  const configured = Boolean(key && key.length > 10);
  const credType = configured ? (key.startsWith("AIza") ? "api_key" : "service_account") : "missing";

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Content-Type", "application/json");

  return res.status(200).json({
    system: "METRO-CHECK Legal Metrology Compliance Engine (AI Vision Assisted)",
    status: "online",
    primaryModel: "gemini-3.5-flash-lite",
    fallbackModel: "gemini-3.8-flash",
    geminiConfigured: configured,
    credType: credType,
    geminiValidFormat: configured
  });
};
