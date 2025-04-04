// src/services/aiService.js
import axios from "axios";

export const sendImageToGemini = async (base64Image, prompt = "") => {
  try {
    const geminiApiUrl = import.meta.env.VITE_GEMINI_API_URL; // e.g. "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0:generateContent"
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY; // your API key

    // Construct the full URL with the API key
    const url = `${geminiApiUrl}?key=${geminiApiKey}`;

    // Default prompt instructing a strict JSON output
    const effectivePrompt =
      prompt ||
      `Please analyze the attached image and return a valid JSON object with exactly the following keys and no extra text or markdown:
{
  "detectedWasteType": "string",
  "upcyclingMethods": "string",
  "recyclingGuidelines": "string",
  "youtubeLinks": ["string"]
}
The "upcyclingMethods" key should include creative upcycling ideas along with detailed, step-by-step instructions for repurposing the waste.
The "recyclingGuidelines" key should provide safe disposal methods, recycling tips, and recommendations for enhancing sustainability.
Also, include at least five YouTube links (formatted as typical video URLs such as 'https://www.youtube.com/watch?v=VIDEOID') that demonstrate practical and easy upcycling projects.
Respond only with the JSON object.`;

    // Remove any "data:image/..." prefix if present
    const cleanedBase64 = base64Image.startsWith("data:image")
      ? base64Image.split(",")[1]
      : base64Image;

    // The "contents" approach: text prompt + inlineData for the image
    const payload = {
      contents: [
        {
          parts: [
            { text: effectivePrompt },
            {
              inlineData: {
                mimeType: "image/jpeg", // or "image/png" if needed
                data: cleanedBase64,    // the raw Base64 without "data:image..."
              },
            },
          ],
        },
      ],
    };

    console.log("Payload (for debugging):", JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // The API should return something like:
    // {
    //   candidates: [
    //     {
    //       content: {
    //         parts: [
    //           { text: "{ ...valid JSON... }" }
    //         ]
    //       }
    //     }
    //   ]
    // }
    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates.length > 0
    ) {
      // Grab the text from the first candidate
      let rawText =
        response.data.candidates[0].content?.parts?.[0]?.text || "";

      // If the model wraps JSON in triple-backticks or Markdown, strip it
      rawText = rawText
        .replace(/```json\s*/i, "")
        .replace(/```/, "")
        .trim();

      // Attempt to parse the JSON
      const parsed = JSON.parse(rawText);
      return parsed;
    } else {
      throw new Error("No candidates received from Gemini API.");
    }
  } catch (error) {
    console.error("Gemini API error:", error.response ? error.response.data : error);
    throw error;
  }
};


