import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

let s3Client: S3Client | null = null;

function getClient(): S3Client {
  if (!s3Client) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured');
    }
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

export async function uploadToR2(key: string, data: Buffer | string, contentType: string = 'application/octet-stream'): Promise<string> {
  const client = getClient();
  const body = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `/api/r2/${key}`;
}

export async function getFromR2(key: string): Promise<Buffer | null> {
  try {
    const client = getClient();
    const response = await client.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));

    if (!response.Body) return null;
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (e: any) {
    if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw e;
  }
}

export async function getFromR2AsString(key: string): Promise<string | null> {
  const buffer = await getFromR2(key);
  if (!buffer) return null;
  return buffer.toString('utf-8');
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
}

export async function uploadCanvasData(brandId: string, canvasJson: any): Promise<string> {
  const key = `canvas/${brandId}/data.json`;
  const data = JSON.stringify(canvasJson);
  return uploadToR2(key, data, 'application/json');
}

export async function getCanvasData(brandId: string): Promise<any | null> {
  const key = `canvas/${brandId}/data.json`;
  const data = await getFromR2AsString(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function uploadChatImage(sessionId: string, imageData: string): Promise<string> {
  const timestamp = Date.now();
  const isBase64 = imageData.startsWith('data:');

  let buffer: Buffer;
  let contentType = 'image/png';

  if (isBase64) {
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageData, 'base64');
    }
  } else {
    const response = await fetch(imageData);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }

  const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  const key = `chat-images/${sessionId}/${timestamp}.${ext}`;

  return uploadToR2(key, buffer, contentType);
}

export function getR2PublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `/api/r2/${key}`;
}
