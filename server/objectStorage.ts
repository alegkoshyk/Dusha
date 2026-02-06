// Object Storage Service for Replit
// Based on blueprint:javascript_object_storage integration

import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    const searchPaths = this.getPublicObjectSearchPaths();
    if (searchPaths.length === 0) return null;
    
    for (const searchPath of searchPaths) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getLogoUploadURL(brandId: string, fileName: string): Promise<{ uploadUrl: string; publicUrl: string }> {
    // Use PUBLIC storage for logos so they are always accessible
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }

    const publicDir = publicSearchPaths[0]; // Use first public path
    const objectId = `logos/${brandId}/${randomUUID()}-${fileName}`;
    const fullPath = `${publicDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const uploadUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });

    // Public URL that never expires
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;

    return { uploadUrl, publicUrl };
  }

  async uploadLogoFromBase64(brandId: string, base64Data: string): Promise<string> {
    // Use PUBLIC storage for logos so they are always accessible
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }

    const publicDir = publicSearchPaths[0]; // Use first public path

    const match = base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 image format");
    }

    let extension = match[1];
    if (extension === 'svg+xml') extension = 'svg';
    if (extension === 'jpeg') extension = 'jpg';
    const imageData = match[2];
    const buffer = Buffer.from(imageData, 'base64');

    const objectId = `logos/${brandId}/${randomUUID()}.${extension}`;
    const fullPath = `${publicDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const contentType = extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Return permanent public URL (no signed URL needed for public storage)
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
    console.log(`Logo uploaded to public storage: ${publicUrl}`);
    
    return publicUrl;
  }

  async getPublicUrl(objectPath: string): Promise<string> {
    const { bucketName, objectName } = parseObjectPath(objectPath);
    return `https://storage.googleapis.com/${bucketName}/${objectName}`;
  }

  // Generic method for uploading media assets with structured paths
  async uploadMediaAsset(params: {
    userId: string;
    assetType: 'logo' | 'avatar' | 'chat_user' | 'chat_ai' | 'merch' | 'attachment';
    brandId?: string;
    base64Data: string;
  }): Promise<{ publicUrl: string; storageKey: string; sizeBytes: number; mimeType: string }> {
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }

    const publicDir = publicSearchPaths[0];

    const match = params.base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 image format");
    }

    let extension = match[1];
    if (extension === 'svg+xml') extension = 'svg';
    if (extension === 'jpeg') extension = 'jpg';
    const imageData = match[2];
    const buffer = Buffer.from(imageData, 'base64');
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
      default:
        pathPrefix = `misc/${params.userId}`;
    }

    const objectId = `${pathPrefix}/${randomUUID()}.${extension}`;
    const fullPath = `${publicDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const contentType = extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
    console.log(`Media asset uploaded to public storage: ${publicUrl}`);

    return {
      publicUrl,
      storageKey: objectId,
      sizeBytes,
      mimeType: contentType
    };
  }

  async uploadAvatar(userId: string, base64Data: string): Promise<string> {
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }
    const publicDir = publicSearchPaths[0];

    const match = base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 image format");
    }

    let extension = match[1];
    if (extension === 'jpeg') extension = 'jpg';
    const imageData = match[2];
    const buffer = Buffer.from(imageData, 'base64');

    const objectId = `avatars/${userId}/${randomUUID()}.${extension}`;
    const fullPath = `${publicDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const contentType = `image/${extension}`;
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
    console.log(`Avatar uploaded to public storage: ${publicUrl}`);
    return publicUrl;
  }

  async uploadTemplateReferenceImage(templateId: number, base64Data: string): Promise<string> {
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }
    const publicDir = publicSearchPaths[0];

    const match = base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 image format");
    }

    let extension = match[1];
    if (extension === 'svg+xml') extension = 'svg';
    if (extension === 'jpeg') extension = 'jpg';
    const imageData = match[2];
    const buffer = Buffer.from(imageData, 'base64');

    const objectId = `templates/${templateId}/${randomUUID()}.${extension}`;
    const fullPath = `${publicDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const contentType = extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
    console.log(`Template image uploaded to public storage: ${publicUrl}`);
    return publicUrl;
  }

  async uploadProductImage(productId: string, base64Data: string): Promise<string> {
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }
    const publicDir = publicSearchPaths[0];

    const match = base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 image format");
    }

    let extension = match[1];
    if (extension === 'svg+xml') extension = 'svg';
    if (extension === 'jpeg') extension = 'jpg';
    const imageData = match[2];
    const buffer = Buffer.from(imageData, 'base64');

    const objectId = `products/${productId}/${randomUUID()}.${extension}`;
    const fullPath = `${publicDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const contentType = extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
    console.log(`Product image uploaded to public storage: ${publicUrl}`);
    return publicUrl;
  }

  async uploadImageFromUrl(folder: string, imageUrl: string): Promise<string> {
    const publicSearchPaths = this.getPublicObjectSearchPaths();
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }
    const publicDir = publicSearchPaths[0];

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new Error("Invalid URL protocol: only HTTP(S) allowed");
    }

    console.log('uploadImageFromUrl: Fetching image from:', imageUrl.substring(0, 100) + '...');

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
    else if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';

    const arrayBuffer = await fetchResponse.arrayBuffer();
    
    if (arrayBuffer.byteLength > maxSize) {
      throw new Error("Image too large: max 10MB allowed");
    }
    
    const buffer = Buffer.from(arrayBuffer);
    console.log('uploadImageFromUrl: Downloaded image, size:', buffer.length);

    const objectId = `${folder}/${randomUUID()}.${extension}`;
    const fullPath = `${publicDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    console.log('uploadImageFromUrl: Saving to bucket:', bucketName, 'object:', objectName);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
    console.log('uploadImageFromUrl: Success, public URL:', publicUrl);
    return publicUrl;
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  
  console.log('signObjectURL: Request:', JSON.stringify(request));
  
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error('signObjectURL: Error response:', response.status, errorText);
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

/**
 * Regenerate a fresh signed URL from an existing (possibly expired) signed URL
 * Extracts bucket and object path from the URL and generates a new signed URL
 */
export async function refreshSignedUrl(existingUrl: string): Promise<string> {
  // Parse the URL to extract bucket and object path
  // Format: https://storage.googleapis.com/bucket-name/object-path?X-Goog-...
  try {
    const url = new URL(existingUrl);
    const pathParts = url.pathname.split('/');
    // First part is empty (leading /), second is bucket name, rest is object path
    if (pathParts.length < 3) {
      throw new Error("Invalid storage URL format");
    }
    
    const bucketName = pathParts[1];
    const objectPath = pathParts.slice(2).join('/');
    
    console.log(`refreshSignedUrl: Regenerating URL for bucket=${bucketName}, object=${objectPath}`);
    
    const freshUrl = await signObjectURL({
      bucketName,
      objectName: objectPath,
      method: "GET",
      ttlSec: 60 * 60 * 24 * 7, // 7 days
    });
    
    return freshUrl;
  } catch (error) {
    console.error("refreshSignedUrl: Failed to regenerate URL:", error);
    throw error;
  }
}
