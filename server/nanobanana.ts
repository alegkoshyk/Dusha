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
    status: 'pending' | 'processing' | 'completed' | 'failed';
    images?: Array<{
      url: string;
    }>;
  };
}

const NANOBANANA_BASE_URL = 'https://api.nanobananaapi.ai/api/v1/nanobanana';

async function pollForResult(apiKey: string, taskId: string, maxAttempts: number = 30, interval: number = 3000): Promise<NanoBananaStatusResponse> {
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

    if (result.code === 200 && result.data?.status === 'completed') {
      return result;
    }
    
    if (result.code === 200 && result.data?.status === 'failed') {
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for image generation');
}

export async function generateImageWithNanoBanana(
  encryptedApiKey: string,
  prompt: string,
  context?: string
): Promise<GenerateImageResult> {
  console.log('NanoBanana: Starting image generation...');
  
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
    
    const response = await fetch(`${NANOBANANA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        type: 'TEXTTOIMAGE',
        numImages: 1
      })
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

    if (result.data?.status === 'failed') {
      return {
        success: false,
        error: "Генерація зображення не вдалася. Спробуйте інший запит."
      };
    }

    if (result.data?.images?.[0]?.url) {
      console.log('NanoBanana: Image generated successfully');
      return {
        success: true,
        imageUrl: result.data.images[0].url
      };
    }

    console.error('NanoBanana: No image in response');
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
    const response = await fetch(`${NANOBANANA_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test',
        type: 'TEXTTOIMAGE',
        numImages: 1
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
