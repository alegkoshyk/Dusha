import { decryptApiKey } from './encryption';
import { storage } from './storage';

interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
}

interface NanoBananaTaskResponse {
  code: number;
  msg?: string;
  data?: {
    taskId: string;
  };
}

interface NanoBananaStatusResponse {
  code: number;
  msg?: string;
  data?: {
    taskId: string;
    successFlag: 0 | 1 | 2 | 3; // 0-generating, 1-success, 2-create task failed, 3-generation failed
    errorCode?: number;
    errorMessage?: string;
    response?: {
      originImageUrl?: string;
      resultImageUrl?: string;
    };
  };
}

const NANOBANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

const MERCH_PROMPTS: Record<string, string> = {
  'tshirt': `Use the provided image as a logo reference.

Generate a premium cotton t-shirt.
Color: white.
Place the logo centered on the chest.
Professional silk screen print texture.

Studio product photography.
Soft shadows.
Minimal background.
Photorealistic.`,

  'hoodie': `Use the provided image as a logo reference.

Generate a black oversized hoodie.
Place the logo on the chest.
High-quality fabric texture.

Streetwear style product photography.
Clean background.
High realism.`,

  'cap': `Use the provided image as a logo reference.

Generate a black baseball cap.
Embroidered logo on the front.
Premium stitching.

Studio lighting.
Minimal background.
Photorealistic.`,

  'mug': `Use the provided image as a logo reference.

Generate a ceramic coffee mug.
Logo printed on the side.
Glossy surface with realistic reflections.

Product photography.
Neutral background.
High detail.`,

  'bag': `Use the provided image as a logo reference.

Generate a cotton tote bag, natural beige color.
Logo printed on the front center.
High-quality fabric texture.

Studio product photography.
Clean minimal background.
Photorealistic.`,

  'notebook': `Use the provided image as a logo reference.

Generate a hardcover notebook.
Logo embossed on the cover.
Premium leather-like texture.

Product photography.
Neutral background.
High detail.`,

  'phone-case': `Use the provided image as a logo reference.

Generate a modern smartphone case.
Logo printed on the back.
Matte finish texture.

Product photography.
Clean background.
Photorealistic.`,

  'poster': `Use the provided image as a logo reference.

Generate a promotional poster design.
Logo prominently displayed.
Modern minimalist layout.

High quality print design.
Clean composition.
Professional look.`,
};

const BASE_LOGO_PROMPT = `Use the provided image as a logo reference.

Generate a realistic branded merchandise mockup.
Place the logo naturally on the product.
Do not redraw, modify, or distort the logo.
Keep original proportions, colors, and shape.

Photorealistic product photography.
Studio lighting.
Clean minimal background.
High quality, commercial look.`;

const NEGATIVE_PROMPT = 'distorted logo, modified logo, wrong text, extra symbols, watermark, blurry, low quality, stretched logo';

async function pollForResult(apiKey: string, taskId: string, maxAttempts: number = 60, interval: number = 3000): Promise<NanoBananaStatusResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`NanoBanana: Polling attempt ${i + 1}/${maxAttempts} for task ${taskId}`);
    
    const response = await fetch(`${NANOBANANA_BASE_URL}/record-info?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const result: NanoBananaStatusResponse = await response.json();
    console.log(`NanoBanana: Poll response:`, JSON.stringify(result));

    if (result.code === 200 && result.data) {
      // successFlag: 0-generating, 1-success, 2-create task failed, 3-generation failed
      if (result.data.successFlag === 1) {
        console.log('NanoBanana: Task completed successfully');
        return result;
      }
      
      if (result.data.successFlag === 2 || result.data.successFlag === 3) {
        console.log('NanoBanana: Task failed with successFlag:', result.data.successFlag);
        return result;
      }
      
      // successFlag === 0 means still generating, continue polling
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for image generation');
}

export async function generateImageWithNanoBanana(
  encryptedApiKey: string,
  prompt: string,
  context?: string,
  aspectRatio: string = '1:1',
  sessionId?: string,
  userId?: string,
  logoUrl?: string,
  referenceImageUrls?: string[],
  usePro: boolean = false
): Promise<GenerateImageResult> {
  console.log('NanoBanana: Starting image generation...');
  console.log('NanoBanana: Aspect ratio:', aspectRatio);
  console.log('NanoBanana: Logo URL provided:', !!logoUrl);
  console.log('NanoBanana: Reference images:', referenceImageUrls?.length || 0);
  console.log('NanoBanana: Pro mode:', usePro);
  
  const apiKey = decryptApiKey(encryptedApiKey);
  
  if (!apiKey) {
    console.error('NanoBanana: Failed to decrypt API key');
    return {
      success: false,
      error: "Не вдалося розшифрувати API ключ. Будь ласка, оновіть ключ у налаштуваннях."
    };
  }

  console.log('NanoBanana: API key decrypted, length:', apiKey.length);

  let fullPrompt: string;
  
  const hasReferences = referenceImageUrls && referenceImageUrls.length > 0;
  
  if (logoUrl) {
    fullPrompt = `${BASE_LOGO_PROMPT}\n\n${prompt}`;
    if (hasReferences) {
      fullPrompt += `\n\nUse the provided reference images as style/composition inspiration. Incorporate elements from each reference image into the final result.`;
    }
    console.log('NanoBanana: Using logo reference with prompt');
  } else if (hasReferences) {
    fullPrompt = context 
      ? `Based on this brand context: ${context}\n\nGenerate an image for: ${prompt}\n\nUse the provided reference images as style/composition inspiration. Incorporate elements from each reference image into the final result.`
      : `${prompt}\n\nUse the provided reference images as style/composition inspiration. Incorporate elements from each reference image into the final result.`;
    console.log('NanoBanana: Using reference images with prompt');
  } else {
    fullPrompt = context 
      ? `Based on this brand context: ${context}\n\nGenerate an image for: ${prompt}`
      : prompt;
  }

  try {
    console.log('NanoBanana: Sending request to:', `${NANOBANANA_BASE_URL}/generate`);
    
    const requestBody: Record<string, any> = {
      prompt: fullPrompt,
      numImages: 1,
      callBackUrl: 'https://example.com/callback'
    };
    
    requestBody.image_size = aspectRatio;
    
    if (usePro) {
      requestBody.usePro = true;
      requestBody.streaming = true;
      console.log('NanoBanana: Pro mode with streaming enabled');
    }
    
    const allImageUrls: string[] = [];
    if (logoUrl) allImageUrls.push(logoUrl);
    if (hasReferences) allImageUrls.push(...referenceImageUrls!);
    
    if (allImageUrls.length > 0) {
      requestBody.type = 'IMAGETOIAMGE';
      requestBody.imageUrls = allImageUrls;
      console.log('NanoBanana: Using Image-to-Image mode with', allImageUrls.length, 'images');
    } else {
      requestBody.type = 'TEXTTOIAMGE';
    }
    
    console.log('NanoBanana: Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(`${NANOBANANA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('NanoBanana: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('NanoBanana API error:', response.status, errorData);
      
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "Невірний API ключ. Будь ласка, перевірте налаштування."
        };
      }
      
      // If logo caused the error (media file unavailable), retry without logo
      const errorText = JSON.stringify(errorData).toLowerCase();
      if (logoUrl && (errorText.includes('media file') || errorText.includes('unavailable') || errorText.includes('replace it'))) {
        console.log('NanoBanana: Logo caused API error, retrying without logo...');
        return generateImageWithNanoBanana(encryptedApiKey, prompt, context, aspectRatio, sessionId, userId, undefined, referenceImageUrls, usePro);
      }
      
      return {
        success: false,
        error: `Помилка API: ${errorData.msg || errorData.message || errorData.error || response.statusText}`
      };
    }

    const responseData = await response.json();
    console.log('NanoBanana: Response data:', JSON.stringify(responseData));
    
    if (usePro && responseData.data?.response) {
      console.log('NanoBanana: Streaming/Pro mode - got direct response');
      const directImageUrl = responseData.data.response.resultImageUrl || responseData.data.response.originImageUrl;
      if (directImageUrl) {
        try {
          await storage.logAIUsage({
            provider: 'nanobanana-pro',
            model: 'gemini-3-pro-image',
            tokensInput: null,
            tokensOutput: null,
            costEstimate: '0.12',
            sessionId: sessionId || null,
            userId: userId || null,
            endpoint: 'generateImage-pro-streaming',
          });
        } catch (logError) {
          console.error('Failed to log NanoBanana Pro usage:', logError);
        }
        return {
          success: true,
          imageUrl: directImageUrl
        };
      }
    }
    
    if (usePro && responseData.images) {
      console.log('NanoBanana: Pro streaming mode - images array format');
      const firstImage = responseData.images[0];
      if (firstImage?.url) {
        try {
          await storage.logAIUsage({
            provider: 'nanobanana-pro',
            model: 'gemini-3-pro-image',
            tokensInput: null,
            tokensOutput: null,
            costEstimate: '0.12',
            sessionId: sessionId || null,
            userId: userId || null,
            endpoint: 'generateImage-pro-streaming',
          });
        } catch (logError) {
          console.error('Failed to log NanoBanana Pro usage:', logError);
        }
        return {
          success: true,
          imageUrl: firstImage.url
        };
      }
    }
    
    const taskData = responseData as NanoBananaTaskResponse;
    
    if (taskData.code !== 200 || !taskData.data?.taskId) {
      console.error('NanoBanana: Invalid task response');
      return {
        success: false,
        error: `Помилка створення задачі: ${taskData.msg || 'Невідома помилка'}`
      };
    }

    console.log('NanoBanana: Task created, polling for result...');
    const result = await pollForResult(apiKey, taskData.data.taskId);
    console.log('NanoBanana: Poll result:', JSON.stringify(result));

    if (!result.data) {
      return {
        success: false,
        error: "API не повернуло дані. Спробуйте ще раз."
      };
    }

    // Check successFlag: 2 = create task failed, 3 = generation failed
    if (result.data.successFlag === 2 || result.data.successFlag === 3) {
      const errorMsg = result.data.errorMessage || "Генерація зображення не вдалася";
      console.error('NanoBanana: Generation failed:', errorMsg);
      
      // If logo was used and generation failed, retry without logo (image-to-image mode often fails with external URLs)
      if (logoUrl) {
        console.log('NanoBanana: Generation failed with logo reference, retrying without logo in text-to-image mode...');
        return generateImageWithNanoBanana(encryptedApiKey, prompt, context, aspectRatio, sessionId, userId, undefined, referenceImageUrls, usePro);
      }
      
      return {
        success: false,
        error: `${errorMsg}. Спробуйте інший запит.`
      };
    }

    // successFlag === 1 means success
    const imageUrl = result.data.response?.resultImageUrl || result.data.response?.originImageUrl;
    
    if (imageUrl) {
      console.log('NanoBanana: Image generated successfully:', imageUrl);
      
      // Log usage to database
      try {
        await storage.logAIUsage({
          provider: 'nanobanana',
          model: 'flux-pro',
          tokensInput: null,
          tokensOutput: null,
          costEstimate: '0.02', // Approximate cost per image
          sessionId: sessionId || null,
          userId: userId || null,
          endpoint: 'generateImage',
        });
      } catch (logError) {
        console.error('Failed to log NanoBanana usage:', logError);
      }
      
      return {
        success: true,
        imageUrl: imageUrl
      };
    }

    console.error('NanoBanana: No image URL in response');
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
    // Just check if the API key is valid by making a minimal request
    const response = await fetch(`${NANOBANANA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test validation',
        type: 'TEXTTOIAMGE', // Note: API has typo - IAMGE not IMAGE
        numImages: 1,
        callBackUrl: 'https://example.com/callback'
      })
    });
    
    if (response.status === 401 || response.status === 403) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
