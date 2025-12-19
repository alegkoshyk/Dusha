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
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }

    const objectId = `logos/${brandId}/${randomUUID()}-${fileName}`;
    const fullPath = `${privateObjectDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const uploadUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });

    const publicUrl = `https://storage.googleapis.com${fullPath}`;

    return { uploadUrl, publicUrl };
  }

  async uploadLogoFromBase64(brandId: string, base64Data: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }

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
    const fullPath = `${privateObjectDir}/${objectId}`;
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

    // Generate a long-lived signed URL (7 days) since makePublic is not allowed
    const signedUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec: 7 * 24 * 60 * 60, // 7 days
    });

    return signedUrl;
  }

  async getPublicUrl(objectPath: string): Promise<string> {
    const { bucketName, objectName } = parseObjectPath(objectPath);
    return `https://storage.googleapis.com/${bucketName}/${objectName}`;
  }

  async uploadTemplateReferenceImage(templateId: number, base64Data: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }

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
    const fullPath = `${privateObjectDir}/${objectId}`;
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

    const signedUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec: 365 * 24 * 60 * 60, // 1 year
    });

    return signedUrl;
  }

  async uploadImageFromUrl(folder: string, imageUrl: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }

    // Validate URL protocol
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new Error("Invalid URL protocol: only HTTP(S) allowed");
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let fetchResponse: globalThis.Response;
    try {
      fetchResponse = await fetch(imageUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${fetchResponse.status}`);
    }

    // Check content length (max 10MB)
    const contentLength = fetchResponse.headers.get('content-length');
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error("Image too large: max 10MB allowed");
    }

    const contentType = fetchResponse.headers.get('content-type') || 'image/png';
    
    // Validate content type is an image
    if (!contentType.startsWith('image/')) {
      throw new Error("Invalid content type: only images allowed");
    }
    
    let extension = 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
    else if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';

    const arrayBuffer = await fetchResponse.arrayBuffer();
    
    // Double-check size after download
    if (arrayBuffer.byteLength > maxSize) {
      throw new Error("Image too large: max 10MB allowed");
    }
    
    const buffer = Buffer.from(arrayBuffer);

    const objectId = `${folder}/${randomUUID()}.${extension}`;
    const fullPath = `${privateObjectDir}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    const signedUrl = await signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec: 365 * 24 * 60 * 60, // 1 year
    });

    return signedUrl;
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
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
