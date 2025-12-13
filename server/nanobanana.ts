import { decryptApiKey } from './encryption';

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
}

export async function generateImageWithNanoBanana(
  encryptedApiKey: string,
  prompt: string,
  context?: string
): Promise<GenerateImageResult> {
  const apiKey = decryptApiKey(encryptedApiKey);
  
  if (!apiKey) {
    return {
      success: false,
      error: "Не вдалося розшифрувати API ключ. Будь ласка, оновіть ключ у налаштуваннях."
    };
  }

  const fullPrompt = context 
    ? `Based on this brand context: ${context}\n\nGenerate an image for: ${prompt}`
    : prompt;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{
            prompt: fullPrompt
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1"
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('NanoBanana API error:', errorData);
      
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "Невірний API ключ. Будь ласка, перевірте налаштування."
        };
      }
      
      return {
        success: false,
        error: `Помилка API: ${errorData.error?.message || response.statusText}`
      };
    }

    const data = await response.json();
    
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return {
        success: true,
        imageBase64: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`
      };
    }

    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return {
            success: true,
            imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          };
        }
      }
    }

    return {
      success: false,
      error: "API не повернуло зображення. Спробуйте інший запит."
    };
    
  } catch (error: any) {
    console.error('NanoBanana generation error:', error);
    return {
      success: false,
      error: error.message || "Невідома помилка при генерації зображення"
    };
  }
}

export async function validateApiKey(encryptedApiKey: string): Promise<boolean> {
  const apiKey = decryptApiKey(encryptedApiKey);
  
  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET' }
    );
    
    return response.ok;
  } catch {
    return false;
  }
}
