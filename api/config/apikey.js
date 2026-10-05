/**
 * Vercel Serverless Function: /api/config/apikey
 * Lightweight status check for configured Gemini credentials.
 */
module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed. Configure GEMINI_API_KEY via Vercel dashboard environment variables." });
  }
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  const configured = Boolean(key && key.length > 10);
  const credType = configured ? (key.startsWith("AIza") ? "api_key" : "service_account") : "missing";

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Content-Type", "application/json");

  return res.status(200).json({
    configured,
    isValidFormat: configured,
    credType,
    keyMasked: configured ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : "Not Configured"
  });
};
