import { GoogleGenAI, Modality } from "@google/genai";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access without requiring your own Gemini API key.
export const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

interface ReferenceImage {
  data: string; // base64 data (without data URL prefix) or full data URL
  mimeType?: string;
  label?: string; // e.g., "brand logo", "persona avatar"
}

/**
 * Extract base64 data and mime type from a data URL or raw base64
 */
function parseImageData(dataOrUrl: string): { data: string; mimeType: string } {
  if (dataOrUrl.startsWith("data:")) {
    const match = dataOrUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], data: match[2] };
    }
  }
  // Assume it's raw base64 PNG
  return { data: dataOrUrl, mimeType: "image/png" };
}

/**
 * Fetch image from URL and convert to base64
 * Handles proxy URLs (/api/media/proxy?key=...) by reading directly from object storage
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  if (url.startsWith("data:")) {
    return parseImageData(url);
  }
  
  const r2PublicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  if (url.startsWith("/api/r2/") || (r2PublicUrl && url.startsWith(r2PublicUrl))) {
    try {
      const { getFromR2 } = await import("../../r2Storage");
      let key: string;
      if (url.startsWith("/api/r2/")) {
        key = url.replace(/^\/api\/r2\//, '');
      } else {
        key = url.replace(`${r2PublicUrl}/`, '');
      }
      const buffer = await getFromR2(key);
      if (buffer) {
        const base64 = buffer.toString("base64");
        const ext = key.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
        return { data: base64, mimeType };
      }
    } catch (e) {
      console.error("Failed to read from R2:", e);
    }
  }

  if (url.startsWith("/api/media/proxy")) {
    try {
      const keyMatch = url.match(/[?&]key=([^&]+)/);
      if (keyMatch) {
        const { getFromR2 } = await import("../../r2Storage");
        const storageKey = decodeURIComponent(keyMatch[1]);
        const buffer = await getFromR2(storageKey);
        if (buffer) {
          const base64 = buffer.toString("base64");
          const ext = storageKey.split('.').pop()?.toLowerCase();
          const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
          return { data: base64, mimeType };
        }
      }
    } catch (e) {
      console.error("Failed to read media proxy key from R2:", e);
    }
  }
  
  if (url.startsWith("/")) {
    const port = process.env.PORT || "5000";
    url = `http://127.0.0.1:${port}${url}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/png";
  
  return { data: base64, mimeType: contentType };
}

/**
 * Generate an image and return as base64 data URL.
 * Uses gemini-2.5-flash-image model via Replit AI Integrations.
 */
export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

/**
 * Generate an image with reference images.
 * Uses gemini-2.5-flash-image model with multimodal input.
 * 
 * @param prompt - Text prompt describing what to generate
 * @param referenceImages - Array of reference images (logo, avatar, etc.)
 */
export async function generateImageWithReferences(
  prompt: string,
  referenceImages: { url: string; label: string }[]
): Promise<string> {
  // Build parts array with reference images first, then text prompt
  const parts: any[] = [];
  
  // Add reference images
  for (const ref of referenceImages) {
    try {
      const { data, mimeType } = await fetchImageAsBase64(ref.url);
      parts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
      // Add label for each image
      parts.push({ text: `[${ref.label}]` });
    } catch (error) {
      console.error(`Failed to fetch reference image ${ref.label}:`, error);
      // Skip this reference if we can't fetch it
    }
  }
  
  // Add the main prompt at the end
  parts.push({ text: prompt });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

