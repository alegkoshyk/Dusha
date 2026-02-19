import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

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

function getR2Url(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `/api/r2/${key}`;
}

function parseBase64(base64Data: string): { buffer: Buffer; extension: string; contentType: string } {
  const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid base64 image format");
  }
  const rawType = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  let extension = 'png';
  if (rawType.includes('jpeg') || rawType.includes('jpg')) extension = 'jpg';
  else if (rawType.includes('png')) extension = 'png';
  else if (rawType.includes('webp')) extension = 'webp';
  else if (rawType.includes('gif')) extension = 'gif';
  else if (rawType.includes('svg')) extension = 'svg';

  const contentType = extension === 'svg' ? 'image/svg+xml' : rawType;
  return { buffer, extension, contentType };
}

export async function uploadToR2(key: string, data: Buffer | string, contentType: string = 'application/octet-stream'): Promise<string> {
  const client = getClient();
  const body = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  }));

  return getR2Url(key);
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

export async function listR2Objects(prefix: string): Promise<string[]> {
  const client = getClient();
  const response = await client.send(new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: 1000,
  }));
  return (response.Contents || []).map(obj => obj.Key!).filter(Boolean);
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
    const parsed = parseBase64(imageData);
    buffer = parsed.buffer;
    contentType = parsed.contentType;
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

export async function uploadMediaAsset(params: {
  userId: string;
  assetType: 'logo' | 'avatar' | 'chat_user' | 'chat_ai' | 'merch' | 'attachment' | 'product_image' | 'template';
  brandId?: string;
  productId?: string;
  templateId?: number;
  base64Data: string;
}): Promise<{ publicUrl: string; storageKey: string; sizeBytes: number; mimeType: string }> {
  const { buffer, extension, contentType } = parseBase64(params.base64Data);
  const sizeBytes = buffer.length;

  let pathPrefix: string;
  switch (params.assetType) {
    case 'logo':
      pathPrefix = `logos/${params.brandId || params.userId}`;
      break;
    case 'avatar':
      pathPrefix = `avatars/${params.userId}`;
      break;
    case 'chat_user':
    case 'chat_ai':
      pathPrefix = `chat/${params.userId}`;
      break;
    case 'merch':
      pathPrefix = `merch/${params.brandId || params.userId}`;
      break;
    case 'attachment':
      pathPrefix = `attachments/${params.userId}`;
      break;
    case 'product_image':
      pathPrefix = `products/${params.productId || params.brandId || params.userId}`;
      break;
    case 'template':
      pathPrefix = `templates/${params.templateId || params.userId}`;
      break;
    default:
      pathPrefix = `misc/${params.userId}`;
  }

  const storageKey = `${pathPrefix}/${randomUUID()}.${extension}`;
  const publicUrl = await uploadToR2(storageKey, buffer, contentType);

  return { publicUrl, storageKey, sizeBytes, mimeType: contentType };
}

export async function uploadLogoFromBase64(brandId: string, base64Data: string): Promise<string> {
  const { buffer, extension, contentType } = parseBase64(base64Data);
  const key = `logos/${brandId}/${randomUUID()}.${extension}`;
  return uploadToR2(key, buffer, contentType);
}

export async function uploadAvatar(userId: string, base64Data: string): Promise<string> {
  const { buffer, extension, contentType } = parseBase64(base64Data);
  const key = `avatars/${userId}/${randomUUID()}.${extension}`;
  return uploadToR2(key, buffer, contentType);
}

export async function uploadProductImage(productId: string, base64Data: string): Promise<string> {
  const { buffer, extension, contentType } = parseBase64(base64Data);
  const key = `products/${productId}/${randomUUID()}.${extension}`;
  return uploadToR2(key, buffer, contentType);
}

export async function uploadTemplateReferenceImage(templateId: number, base64Data: string): Promise<string> {
  const { buffer, extension, contentType } = parseBase64(base64Data);
  const key = `templates/${templateId}/${randomUUID()}.${extension}`;
  return uploadToR2(key, buffer, contentType);
}

export async function uploadImageFromUrl(folder: string, imageUrl: string): Promise<string> {
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    throw new Error("Invalid URL protocol: only HTTP(S) allowed");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let fetchResponse: globalThis.Response;
  try {
    fetchResponse = await fetch(imageUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!fetchResponse.ok) {
    throw new Error(`Failed to fetch image from URL: ${fetchResponse.status}`);
  }

  const contentLength = fetchResponse.headers.get('content-length');
  const maxSize = 10 * 1024 * 1024;
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new Error("Image too large: max 10MB allowed");
  }

  const contentType = fetchResponse.headers.get('content-type') || 'image/png';
  if (!contentType.startsWith('image/')) {
    throw new Error("Invalid content type: only images allowed");
  }

  let extension = 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
  else if (contentType.includes('webp')) extension = 'webp';

  const arrayBuffer = await fetchResponse.arrayBuffer();
  if (arrayBuffer.byteLength > maxSize) {
    throw new Error("Image too large: max 10MB allowed");
  }

  const buffer = Buffer.from(arrayBuffer);
  const key = `${folder}/${randomUUID()}.${extension}`;

  return uploadToR2(key, buffer, contentType);
}

export function getR2ProxyUrl(key: string): string {
  return `/api/r2/${key}`;
}

export function getR2PublicUrl(key: string): string {
  return getR2Url(key);
}
