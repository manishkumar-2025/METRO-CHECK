/* ==========================================================================
   METRO-CHECK - Tiny Backend Proxy Server (server/server.js)
   Protects Gemini API Key and communicates with Google Gemini Vision AI
   ========================================================================== */

// 1. Load environment variables from .env file (keeps API key secure)
require("dotenv").config();

// 2. Import required third-party libraries
const express = require("express"); // Web application framework for Node.js
const cors = require("cors"); // Allows frontend (running on different port) to access backend
const multer = require("multer"); // Middleware for handling multipart/form-data image uploads
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Google Gemini AI SDK

// 3. Initialize Express server application
const app = express();

// 4. Set the port number from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// 5. Enable CORS to allow requests from any local development frontend
app.use(cors());

// 6. Enable JSON parsing for incoming request bodies
app.use(express.json());

// 7. Configure Multer to store uploaded images in memory buffer (no disk saving needed)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 8. Fallback mock data returned when Gemini API is offline or key is unconfigured
const fallbackMockData = {
  commodity_name: "Basmati Rice Premium",
  net_quantity: "5 kg",
  mrp: "₹450.00 (incl. all taxes)",
  manufacturer: "ABC Foods Pvt Ltd, Mumbai",
  mfg_date: "01/2025",
  consumer_care: null // Intentional sample violation for compliance testing
};

/**
 * Exact prompt string instructed for Legal Metrology package compliance extraction.
 */
const GEMINI_COMPLIANCE_PROMPT = `Analyze this product label image. Extract the following fields and return ONLY a valid JSON object (no markdown, no explanation):
{
  commodity_name: string or null,
  net_quantity: string or null,
  mrp: string or null,
  manufacturer: string or null,
  mfg_date: string or null,
  consumer_care: string or null
}
If any field is not visible on the label, set it to null.`;

// 9. Root health-check endpoint
app.get("/", function(req, res) {
  res.json({
    system: "METRO-CHECK Backend Server",
    status: "online",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here")
  });
});

/**
 * 10. POST /api/scan
 * Receives package image, sends buffer to Gemini Vision API, returns structured JSON.
 */
app.post("/api/scan", upload.single("image"), async function(req, res) {
  try {
    // Verify an image was actually uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided in request." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is missing or is still the placeholder text, use the fallback mock
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.log("No valid GEMINI_API_KEY found in server/.env, returning fallback mock data.");
      return res.json(fallbackMockData);
    }

    // Initialize Google Generative AI client with the secret key
    const genAI = new GoogleGenerativeAI(apiKey);

    // Select the Gemini model (gemini-1.5-flash handles multimodal images and is super fast)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format the in-memory image buffer into Gemini inlineData format
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype || "image/jpeg"
      }
    };

    // Send the image and extraction prompt to Gemini
    const result = await model.generateContent([GEMINI_COMPLIANCE_PROMPT, imagePart]);
    const responseText = result.response.text();

    // Clean any markdown code fences that Gemini might wrap around the JSON output
    const cleanJsonString = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Parse into JavaScript object
    const extractedData = JSON.parse(cleanJsonString);

    // Send the extracted JSON back to the frontend
    return res.json(extractedData);

  } catch (error) {
    // If anything fails during the Gemini API call, log the error and send fallback data
    console.error("Gemini Vision API error (falling back to mock):", error.message);
    return res.json(fallbackMockData);
  }
});

// 11. Start the HTTP server listening on the configured PORT
app.listen(PORT, function() {
  console.log("====================================================");
  console.log("METRO-CHECK Backend Server running on port " + PORT);
  console.log("Ready to proxy Gemini Vision API requests at /api/scan");
  console.log("====================================================");
});
