import { db } from "./db";
import { eq } from "drizzle-orm";
import { mediaAssetsTable, aiChatMessagesTable, userBrandsTable, brandProductsTable, targetAudiencesTable, generationTemplatesTable, userProfilesTable } from "@shared/schema";
import { isR2Configured, uploadToR2, uploadProductImage, uploadChatImage } from "./r2Storage";
import { randomUUID } from "crypto";

async function downloadFromUrl(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch { return null; }
}

function parseBase64ToBuffer(dataUrl: string): { buffer: Buffer; contentType: string; extension: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  let extension = 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
  else if (contentType.includes('webp')) extension = 'webp';
  return { buffer, contentType, extension };
}

function getExtFromContentType(ct: string): string {
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  return 'png';
}

let osClient: any = null;
try {
  const osModule = await import('./objectStorage');
  osClient = osModule.objectStorageClient;
  console.log('GCS client loaded');
} catch {
  console.log('GCS client not available, will skip GCS downloads');
}

const publicSearchPaths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || '').split(',').map(p => p.trim()).filter(Boolean);
const privateDir = process.env.PRIVATE_OBJECT_DIR || '';

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) path = "/" + path;
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error(`Invalid object path: ${path}`);
  return { bucketName: parts[0], objectName: parts.slice(1).join("/") };
}

async function downloadFromGCS(storageKey: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!osClient) return null;
  const allDirs = [...publicSearchPaths, privateDir].filter(Boolean);
  for (const dir of allDirs) {
    try {
      const fullPath = `${dir}/${storageKey}`;
      const parsed = parseObjectPath(fullPath);
      const file = osClient.bucket(parsed.bucketName).file(parsed.objectName);
      const [exists] = await file.exists();
      if (exists) {
        const [buffer] = await file.download();
        const [metadata] = await file.getMetadata();
        return { buffer, contentType: metadata.contentType || 'image/png' };
      }
    } catch { }
  }
  return null;
}

async function migrateUrl(url: string, prefix: string, storageKey?: string): Promise<string | null> {
  if (url.startsWith('/api/r2/')) return null;

  if (url.startsWith('data:')) {
    const parsed = parseBase64ToBuffer(url);
    if (!parsed) return null;
    const key = `${prefix}/${randomUUID()}.${parsed.extension}`;
    return await uploadToR2(key, parsed.buffer, parsed.contentType);
  }

  if (url.startsWith('/api/media/proxy')) {
    const keyMatch = url.match(/[?&]key=([^&]+)/);
    if (keyMatch) {
      const sk = decodeURIComponent(keyMatch[1]);
      const gcsData = await downloadFromGCS(sk);
      if (gcsData) {
        const ext = getExtFromContentType(gcsData.contentType);
        const key = `${prefix}/${randomUUID()}.${ext}`;
        return await uploadToR2(key, gcsData.buffer, gcsData.contentType);
      }
    }
    return null;
  }

  if (url.includes('storage.googleapis.com') && osClient) {
    const urlMatch = url.match(/storage\.googleapis\.com\/([^/]+)\/(.+?)(\?|$)/);
    if (urlMatch) {
      const bucket = urlMatch[1];
      const objectPath = decodeURIComponent(urlMatch[2]);
      try {
        const file = osClient.bucket(bucket).file(objectPath);
        const [exists] = await file.exists();
        if (exists) {
          const [buffer] = await file.download();
          const [metadata] = await file.getMetadata();
          const ext = getExtFromContentType(metadata.contentType || 'image/png');
          const key = `${prefix}/${randomUUID()}.${ext}`;
          return await uploadToR2(key, buffer, metadata.contentType || 'image/png');
        }
      } catch { }
    }
  }

  if (url.startsWith('http')) {
    const data = await downloadFromUrl(url);
    if (data) {
      const ext = getExtFromContentType(data.contentType);
      const key = `${prefix}/${randomUUID()}.${ext}`;
      return await uploadToR2(key, data.buffer, data.contentType);
    }
  }

  return null;
}

async function main() {
  if (!isR2Configured()) {
    console.error('R2 is not configured!');
    process.exit(1);
  }
  console.log('R2 configured, starting migration...\n');

  let migrated = 0;
  let errors = 0;
  let skipped = 0;

  // 1. MEDIA ASSETS
  console.log('=== 1. Media Assets ===');
  const allAssets = await db.select().from(mediaAssetsTable);
  console.log(`Found ${allAssets.length} media assets`);
  for (const asset of allAssets) {
    if (asset.publicUrl?.startsWith('/api/r2/')) { skipped++; continue; }
    try {
      const r2Url = await migrateUrl(
        asset.publicUrl || '',
        `misc/${asset.userId}`,
        asset.storageKey || undefined
      );
      if (r2Url) {
        const storageKey = r2Url.replace(/^\/api\/r2\//, '');
        await db.update(mediaAssetsTable).set({ publicUrl: r2Url, storageKey, updatedAt: new Date() }).where(eq(mediaAssetsTable.id, asset.id));
        migrated++;
        console.log(`  ✓ Asset ${asset.id} (${asset.assetType})`);
      } else { skipped++; }
    } catch (err) {
      console.error(`  ✗ Asset ${asset.id}:`, err);
      errors++;
    }
  }

  // 2. BRAND LOGOS
  console.log('\n=== 2. Brand Logos ===');
  const allBrands = await db.select().from(userBrandsTable);
  console.log(`Found ${allBrands.length} brands`);
  for (const brand of allBrands) {
    if (!brand.logo || brand.logo.startsWith('/api/r2/')) continue;
    try {
      const r2Url = await migrateUrl(brand.logo, `logos/${brand.id}`);
      if (r2Url) {
        await db.update(userBrandsTable).set({ logo: r2Url }).where(eq(userBrandsTable.id, brand.id));
        migrated++;
        console.log(`  ✓ Brand "${brand.name}" logo`);
      }
    } catch (err) {
      console.error(`  ✗ Brand ${brand.id}:`, err);
      errors++;
    }
  }

  // 3. PRODUCTS
  console.log('\n=== 3. Products ===');
  const allProducts = await db.select().from(brandProductsTable);
  console.log(`Found ${allProducts.length} products`);
  for (const product of allProducts) {
    let changed = false;
    let mainImg = product.mainImageUrl;
    const images = (product.images as string[]) || [];
    const newImages: string[] = [];

    try {
      for (const img of images) {
        if (img.startsWith('/api/r2/')) { newImages.push(img); continue; }
        const r2Url = await migrateUrl(img, `products/${product.id}`);
        if (r2Url) {
          newImages.push(r2Url);
          if (mainImg === img) mainImg = r2Url;
          migrated++;
          changed = true;
        } else {
          newImages.push(img);
        }
      }

      if (mainImg && !mainImg.startsWith('/api/r2/') && mainImg !== product.mainImageUrl) {
      } else if (mainImg && !mainImg.startsWith('/api/r2/')) {
        const r2Url = await migrateUrl(mainImg, `products/${product.id}`);
        if (r2Url) { mainImg = r2Url; changed = true; migrated++; }
      }

      if (changed) {
        await db.update(brandProductsTable).set({ mainImageUrl: mainImg, images: newImages }).where(eq(brandProductsTable.id, product.id));
        console.log(`  ✓ Product "${product.name}"`);
      }
    } catch (err) {
      console.error(`  ✗ Product ${product.id}:`, err);
      errors++;
    }
  }

  // 4. CHAT IMAGES
  console.log('\n=== 4. Chat Images ===');
  const chatMessages = await db.select().from(aiChatMessagesTable).where(eq(aiChatMessagesTable.role, 'image'));
  console.log(`Found ${chatMessages.length} chat images`);
  for (const msg of chatMessages) {
    if (!msg.imageUrl || msg.imageUrl.startsWith('/api/r2/')) continue;
    try {
      const r2Url = await migrateUrl(msg.imageUrl, `chat-images/${msg.sessionId || 'unknown'}`);
      if (r2Url) {
        await db.update(aiChatMessagesTable).set({ imageUrl: r2Url }).where(eq(aiChatMessagesTable.id, msg.id));
        migrated++;
        if (migrated % 10 === 0) console.log(`  ✓ ${migrated} chat images migrated so far...`);
      }
    } catch (err) {
      console.error(`  ✗ Chat msg ${msg.id}:`, err);
      errors++;
    }
  }
  console.log(`  Done: ${chatMessages.length} processed`);

  // 5. TARGET AUDIENCE PORTRAITS
  console.log('\n=== 5. Target Audiences ===');
  const allAudiences = await db.select().from(targetAudiencesTable);
  console.log(`Found ${allAudiences.length} audiences`);
  for (const aud of allAudiences) {
    try {
      if (aud.aiPortraitImageUrl && !aud.aiPortraitImageUrl.startsWith('/api/r2/')) {
        const r2Url = await migrateUrl(aud.aiPortraitImageUrl, `avatars/${aud.brandId}`);
        if (r2Url) {
          await db.update(targetAudiencesTable).set({ aiPortraitImageUrl: r2Url }).where(eq(targetAudiencesTable.id, aud.id));
          migrated++;
          console.log(`  ✓ Audience "${aud.name}" portrait`);
        }
      }

      const interactionImages = (aud.brandInteractionImages as string[]) || [];
      if (interactionImages.length > 0) {
        const newImages: string[] = [];
        let interactionChanged = false;
        for (const img of interactionImages) {
          if (img.startsWith('/api/r2/')) { newImages.push(img); continue; }
          const r2Url = await migrateUrl(img, `merch/${aud.brandId}`);
          if (r2Url) {
            newImages.push(r2Url);
            migrated++;
            interactionChanged = true;
          } else {
            newImages.push(img);
          }
        }
        if (interactionChanged) {
          await db.update(targetAudiencesTable).set({ brandInteractionImages: newImages }).where(eq(targetAudiencesTable.id, aud.id));
          console.log(`  ✓ Audience "${aud.name}" interaction images`);
        }
      }
    } catch (err) {
      console.error(`  ✗ Audience ${aud.id}:`, err);
      errors++;
    }
  }

  // 6. GENERATION TEMPLATES
  console.log('\n=== 6. Generation Templates ===');
  const allTemplates = await db.select().from(generationTemplatesTable);
  console.log(`Found ${allTemplates.length} templates`);
  for (const tmpl of allTemplates) {
    if (!tmpl.referenceImageUrl || tmpl.referenceImageUrl.startsWith('/api/r2/')) continue;
    try {
      const r2Url = await migrateUrl(tmpl.referenceImageUrl, `templates/${tmpl.id}`);
      if (r2Url) {
        await db.update(generationTemplatesTable).set({ referenceImageUrl: r2Url }).where(eq(generationTemplatesTable.id, tmpl.id));
        migrated++;
        console.log(`  ✓ Template "${tmpl.name}"`);
      }
    } catch (err) {
      console.error(`  ✗ Template ${tmpl.id}:`, err);
      errors++;
    }
  }

  // 7. USER AVATARS
  console.log('\n=== 7. User Avatars ===');
  const allProfiles = await db.select().from(userProfilesTable);
  console.log(`Found ${allProfiles.length} profiles`);
  for (const profile of allProfiles) {
    if (!profile.avatarUrl || profile.avatarUrl.startsWith('/api/r2/')) continue;
    try {
      const r2Url = await migrateUrl(profile.avatarUrl, `avatars/${profile.userId}`);
      if (r2Url) {
        await db.update(userProfilesTable).set({ avatarUrl: r2Url }).where(eq(userProfilesTable.userId, profile.userId));
        migrated++;
        console.log(`  ✓ User avatar ${profile.userId}`);
      }
    } catch (err) {
      console.error(`  ✗ Avatar ${profile.userId}:`, err);
      errors++;
    }
  }

  console.log('\n========================================');
  console.log(`Migration complete!`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log('========================================');

  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
