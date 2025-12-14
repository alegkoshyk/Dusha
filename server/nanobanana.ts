import { decryptApiKey } from './encryption';

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
  aspectRatio: string = '1:1'
): Promise<GenerateImageResult> {
  console.log('NanoBanana: Starting image generation...');
  console.log('NanoBanana: Aspect ratio:', aspectRatio);
  
  const apiKey = decryptApiKey(encryptedApiKey);
  
  if (!apiKey) {
    console.error('NanoBanana: Failed to decrypt API key');
    return {
      success: false,
      error: "Не вдалося розшифрувати API ключ. Будь ласка, оновіть ключ у налаштуваннях."
    };
  }

  console.log('NanoBanana: API key decrypted, length:', apiKey.length);

  const fullPrompt = context 
    ? `Based on this brand context: ${context}\n\nGenerate an image for: ${prompt}`
    : prompt;

  try {
    console.log('NanoBanana: Sending request to:', `${NANOBANANA_BASE_URL}/generate`);
    
    // According to official docs: callBackUrl is required but we use polling instead
    // Using a dummy callback URL since we're polling
    const requestBody = {
      prompt: fullPrompt,
      type: 'TEXTTOIAMGE',
      numImages: 1,
      image_size: aspectRatio,
      callBackUrl: 'https://example.com/callback' // Required by API but we use polling
    };
    
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
      
      return {
        success: false,
        error: `Помилка API: ${errorData.msg || errorData.message || response.statusText}`
      };
    }

    const taskData: NanoBananaTaskResponse = await response.json();
    console.log('NanoBanana: Task response:', JSON.stringify(taskData));
    
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
      return {
        success: false,
        error: `${errorMsg}. Спробуйте інший запит.`
      };
    }

    // successFlag === 1 means success
    const imageUrl = result.data.response?.resultImageUrl || result.data.response?.originImageUrl;
    
    if (imageUrl) {
      console.log('NanoBanana: Image generated successfully:', imageUrl);
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
        type: 'TEXTTOIAMGE',
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
