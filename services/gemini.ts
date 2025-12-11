import { GoogleGenAI } from "@google/genai";

// Helper to check if API key exists
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const GeminiService = {
  /**
   * Edit an image using Gemini 2.5 Flash Image (Nano Banana)
   */
  editImage: async (imageBase64: string, prompt: string): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
      // Clean base64 string if it has prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Using Flash Image for editing capabilities
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from string
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      // Extract image from response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Gemini Image Edit Error:", error);
      return null;
    }
  },

  /**
   * Find a place using Google Maps Grounding
   */
  findPlace: async (query: string): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Find the Google Maps Embed URL for this place: ${query}. return JUST the src URL for an iframe if possible, or the maps link.`,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });

      // Check grounding chunks for Maps URI
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
          // Look for a map URI in chunks
          // This is a simplification; in a real app we might parse the text response
          // But let's try to extract a useful link from the text or chunks
      }
      
      // Fallback to text parsing if the model returns the link directly
      const text = response.text || "";
      const urlMatch = text.match(/https?:\/\/[^\s"']+/);
      return urlMatch ? urlMatch[0] : null;

    } catch (error) {
      console.error("Gemini Maps Error:", error);
      return null;
    }
  }
};