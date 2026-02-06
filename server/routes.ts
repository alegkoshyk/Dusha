import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertGameSessionSchema, 
  updateGameSessionSchema,
  registerUserSchema,
  loginUserSchema,
  insertUserBrandSchema,
} from "@shared/schema";
import { 
  sessionMiddleware, 
  requireAuth, 
  getCurrentUser, 
  getCurrentUserUnified,
  setUserInSession, 
  clearUserFromSession,
  optionalAuth
} from "./auth";
import { setupOAuthRoutes } from "./oauthProviders";
import { z } from "zod";
import { db } from "./db";
import { sql, eq, and, isNull, inArray } from "drizzle-orm";
import { cardResponsesTable, personaSegmentAssignmentsTable, demographicSegmentsTable, demographicSubSegmentsTable, audienceTypeCategoriesTable, audienceTypesTable, personaAudienceTypesTable, personaCategoriesTable, productPersonasTable } from "@shared/schema";
import { isOpenAIConfigured, generateBrandInsights, analyzeBrandLevel, sendBrandChatMessage, generateCardResponse, isAIConfigured, generateAudiencePersona, generateSegmentData, generateProductData, generateAgentData } from "./openai";

// Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = await storage.getUserById(req.session.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  req.user = user;
  next();
};

// Build prompt for product image generation
function buildProductImagePrompt(product: any, brand?: any): string {
  const name = product.name || "product";
  const category = product.category || "";
  const shortDesc = product.shortDescription || "";
  const features = Array.isArray(product.features) ? product.features.slice(0, 3).join(", ") : "";
  
  // Use brand colors if available
  const brandColors = brand && Array.isArray(brand.brandColors) ? brand.brandColors : [];
  const colorPalette = brandColors.map((c: any) => c.hex).filter(Boolean).slice(0, 2).join(" and ");
  
  return `Professional product photography of ${name}. ${category ? `Category: ${category}.` : ""} ${shortDesc ? shortDesc : ""} ${features ? `Key features: ${features}.` : ""} ${colorPalette ? `Brand colors: ${colorPalette}.` : ""} High quality, clean background, professional studio lighting, commercial product photography style, sharp focus, centered composition.`;
}

// Build prompt for avatar generation based on audience data
function buildAvatarPrompt(audience: any): string {
  const gender = audience.gender || "person";
  const ageRange = audience.ageRange || "30-40";
  const occupation = audience.occupation || "professional";
  const values = Array.isArray(audience.values) ? audience.values.slice(0, 3).join(", ") : "";
  const interests = Array.isArray(audience.interests) ? audience.interests.slice(0, 3).join(", ") : "";
  
  const lifestyle = audience.aiPortrait ? audience.aiPortrait.split('\n')[0] : "";
  
  return `Professional portrait photo of a ${gender}, age ${ageRange}, ${occupation}. ${values ? `Values: ${values}.` : ""} ${interests ? `Interests: ${interests}.` : ""} ${lifestyle ? lifestyle : ""} High quality, realistic, professional headshot, neutral background, natural lighting, friendly expression. Style: modern corporate portrait photography.`;
}

// Build prompt for brand interaction image
function buildBrandInteractionPrompt(audience: any, brand: any, scenario: string): string {
  const gender = audience.gender || "person";
  const ageRange = audience.ageRange || "30-40";
  const occupation = audience.occupation || "professional";
  const brandName = brand.name || "brand";
  const brandIndustry = brand.industry || "";
  const brandMission = brand.mission || "";
  
  // Extract brand colors for visual consistency
  const brandColors = Array.isArray(brand.brandColors) ? brand.brandColors : [];
  const colorPalette = brandColors.map((c: any) => c.hex).filter(Boolean).slice(0, 3).join(", ");
  
  // Build instructions for reference images
  const referenceInstructions = [];
  
  // If there's an avatar, instruct to use that exact person
  if (audience.aiPortraitImageUrl) {
    referenceInstructions.push("Generate the EXACT same person from the [Target Persona] reference image");
  }
  
  // If there's a logo, instruct to use it
  if (brand.logo) {
    referenceInstructions.push("Include the EXACT [Brand Logo] from the reference in the scene (on products, signage, screens, or packaging)");
  }
  
  // Brand visual description
  const brandVisuals = [];
  if (colorPalette) {
    brandVisuals.push(`use brand colors: ${colorPalette}`);
  }
  const visualDescription = brandVisuals.length > 0 ? brandVisuals.join(", ") + "." : "";
  
  const refInstruction = referenceInstructions.length > 0 
    ? referenceInstructions.join(". ") + ". " 
    : "";
  
  const scenarioPrompts: Record<string, string> = {
    "using_product": `${refInstruction}${gender}, age ${ageRange}, ${occupation} happily using a product or service from ${brandName}${brandIndustry ? ` (${brandIndustry})` : ""}. Show genuine engagement and satisfaction. ${visualDescription} Modern lifestyle photography, natural lighting, authentic moment.`,
    "shopping": `${refInstruction}${gender}, age ${ageRange}, ${occupation} browsing or shopping at ${brandName}${brandIndustry ? ` (${brandIndustry})` : ""} store or online. Show interest and consideration. ${visualDescription} Retail/e-commerce lifestyle photography.`,
    "recommending": `${refInstruction}${gender}, age ${ageRange}, ${occupation} recommending ${brandName} to friends or colleagues, showing product with brand logo. ${visualDescription} Social interaction, positive conversation. Lifestyle photography, natural setting.`,
    "social_media": `${refInstruction}${gender}, age ${ageRange}, ${occupation} engaging with ${brandName} content on smartphone or laptop, brand logo visible on screen. ${visualDescription} Social media interaction, modern digital lifestyle photography.`,
    "event": `${refInstruction}${gender}, age ${ageRange}, ${occupation} at a ${brandName} brand event or activation with branded decorations, banners, and signage showing the logo. ${visualDescription} Engaged and enjoying the experience. Event photography style.`,
  };
  
  const basePrompt = scenarioPrompts[scenario] || scenarioPrompts["using_product"];
  return `${basePrompt} ${brandMission ? `Brand values: ${brandMission}.` : ""} High quality, realistic, professional photography.`;
}

const saveCardResponseSchema = z.object({
  cardId: z.string(),
  response: z.any(),
});

const updateProgressSchema = z.object({
  currentLevel: z.enum(["soul", "mind", "body"]).optional(),
  currentCard: z.string().optional(),
  progress: z.number().min(0).max(100),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply session middleware
  app.use(sessionMiddleware);
  
  // Setup OAuth routes (Google, Apple)
  setupOAuthRoutes(app);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      
      if (!validatedData.email) {
        return res.status(400).json({ error: "Email обов'язковий" });
      }
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      
      if (existingUser) {
        return res.status(400).json({ 
          error: "Користувач з такою email адресою вже існує" 
        });
      }

      const user = await storage.createUser({
        email: validatedData.email,
        firstName: validatedData.firstName || undefined,
        lastName: validatedData.lastName || undefined,
        password: validatedData.password,
      });

      // If a plan was selected during registration, create subscription
      if (validatedData.selectedPlanId) {
        const plan = await storage.getSubscriptionPlan(validatedData.selectedPlanId);
        if (plan) {
          // Check if user already has a subscription
          const existingSub = await storage.getUserSubscription(user.id);
          if (existingSub) {
            // Update to the selected plan
            await storage.updateUserSubscription(existingSub.id, {
              planId: plan.id,
              status: plan.priceMonthly > 0 ? 'pending_payment' : 'active',
            });
          } else {
            // Create new subscription with the selected plan
            await storage.createUserSubscription({
              userId: user.id,
              planId: plan.id,
              billingPeriod: 'monthly',
              status: plan.priceMonthly > 0 ? 'pending_payment' : 'active',
              startedAt: new Date(),
            });
          }
        }
      }

      setUserInSession(req, user);
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json({ 
        message: "Користувач успішно зареєстрований",
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        error: "Помилка реєстрації користувача" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        return res.status(401).json({ 
          error: "Неправильний email або пароль" 
        });
      }

      const isPasswordValid = await storage.verifyPassword(validatedData.password, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: "Неправильний email або пароль" 
        });
      }

      await storage.updateUserLoginTime(user.id);
      
      // Generate simple auth token for iPad compatibility
      const authToken = `auth_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store token in memory/database for validation
      await storage.createAuthToken(user.id, authToken);
      
      // Set user in session as backup
      setUserInSession(req, user);
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ 
        message: "Успішний вхід в систему",
        user: userWithoutPassword,
        authToken: authToken  // Send token to client for localStorage
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        error: "Помилка входу в систему" 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    clearUserFromSession(req);
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Помилка виходу з системи" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Успішний вихід з системи" });
    });
  });

  app.get("/api/logout", (req, res) => {
    clearUserFromSession(req);
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Помилка виходу з системи" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Успішний вихід з системи" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const user = await storage.getUserById(currentUser.id);
      const profile = await storage.getUserProfile(currentUser.id);
      const settings = await storage.getUserSettings(currentUser.id);

      if (!user) {
        return res.status(404).json({ error: "Користувач не знайдений" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        profile,
        settings
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Помилка отримання даних користувача" });
    }
  });

  // User brands routes
  app.get("/api/user/brands", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const brands = await storage.getUserBrands(currentUser.id);
      res.json(brands);
    } catch (error) {
      console.error("Get user brands error:", error);
      res.status(500).json({ error: "Помилка отримання брендів" });
    }
  });

  app.post("/api/user/brands", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      // Check brand quota
      const canCreate = await storage.canCreateBrand(currentUser.id);
      if (!canCreate) {
        return res.status(403).json({ 
          error: "Досягнуто ліміт брендів для вашого тарифу", 
          code: "BRAND_QUOTA_EXCEEDED"
        });
      }

      const validatedData = insertUserBrandSchema.parse({
        ...req.body,
        userId: currentUser.id,
      });
      
      const brand = await storage.createUserBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      console.error("Create user brand error:", error);
      res.status(400).json({ error: "Помилка створення бренду" });
    }
  });

  // Delete user brand
  app.delete("/api/user/brands/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      
      // Verify brand belongs to user
      const brand = await storage.getUserBrand(id);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const deleted = await storage.deleteUserBrand(id);
      if (!deleted) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      res.json({ message: "Бренд успішно видалено" });
    } catch (error) {
      console.error("Delete user brand error:", error);
      res.status(500).json({ error: "Помилка видалення бренду" });
    }
  });

  // Get single brand by ID
  app.get("/api/user/brands/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const brand = await storage.getUserBrand(id);
      
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      res.json(brand);
    } catch (error) {
      console.error("Get brand error:", error);
      res.status(500).json({ error: "Помилка отримання бренду" });
    }
  });

  // Update brand (all passport fields)
  app.patch("/api/user/brands/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { 
        name, description, tagline, mission, vision, 
        values, brandColors, typography, voiceTone,
        targetAudience, competitors, uniqueValue 
      } = req.body;
      
      // Verify brand belongs to user
      const brand = await storage.getUserBrand(id);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      // Validate name
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2) {
          return res.status(400).json({ error: "Назва бренду повинна містити мінімум 2 символи" });
        }
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description?.trim() || null;
      if (tagline !== undefined) updates.tagline = tagline?.trim() || null;
      if (mission !== undefined) updates.mission = mission?.trim() || null;
      if (vision !== undefined) updates.vision = vision?.trim() || null;
      if (values !== undefined) updates.values = values;
      if (brandColors !== undefined) updates.brandColors = brandColors;
      if (typography !== undefined) updates.typography = typography;
      if (voiceTone !== undefined) updates.voiceTone = voiceTone;
      if (targetAudience !== undefined) updates.targetAudience = targetAudience?.trim() || null;
      if (competitors !== undefined) updates.competitors = competitors;
      if (uniqueValue !== undefined) updates.uniqueValue = uniqueValue?.trim() || null;

      const updated = await storage.updateUserBrand(id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update brand error:", error);
      res.status(500).json({ error: "Помилка оновлення бренду" });
    }
  });

  // Update brand logo
  app.patch("/api/user/brands/:id/logo", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { logo } = req.body;
      
      // Verify brand belongs to user
      const brand = await storage.getUserBrand(id);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      // Validate logo format (base64 data URL)
      if (logo !== null && logo !== undefined) {
        if (typeof logo !== 'string') {
          return res.status(400).json({ error: "Невірний формат лого" });
        }
        
        // Allow empty string to remove logo
        if (logo === '') {
          const updated = await storage.updateUserBrandLogo(id, null);
          return res.json(updated);
        } else {
          // Validate data URL format and allowed MIME types
          const dataUrlPattern = /^data:image\/(png|jpeg|jpg|svg\+xml);base64,/;
          if (!dataUrlPattern.test(logo)) {
            return res.status(400).json({ error: "Лого має бути у форматі PNG, JPG або SVG (data URL)" });
          }
          
          // Check size limit (~2MB in base64, which is ~2.8MB in encoded form)
          if (logo.length > 2800000) {
            return res.status(400).json({ error: "Розмір лого не повинен перевищувати 2MB" });
          }
          
          // Validate base64 content exists after the header
          const base64Part = logo.split(',')[1];
          if (!base64Part || base64Part.length < 10) {
            return res.status(400).json({ error: "Невірний формат лого - пустий вміст" });
          }

          // Check quota before upload
          const estimatedSize = Math.ceil(base64Part.length * 0.75);
          const hasQuota = await storage.checkQuotaAvailable(currentUser.id, estimatedSize);
          if (!hasQuota) {
            return res.status(400).json({ error: "Досягнуто ліміт зберігання" });
          }

          // Upload to object storage using new media system
          let logoUrl = logo;
          try {
            const { ObjectStorageService } = await import('./objectStorage');
            const objectStorageService = new ObjectStorageService();
            const uploadResult = await objectStorageService.uploadMediaAsset({
              userId: currentUser.id,
              assetType: 'logo',
              brandId: id,
              base64Data: logo
            });
            
            logoUrl = uploadResult.publicUrl;
            console.log('Logo uploaded to object storage:', logoUrl);

            // Create media asset record
            await storage.createMediaAsset({
              userId: currentUser.id,
              brandId: id,
              assetType: 'logo',
              storageKey: uploadResult.storageKey,
              publicUrl: uploadResult.publicUrl,
              filename: 'brand-logo',
              mimeType: uploadResult.mimeType,
              sizeBytes: uploadResult.sizeBytes,
              altText: 'Brand logo',
            });
          } catch (uploadError) {
            console.warn('Object storage upload failed, using base64:', uploadError);
          }

          const updated = await storage.updateUserBrandLogo(id, logoUrl);
          return res.json(updated);
        }
      }

      const updated = await storage.updateUserBrandLogo(id, logo || null);
      res.json(updated);
    } catch (error) {
      console.error("Update brand logo error:", error);
      res.status(500).json({ error: "Помилка оновлення лого" });
    }
  });

  // Brand AI Analysis routes
  app.get("/api/brands/:brandId/ai-analyses", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const analyses = await storage.getBrandAiAnalyses(brandId);
      res.json(analyses);
    } catch (error) {
      console.error("Get brand AI analyses error:", error);
      res.status(500).json({ error: "Помилка отримання AI аналізу" });
    }
  });

  app.get("/api/brands/:brandId/ai-analyses/latest", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const analysis = await storage.getLatestBrandAiAnalysis(brandId);
      res.json(analysis || null);
    } catch (error) {
      console.error("Get latest brand AI analysis error:", error);
      res.status(500).json({ error: "Помилка отримання AI аналізу" });
    }
  });

  app.post("/api/brands/:brandId/ai-analyses", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const analysis = await storage.createBrandAiAnalysis({
        brandId,
        userId: currentUser.id,
        analysisType: req.body.analysisType || 'full',
        content: req.body.content,
        score: req.body.score,
        insights: req.body.insights,
        recommendations: req.body.recommendations,
        strengths: req.body.strengths,
        weaknesses: req.body.weaknesses,
        provider: req.body.provider,
        model: req.body.model,
        tokensUsed: req.body.tokensUsed,
        generationTimeMs: req.body.generationTimeMs,
      });
      
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Create brand AI analysis error:", error);
      res.status(500).json({ error: "Помилка збереження AI аналізу" });
    }
  });

  // =========================================
  // Target Audience Routes
  // =========================================
  
  // Get all target audiences for a brand
  app.get("/api/brands/:brandId/target-audiences", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const audiences = await storage.getTargetAudiences(brandId);
      res.json(audiences);
    } catch (error) {
      console.error("Get target audiences error:", error);
      res.status(500).json({ error: "Помилка отримання цільових аудиторій" });
    }
  });

  // Get single target audience
  app.get("/api/target-audiences/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const audience = await storage.getTargetAudience(id);
      
      if (!audience) {
        return res.status(404).json({ error: "Цільову аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      res.json(audience);
    } catch (error) {
      console.error("Get target audience error:", error);
      res.status(500).json({ error: "Помилка отримання цільової аудиторії" });
    }
  });

  // Create target audience
  app.post("/api/brands/:brandId/target-audiences", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const { segmentIds, subSegmentIds, ...audienceData } = req.body;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const audience = await storage.createTargetAudience({
        brandId,
        ...audienceData
      });

      // Auto-assign to selected segments (validate brand ownership)
      if (segmentIds && Array.isArray(segmentIds)) {
        for (const segmentId of segmentIds) {
          const segment = await storage.getDemographicSegment(segmentId);
          // Only assign if segment belongs to this brand
          if (segment && segment.brandId === brandId) {
            await db.insert(personaSegmentAssignmentsTable).values({
              personaId: audience.id,
              segmentId,
              subSegmentId: null,
            }).onConflictDoNothing();
          }
        }
      }

      // Auto-assign to selected sub-segments (validate brand ownership)
      if (subSegmentIds && Array.isArray(subSegmentIds)) {
        for (const subSegmentId of subSegmentIds) {
          const subSegment = await storage.getDemographicSubSegment(subSegmentId);
          if (subSegment) {
            // Validate parent segment belongs to this brand
            const parentSegment = await storage.getDemographicSegment(subSegment.segmentId);
            if (parentSegment && parentSegment.brandId === brandId) {
              await db.insert(personaSegmentAssignmentsTable).values({
                personaId: audience.id,
                segmentId: subSegment.segmentId,
                subSegmentId,
              }).onConflictDoNothing();
            }
          }
        }
      }

      res.status(201).json(audience);
    } catch (error) {
      console.error("Create target audience error:", error);
      res.status(500).json({ error: "Помилка створення цільової аудиторії" });
    }
  });

  // Update target audience
  app.patch("/api/target-audiences/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const audience = await storage.getTargetAudience(id);
      
      if (!audience) {
        return res.status(404).json({ error: "Цільову аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const updated = await storage.updateTargetAudience(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update target audience error:", error);
      res.status(500).json({ error: "Помилка оновлення цільової аудиторії" });
    }
  });

  // Delete target audience
  app.delete("/api/target-audiences/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const audience = await storage.getTargetAudience(id);
      
      if (!audience) {
        return res.status(404).json({ error: "Цільову аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteTargetAudience(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete target audience error:", error);
      res.status(500).json({ error: "Помилка видалення цільової аудиторії" });
    }
  });

  // =========================================
  // Audience Segments Routes
  // =========================================

  // Get segments for an audience
  app.get("/api/target-audiences/:audienceId/segments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { audienceId } = req.params;
      const audience = await storage.getTargetAudience(audienceId);
      
      if (!audience) {
        return res.status(404).json({ error: "Цільову аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const segments = await storage.getAudienceSegments(audienceId);
      res.json(segments);
    } catch (error) {
      console.error("Get audience segments error:", error);
      res.status(500).json({ error: "Помилка отримання сегментів" });
    }
  });

  // Create segment
  app.post("/api/target-audiences/:audienceId/segments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { audienceId } = req.params;
      const audience = await storage.getTargetAudience(audienceId);
      
      if (!audience) {
        return res.status(404).json({ error: "Цільову аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const segment = await storage.createAudienceSegment({
        audienceId,
        ...req.body
      });
      res.status(201).json(segment);
    } catch (error) {
      console.error("Create audience segment error:", error);
      res.status(500).json({ error: "Помилка створення сегменту" });
    }
  });

  // Update segment
  app.patch("/api/audience-segments/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const segment = await storage.getAudienceSegment(id);
      
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const audience = await storage.getTargetAudience(segment.audienceId);
      if (!audience) {
        return res.status(404).json({ error: "Цільову аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const updated = await storage.updateAudienceSegment(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update audience segment error:", error);
      res.status(500).json({ error: "Помилка оновлення сегменту" });
    }
  });

  // Delete segment
  app.delete("/api/audience-segments/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const segment = await storage.getAudienceSegment(id);
      
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const audience = await storage.getTargetAudience(segment.audienceId);
      if (!audience) {
        return res.status(404).json({ error: "Цільову аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteAudienceSegment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete audience segment error:", error);
      res.status(500).json({ error: "Помилка видалення сегменту" });
    }
  });

  // =========================================
  // Demographic Segments API (new hierarchical structure)
  // =========================================

  // Get all demographic segments for a brand
  app.get("/api/brands/:brandId/demographic-segments", requireAuth, async (req, res) => {
    let step = "init";
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      console.log("[demographic-segments] Getting segments for brand:", brandId, "user:", currentUser.id);
      
      step = "getUserBrand";
      let brand;
      try {
        brand = await storage.getUserBrand(brandId);
      } catch (brandErr: any) {
        console.error("[demographic-segments] Error getting brand:", brandErr?.message);
        return res.status(500).json({ error: "Помилка отримання бренду", step, details: brandErr?.message });
      }
      
      if (!brand || brand.userId !== currentUser.id) {
        console.log("[demographic-segments] Brand not found or user mismatch. Brand:", brand?.id, "Brand userId:", brand?.userId, "Current user:", currentUser.id);
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      step = "getDemographicSegments";
      console.log("[demographic-segments] Fetching segments...");
      let segments;
      try {
        segments = await storage.getDemographicSegments(brandId);
      } catch (segErr: any) {
        console.error("[demographic-segments] Error getting segments:", segErr?.message);
        return res.status(500).json({ error: "Помилка отримання сегментів", step, details: segErr?.message });
      }
      console.log("[demographic-segments] Found", segments.length, "segments");
      
      step = "getTargetAudiences";
      let allAudiences;
      try {
        allAudiences = await storage.getTargetAudiences(brandId);
      } catch (audErr: any) {
        console.error("[demographic-segments] Error getting audiences:", audErr?.message);
        return res.status(500).json({ error: "Помилка отримання аудиторій", step, details: audErr?.message });
      }
      console.log("[demographic-segments] Found", allAudiences.length, "audiences");
      
      step = "getAssignments";
      let allAssignments: any[] = [];
      try {
        const personaIds = allAudiences.map(a => a.id);
        allAssignments = personaIds.length > 0 
          ? await db.select().from(personaSegmentAssignmentsTable)
              .where(inArray(personaSegmentAssignmentsTable.personaId, personaIds))
          : [];
      } catch (assErr: any) {
        console.error("[demographic-segments] Error getting assignments:", assErr?.message);
        return res.status(500).json({ error: "Помилка отримання призначень", step, details: assErr?.message });
      }
      console.log("[demographic-segments] Found", allAssignments.length, "assignments");
      
      step = "getAllSubSegments";
      let allSubSegments: any[] = [];
      try {
        const segmentIds = segments.map(s => s.id);
        allSubSegments = segmentIds.length > 0
          ? await db.select().from(demographicSubSegmentsTable)
              .where(inArray(demographicSubSegmentsTable.segmentId, segmentIds))
              .orderBy(demographicSubSegmentsTable.priority)
          : [];
      } catch (subErr: any) {
        console.error("[demographic-segments] Error getting sub-segments:", subErr?.message);
        return res.status(500).json({ error: "Помилка отримання підсегментів", step, details: subErr?.message });
      }
      console.log("[demographic-segments] Found", allSubSegments.length, "sub-segments");
      
      step = "buildSegmentsWithData";
      // Build segments with data using in-memory filtering (no more N+1 queries)
      const segmentsWithData = segments.map((segment) => {
        // Get sub-segments for this segment from pre-fetched data
        const subSegments = allSubSegments.filter(ss => ss.segmentId === segment.id);
        const subSegmentsWithPersonas = subSegments.map(subSeg => {
          // Find personas assigned to this sub-segment
          const subSegmentAssignments = allAssignments.filter(a => a.subSegmentId === subSeg.id);
          const subSegmentPersonas = subSegmentAssignments.map(a => 
            allAudiences.find(p => p.id === a.personaId)
          ).filter(Boolean);
          return { ...subSeg, personas: subSegmentPersonas };
        });
        
        // Find personas assigned to this segment (but not to any sub-segment)
        const segmentAssignments = allAssignments.filter(a => a.segmentId === segment.id && !a.subSegmentId);
        const segmentPersonas = segmentAssignments.map(a => 
          allAudiences.find(p => p.id === a.personaId)
        ).filter(Boolean);
        
        return { 
          ...segment, 
          subSegments: subSegmentsWithPersonas,
          personas: segmentPersonas 
        };
      });

      console.log("[demographic-segments] Returning", segmentsWithData.length, "segments with data");
      return res.json(segmentsWithData);
    } catch (error: any) {
      console.error("[demographic-segments] Unexpected error at step:", step, ":", error?.message || error);
      console.error("[demographic-segments] Stack:", error?.stack);
      return res.status(500).json({ error: "Помилка отримання сегментів", step, details: error?.message || "Unknown error" });
    }
  });

  // Create demographic segment
  app.post("/api/brands/:brandId/demographic-segments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const segment = await storage.createDemographicSegment({
        brandId,
        ...req.body
      });
      res.status(201).json(segment);
    } catch (error) {
      console.error("Create demographic segment error:", error);
      res.status(500).json({ error: "Помилка створення сегменту" });
    }
  });

  // Update demographic segment
  app.patch("/api/demographic-segments/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const segment = await storage.getDemographicSegment(id);
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const brand = await storage.getUserBrand(segment.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const updated = await storage.updateDemographicSegment(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update demographic segment error:", error);
      res.status(500).json({ error: "Помилка оновлення сегменту" });
    }
  });

  // Delete demographic segment
  app.delete("/api/demographic-segments/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const segment = await storage.getDemographicSegment(id);
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const brand = await storage.getUserBrand(segment.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteDemographicSegment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete demographic segment error:", error);
      res.status(500).json({ error: "Помилка видалення сегменту" });
    }
  });

  // Generate segment data with AI
  const generateSegmentSchema = z.object({
    description: z.string().min(1, "Опис сегменту обов'язковий"),
    tier: z.enum(["standard", "pro"]).default("standard"),
  });

  app.post("/api/brands/:brandId/generate-segment", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      const validationResult = generateSegmentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0]?.message || "Невалідні дані" });
      }
      
      const { description, tier } = validationResult.data;

      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const brandValues = brand.values as string[] | undefined;
      const brandData = {
        name: brand.name,
        description: brand.description || undefined,
        values: brandValues,
        mission: brand.mission || undefined,
        targetAudience: brand.targetAudience || undefined,
      };

      const generatedData = await generateSegmentData(brandData, description, tier);
      res.json(generatedData);
    } catch (error) {
      console.error("Generate segment data error:", error);
      res.status(500).json({ error: "Помилка генерації даних сегменту" });
    }
  });

  // =========================================
  // Demographic Sub-Segments API
  // =========================================

  // Get sub-segments for a segment
  app.get("/api/demographic-segments/:segmentId/sub-segments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { segmentId } = req.params;
      const segment = await storage.getDemographicSegment(segmentId);
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const brand = await storage.getUserBrand(segment.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const subSegments = await storage.getDemographicSubSegments(segmentId);
      res.json(subSegments);
    } catch (error) {
      console.error("Get demographic sub-segments error:", error);
      res.status(500).json({ error: "Помилка отримання підсегментів" });
    }
  });

  // Create sub-segment
  app.post("/api/demographic-segments/:segmentId/sub-segments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { segmentId } = req.params;
      const segment = await storage.getDemographicSegment(segmentId);
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const brand = await storage.getUserBrand(segment.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const subSegment = await storage.createDemographicSubSegment({
        segmentId,
        ...req.body
      });
      res.status(201).json(subSegment);
    } catch (error) {
      console.error("Create demographic sub-segment error:", error);
      res.status(500).json({ error: "Помилка створення підсегменту" });
    }
  });

  // Update sub-segment
  app.patch("/api/demographic-sub-segments/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const subSegment = await storage.getDemographicSubSegment(id);
      if (!subSegment) {
        return res.status(404).json({ error: "Підсегмент не знайдено" });
      }

      const segment = await storage.getDemographicSegment(subSegment.segmentId);
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const brand = await storage.getUserBrand(segment.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const updated = await storage.updateDemographicSubSegment(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update demographic sub-segment error:", error);
      res.status(500).json({ error: "Помилка оновлення підсегменту" });
    }
  });

  // Delete sub-segment
  app.delete("/api/demographic-sub-segments/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const subSegment = await storage.getDemographicSubSegment(id);
      if (!subSegment) {
        return res.status(404).json({ error: "Підсегмент не знайдено" });
      }

      const segment = await storage.getDemographicSegment(subSegment.segmentId);
      if (!segment) {
        return res.status(404).json({ error: "Сегмент не знайдено" });
      }

      const brand = await storage.getUserBrand(segment.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteDemographicSubSegment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete demographic sub-segment error:", error);
      res.status(500).json({ error: "Помилка видалення підсегменту" });
    }
  });

  // Add persona to segment or sub-segment (many-to-many)
  app.post("/api/target-audiences/:id/segment-assignments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { segmentId, subSegmentId } = req.body;

      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Персону не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Check if assignment already exists
      const existing = await db.select().from(personaSegmentAssignmentsTable)
        .where(and(
          eq(personaSegmentAssignmentsTable.personaId, id),
          segmentId ? eq(personaSegmentAssignmentsTable.segmentId, segmentId) : isNull(personaSegmentAssignmentsTable.segmentId),
          subSegmentId ? eq(personaSegmentAssignmentsTable.subSegmentId, subSegmentId) : isNull(personaSegmentAssignmentsTable.subSegmentId)
        ));
      
      if (existing.length > 0) {
        return res.status(400).json({ error: "Призначення вже існує" });
      }

      const [assignment] = await db.insert(personaSegmentAssignmentsTable).values({
        personaId: id,
        segmentId: segmentId || null,
        subSegmentId: subSegmentId || null,
      }).returning();
      
      res.json(assignment);
    } catch (error) {
      console.error("Add persona segment assignment error:", error);
      res.status(500).json({ error: "Помилка призначення персони до сегменту" });
    }
  });

  // Remove persona from segment or sub-segment
  app.delete("/api/target-audiences/:id/segment-assignments/:assignmentId", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id, assignmentId } = req.params;

      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Персону не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await db.delete(personaSegmentAssignmentsTable)
        .where(and(
          eq(personaSegmentAssignmentsTable.id, assignmentId),
          eq(personaSegmentAssignmentsTable.personaId, id)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Remove persona segment assignment error:", error);
      res.status(500).json({ error: "Помилка видалення призначення" });
    }
  });

  // Get persona segment assignments
  app.get("/api/target-audiences/:id/segment-assignments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;

      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Персону не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const assignments = await db.select({
        id: personaSegmentAssignmentsTable.id,
        personaId: personaSegmentAssignmentsTable.personaId,
        segmentId: personaSegmentAssignmentsTable.segmentId,
        subSegmentId: personaSegmentAssignmentsTable.subSegmentId,
        segment: demographicSegmentsTable,
        subSegment: demographicSubSegmentsTable,
      })
        .from(personaSegmentAssignmentsTable)
        .leftJoin(demographicSegmentsTable, eq(personaSegmentAssignmentsTable.segmentId, demographicSegmentsTable.id))
        .leftJoin(demographicSubSegmentsTable, eq(personaSegmentAssignmentsTable.subSegmentId, demographicSubSegmentsTable.id))
        .where(eq(personaSegmentAssignmentsTable.personaId, id));
      
      res.json(assignments);
    } catch (error) {
      console.error("Get persona segment assignments error:", error);
      res.status(500).json({ error: "Помилка отримання призначень" });
    }
  });

  // Legacy: Assign persona to segment (for backward compatibility, updates the simple FK fields)
  app.patch("/api/target-audiences/:id/assign-segment", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { segmentId, subSegmentId } = req.body;

      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Персону не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const updated = await storage.updateTargetAudience(id, { 
        segmentId: segmentId || null, 
        subSegmentId: subSegmentId || null 
      });
      res.json(updated);
    } catch (error) {
      console.error("Assign persona to segment error:", error);
      res.status(500).json({ error: "Помилка призначення персони до сегменту" });
    }
  });

  // =========================================
  // Audience Types API (Global reference data)
  // =========================================

  // Get all audience type categories with their types
  app.get("/api/audience-types", async (req, res) => {
    try {
      const categories = await db.select().from(audienceTypeCategoriesTable).orderBy(audienceTypeCategoriesTable.sortOrder);
      const types = await db.select().from(audienceTypesTable).orderBy(audienceTypesTable.sortOrder);
      
      const categoriesWithTypes = categories.map(category => ({
        ...category,
        types: types.filter(t => t.categoryId === category.id)
      }));
      
      res.json(categoriesWithTypes);
    } catch (error) {
      console.error("Get audience types error:", error);
      res.status(500).json({ error: "Помилка отримання типів аудиторії" });
    }
  });

  // Get persona's audience types
  app.get("/api/target-audiences/:id/audience-types", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Персону не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const assignments = await db.select({
        id: personaAudienceTypesTable.id,
        audienceTypeId: personaAudienceTypesTable.audienceTypeId,
        typeName: audienceTypesTable.name,
        typeColor: audienceTypesTable.color,
        categoryId: audienceTypesTable.categoryId,
        categoryName: audienceTypeCategoriesTable.name,
        categoryColor: audienceTypeCategoriesTable.color,
      })
        .from(personaAudienceTypesTable)
        .leftJoin(audienceTypesTable, eq(personaAudienceTypesTable.audienceTypeId, audienceTypesTable.id))
        .leftJoin(audienceTypeCategoriesTable, eq(audienceTypesTable.categoryId, audienceTypeCategoriesTable.id))
        .where(eq(personaAudienceTypesTable.personaId, id));

      res.json(assignments);
    } catch (error) {
      console.error("Get persona audience types error:", error);
      res.status(500).json({ error: "Помилка отримання типів аудиторії персони" });
    }
  });

  // Add audience type to persona
  app.post("/api/target-audiences/:id/audience-types", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { audienceTypeId } = req.body;

      if (!audienceTypeId) {
        return res.status(400).json({ error: "audienceTypeId обов'язковий" });
      }

      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Персону не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Check if already assigned
      const existing = await db.select().from(personaAudienceTypesTable)
        .where(and(
          eq(personaAudienceTypesTable.personaId, id),
          eq(personaAudienceTypesTable.audienceTypeId, audienceTypeId)
        ));

      if (existing.length > 0) {
        return res.status(400).json({ error: "Тип вже призначено" });
      }

      const [assignment] = await db.insert(personaAudienceTypesTable).values({
        personaId: id,
        audienceTypeId,
      }).returning();

      res.json(assignment);
    } catch (error) {
      console.error("Add persona audience type error:", error);
      res.status(500).json({ error: "Помилка додавання типу аудиторії" });
    }
  });

  // Remove audience type from persona
  app.delete("/api/target-audiences/:id/audience-types/:assignmentId", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id, assignmentId } = req.params;

      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Персону не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await db.delete(personaAudienceTypesTable)
        .where(and(
          eq(personaAudienceTypesTable.id, assignmentId),
          eq(personaAudienceTypesTable.personaId, id)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Remove persona audience type error:", error);
      res.status(500).json({ error: "Помилка видалення типу аудиторії" });
    }
  });

  // =========================================
  // Audience Type Categories CRUD
  // =========================================

  // Create a new category
  app.post("/api/audience-type-categories", requireAuth, async (req, res) => {
    try {
      const { name, nameEn, color, sortOrder } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Назва обов'язкова" });
      }

      const maxSort = await db.select({ max: audienceTypeCategoriesTable.sortOrder })
        .from(audienceTypeCategoriesTable);
      const newSortOrder = sortOrder ?? (maxSort[0]?.max ?? 0) + 1;

      const [category] = await db.insert(audienceTypeCategoriesTable).values({
        name,
        nameEn: nameEn || name,
        color: color || '#6b7280',
        sortOrder: newSortOrder,
      }).returning();

      res.json(category);
    } catch (error) {
      console.error("Create audience type category error:", error);
      res.status(500).json({ error: "Помилка створення категорії" });
    }
  });

  // Update a category
  app.patch("/api/audience-type-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, nameEn, color, sortOrder } = req.body;

      const [updated] = await db.update(audienceTypeCategoriesTable)
        .set({ 
          ...(name && { name }),
          ...(nameEn && { nameEn }),
          ...(color && { color }),
          ...(sortOrder !== undefined && { sortOrder }),
        })
        .where(eq(audienceTypeCategoriesTable.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Категорію не знайдено" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update audience type category error:", error);
      res.status(500).json({ error: "Помилка оновлення категорії" });
    }
  });

  // Delete a category
  app.delete("/api/audience-type-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // First delete all types in this category
      await db.delete(audienceTypesTable).where(eq(audienceTypesTable.categoryId, id));
      
      await db.delete(audienceTypeCategoriesTable).where(eq(audienceTypeCategoriesTable.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Delete audience type category error:", error);
      res.status(500).json({ error: "Помилка видалення категорії" });
    }
  });

  // =========================================
  // Audience Types CRUD
  // =========================================

  // Create a new type
  app.post("/api/audience-types", requireAuth, async (req, res) => {
    try {
      const { categoryId, name, nameEn, color, sortOrder } = req.body;
      if (!categoryId || !name) {
        return res.status(400).json({ error: "categoryId та name обов'язкові" });
      }

      const maxSort = await db.select({ max: audienceTypesTable.sortOrder })
        .from(audienceTypesTable)
        .where(eq(audienceTypesTable.categoryId, categoryId));
      const newSortOrder = sortOrder ?? (maxSort[0]?.max ?? 0) + 1;

      const [type] = await db.insert(audienceTypesTable).values({
        categoryId,
        name,
        nameEn: nameEn || name,
        color: color || '#6b7280',
        sortOrder: newSortOrder,
      }).returning();

      res.json(type);
    } catch (error) {
      console.error("Create audience type error:", error);
      res.status(500).json({ error: "Помилка створення типу" });
    }
  });

  // Update a type
  app.patch("/api/audience-types/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, nameEn, color, categoryId, sortOrder } = req.body;

      const [updated] = await db.update(audienceTypesTable)
        .set({ 
          ...(name && { name }),
          ...(nameEn && { nameEn }),
          ...(color && { color }),
          ...(categoryId && { categoryId }),
          ...(sortOrder !== undefined && { sortOrder }),
        })
        .where(eq(audienceTypesTable.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Тип не знайдено" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update audience type error:", error);
      res.status(500).json({ error: "Помилка оновлення типу" });
    }
  });

  // Delete a type
  app.delete("/api/audience-types/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // First delete all assignments
      await db.delete(personaAudienceTypesTable).where(eq(personaAudienceTypesTable.audienceTypeId, id));
      
      await db.delete(audienceTypesTable).where(eq(audienceTypesTable.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Delete audience type error:", error);
      res.status(500).json({ error: "Помилка видалення типу" });
    }
  });

  // =========================================
  // Persona Categories API (Primary/Secondary/Niche)
  // =========================================

  // Get all persona categories
  app.get("/api/persona-categories", async (req, res) => {
    try {
      const categories = await db.select().from(personaCategoriesTable).orderBy(personaCategoriesTable.sortOrder);
      res.json(categories);
    } catch (error) {
      console.error("Get persona categories error:", error);
      res.status(500).json({ error: "Помилка отримання категорій персон" });
    }
  });

  // Create persona category
  app.post("/api/persona-categories", requireAuth, async (req, res) => {
    try {
      const { name, nameEn, color, sortOrder } = req.body;
      
      const [category] = await db.insert(personaCategoriesTable)
        .values({ name, nameEn, color, sortOrder: sortOrder || 0 })
        .returning();
      
      res.json(category);
    } catch (error) {
      console.error("Create persona category error:", error);
      res.status(500).json({ error: "Помилка створення категорії" });
    }
  });

  // Update persona category
  app.patch("/api/persona-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, nameEn, color, sortOrder } = req.body;
      
      const [category] = await db.update(personaCategoriesTable)
        .set({ name, nameEn, color, sortOrder })
        .where(eq(personaCategoriesTable.id, id))
        .returning();
      
      res.json(category);
    } catch (error) {
      console.error("Update persona category error:", error);
      res.status(500).json({ error: "Помилка оновлення категорії" });
    }
  });

  // Delete persona category
  app.delete("/api/persona-categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(personaCategoriesTable).where(eq(personaCategoriesTable.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete persona category error:", error);
      res.status(500).json({ error: "Помилка видалення категорії" });
    }
  });

  // =========================================
  // Brand Products API
  // =========================================

  // Get all products for a brand
  app.get("/api/brands/:brandId/products", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const products = await storage.getBrandProducts(brandId);
      res.json(products);
    } catch (error) {
      console.error("Get brand products error:", error);
      res.status(500).json({ error: "Помилка отримання продуктів" });
    }
  });

  // Get a single product
  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const product = await storage.getBrandProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      res.json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Помилка отримання продукту" });
    }
  });

  // Create a new product
  app.post("/api/brands/:brandId/products", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const product = await storage.createBrandProduct({
        brandId,
        ...req.body
      });
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ error: "Помилка створення продукту" });
    }
  });

  // Update a product
  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const product = await storage.getBrandProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const updated = await storage.updateBrandProduct(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Помилка оновлення продукту" });
    }
  });

  // Delete a product
  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const product = await storage.getBrandProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteBrandProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Помилка видалення продукту" });
    }
  });

  // =========================================
  // Product Personas API
  // =========================================

  // Get all personas for a product
  app.get("/api/products/:productId/personas", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { productId } = req.params;
      const product = await storage.getBrandProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Get product personas with full persona data
      const productPersonas = await db
        .select()
        .from(productPersonasTable)
        .where(eq(productPersonasTable.productId, productId));

      // Get full persona data for each assignment
      const personaIds = productPersonas.map(pp => pp.personaId);
      const personas = personaIds.length > 0 
        ? await storage.getTargetAudiences(brand.id)
            .then(all => all.filter(p => personaIds.includes(p.id)))
        : [];

      res.json(personas);
    } catch (error) {
      console.error("Get product personas error:", error);
      res.status(500).json({ error: "Помилка отримання персон продукту" });
    }
  });

  // Add a persona to a product
  app.post("/api/products/:productId/personas", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { productId } = req.params;
      const { personaId } = req.body;

      if (!personaId) {
        return res.status(400).json({ error: "personaId є обов'язковим" });
      }

      const product = await storage.getBrandProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Check if already assigned
      const existing = await db
        .select()
        .from(productPersonasTable)
        .where(and(
          eq(productPersonasTable.productId, productId),
          eq(productPersonasTable.personaId, personaId)
        ));

      if (existing.length > 0) {
        return res.status(400).json({ error: "Персона вже додана до продукту" });
      }

      const [result] = await db
        .insert(productPersonasTable)
        .values({ productId, personaId })
        .returning();

      res.json(result);
    } catch (error) {
      console.error("Add product persona error:", error);
      res.status(500).json({ error: "Помилка додавання персони до продукту" });
    }
  });

  // Bulk add personas to a product (for adding entire segment/sub-segment)
  app.post("/api/products/:productId/personas/bulk", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { productId } = req.params;
      const { personaIds } = req.body;

      if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
        return res.status(400).json({ error: "personaIds масив є обов'язковим" });
      }

      const product = await storage.getBrandProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Get existing assignments to avoid duplicates
      const existing = await db
        .select()
        .from(productPersonasTable)
        .where(eq(productPersonasTable.productId, productId));

      const existingPersonaIds = new Set(existing.map(e => e.personaId));
      const newPersonaIds = personaIds.filter((id: string) => !existingPersonaIds.has(id));

      if (newPersonaIds.length === 0) {
        return res.json({ added: 0, message: "Всі персони вже додані" });
      }

      // Insert new assignments
      const insertValues = newPersonaIds.map((personaId: string) => ({ productId, personaId }));
      await db.insert(productPersonasTable).values(insertValues);

      res.json({ added: newPersonaIds.length });
    } catch (error) {
      console.error("Bulk add product personas error:", error);
      res.status(500).json({ error: "Помилка додавання персон до продукту" });
    }
  });

  // Remove a persona from a product
  app.delete("/api/products/:productId/personas/:personaId", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { productId, personaId } = req.params;

      const product = await storage.getBrandProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await db
        .delete(productPersonasTable)
        .where(and(
          eq(productPersonasTable.productId, productId),
          eq(productPersonasTable.personaId, personaId)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Remove product persona error:", error);
      res.status(500).json({ error: "Помилка видалення персони з продукту" });
    }
  });

  // =========================================
  // Product Categories API
  // =========================================

  // Get product categories for a brand
  app.get("/api/brands/:brandId/product-categories", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const categories = await storage.getProductCategories(brandId);
      res.json(categories);
    } catch (error) {
      console.error("Get product categories error:", error);
      res.status(500).json({ error: "Помилка отримання категорій продуктів" });
    }
  });

  // Create product category
  app.post("/api/brands/:brandId/product-categories", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const category = await storage.createProductCategory({
        brandId,
        ...req.body
      });
      res.status(201).json(category);
    } catch (error) {
      console.error("Create product category error:", error);
      res.status(500).json({ error: "Помилка створення категорії" });
    }
  });

  // Update product category
  app.patch("/api/product-categories/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const category = await storage.getProductCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Категорію не знайдено" });
      }

      const brand = await storage.getUserBrand(category.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const updated = await storage.updateProductCategory(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update product category error:", error);
      res.status(500).json({ error: "Помилка оновлення категорії" });
    }
  });

  // Delete product category
  app.delete("/api/product-categories/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const category = await storage.getProductCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Категорію не знайдено" });
      }

      const brand = await storage.getUserBrand(category.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteProductCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete product category error:", error);
      res.status(500).json({ error: "Помилка видалення категорії" });
    }
  });

  // Generate product data with AI
  app.post("/api/brands/:brandId/generate-product", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const { description } = req.body;
      
      if (!description || typeof description !== "string" || description.trim().length < 5) {
        return res.status(400).json({ error: "Опис продукту обов'язковий (мінімум 5 символів)" });
      }

      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      const brandValues = brand.values as string[] | undefined;
      const brandData = {
        name: brand.name,
        description: brand.description || undefined,
        values: brandValues,
        mission: brand.mission || undefined,
        targetAudience: brand.targetAudience || undefined,
      };

      const generatedData = await generateProductData(brandData, description);
      res.json(generatedData);
    } catch (error) {
      console.error("Generate product data error:", error);
      res.status(500).json({ error: "Помилка генерації даних продукту" });
    }
  });

  // Generate product image with AI based on brand logo
  app.post("/api/products/:id/generate-image", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { additionalPrompt } = req.body;
      
      const product = await storage.getBrandProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Build prompt for product image, including additional prompt if provided
      let prompt = buildProductImagePrompt(product, brand);
      if (additionalPrompt) {
        prompt += ` Additional requirements: ${additionalPrompt}`;
      }
      
      // Add instruction to incorporate brand logo if available
      if (brand.logo) {
        prompt += " Incorporate the brand logo subtly into the product image design, ensuring brand identity is visible.";
      }

      let imageDataUrl: string;
      
      // Generate image using Gemini with brand logo reference if available
      if (brand.logo) {
        const { generateImageWithReferences } = await import("./replit_integrations/image/client");
        const referenceImages = [
          { url: brand.logo, label: "Brand Logo - incorporate this logo into the product image" }
        ];
        imageDataUrl = await generateImageWithReferences(prompt, referenceImages);
      } else {
        const { generateImage } = await import("./replit_integrations/image/client");
        imageDataUrl = await generateImage(prompt);
      }
      
      // Update product with new image
      const currentImages = (product.images as string[]) || [];
      const updated = await storage.updateBrandProduct(id, {
        mainImageUrl: imageDataUrl,
        images: [...currentImages, imageDataUrl]
      });

      res.json({ 
        success: true, 
        imageUrl: imageDataUrl,
        product: updated 
      });
    } catch (error) {
      console.error("Generate product image error:", error);
      res.status(500).json({ error: "Помилка генерації зображення продукту" });
    }
  });

  // Upload product image
  app.post("/api/products/:id/upload-image", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { base64Data, setAsMain } = req.body;
      
      if (!base64Data || typeof base64Data !== 'string') {
        return res.status(400).json({ error: "Зображення не надано" });
      }

      const product = await storage.getBrandProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Продукт не знайдено" });
      }

      const brand = await storage.getUserBrand(product.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Upload to object storage
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const imageUrl = await objectStorageService.uploadProductImage(id, base64Data);

      // Update product images
      const currentImages = (product.images as string[]) || [];
      const updatedImages = [...currentImages, imageUrl];
      
      const updateData: any = { images: updatedImages };
      if (setAsMain || !product.mainImageUrl) {
        updateData.mainImageUrl = imageUrl;
      }
      
      const updated = await storage.updateBrandProduct(id, updateData);

      res.json({ 
        success: true, 
        imageUrl,
        product: updated 
      });
    } catch (error) {
      console.error("Upload product image error:", error);
      res.status(500).json({ error: "Помилка завантаження зображення" });
    }
  });

  // Generate AI persona for target audience
  app.post("/api/brands/:brandId/generate-persona", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      const { audienceType = "primary", customPrompt, personaName, segmentIds, subSegmentIds } = req.body;
      
      const brand = await storage.getUserBrand(brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }

      // Get existing audiences for context
      const existingAudiences = await storage.getTargetAudiences(brandId);
      const existingSegments = existingAudiences.map(a => ({
        name: a.name,
        description: a.description || undefined
      }));

      // Fetch selected segment data for context (only from this brand)
      const selectedSegmentsData: { name: string; description?: string; ageRange?: string; gender?: string; location?: string; income?: string; education?: string; occupation?: string; contextDescription?: string; targetBehavior?: string }[] = [];
      if (segmentIds && Array.isArray(segmentIds)) {
        for (const segId of segmentIds) {
          const segment = await storage.getDemographicSegment(segId);
          // Validate segment belongs to this brand
          if (segment && segment.brandId === brandId) {
            selectedSegmentsData.push({
              name: segment.name,
              description: segment.description || undefined,
              ageRange: segment.ageRange || undefined,
              gender: segment.gender || undefined,
              location: segment.location || undefined,
              income: segment.income || undefined,
              education: segment.education || undefined,
              occupation: segment.occupation || undefined,
              contextDescription: segment.contextDescription || undefined,
              targetBehavior: segment.targetBehavior || undefined,
            });
          }
        }
      }

      // Fetch selected sub-segment data for context (validate parent segment belongs to brand)
      const selectedSubSegmentsData: { name: string; description?: string; contextDescription?: string; specificNeeds?: string; differentiators?: string }[] = [];
      if (subSegmentIds && Array.isArray(subSegmentIds)) {
        for (const subId of subSegmentIds) {
          const subSegment = await storage.getDemographicSubSegment(subId);
          if (subSegment) {
            // Validate parent segment belongs to this brand
            const parentSegment = await storage.getDemographicSegment(subSegment.segmentId);
            if (parentSegment && parentSegment.brandId === brandId) {
              selectedSubSegmentsData.push({
                name: subSegment.name,
                description: subSegment.description || undefined,
                contextDescription: subSegment.contextDescription || undefined,
                specificNeeds: subSegment.specificNeeds || undefined,
                differentiators: subSegment.differentiators || undefined,
              });
            }
          }
        }
      }

      // Extract full brand data from passport
      const brandValues = brand.values as string[] | undefined;
      const brandData = {
        name: brand.name,
        description: brand.description || undefined,
        values: brandValues,
        mission: brand.mission || undefined,
        vision: brand.vision || undefined,
        targetAudience: brand.targetAudience || undefined,
        uniqueValue: brand.uniqueValue || undefined,
        tagline: brand.tagline || undefined,
      };

      const persona = await generateAudiencePersona(
        brandData, 
        audienceType, 
        existingSegments, 
        customPrompt,
        personaName,
        selectedSegmentsData,
        selectedSubSegmentsData
      );
      res.json(persona);
    } catch (error) {
      console.error("Generate persona error:", error);
      res.status(500).json({ error: "Помилка генерації персони" });
    }
  });

  // Generate avatar image for target audience using Gemini
  app.post("/api/target-audiences/:id/generate-avatar", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      
      // Get audience and verify ownership
      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Build prompt for avatar generation based on audience data
      const prompt = buildAvatarPrompt(audience);
      
      // Generate image using Gemini
      const { generateImage } = await import("./replit_integrations/image/client");
      const imageDataUrl = await generateImage(prompt);
      
      // Update audience with avatar URL
      const updated = await storage.updateTargetAudience(id, {
        aiPortraitImageUrl: imageDataUrl
      });

      res.json({ 
        success: true, 
        aiPortraitImageUrl: imageDataUrl,
        audience: updated 
      });
    } catch (error) {
      console.error("Generate avatar error:", error);
      res.status(500).json({ error: "Помилка генерації аватара" });
    }
  });

  // Upload custom avatar image for target audience
  app.post("/api/target-audiences/:id/upload-avatar", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { base64Data } = req.body;
      
      if (!base64Data || typeof base64Data !== 'string') {
        return res.status(400).json({ error: "Зображення не надано" });
      }

      // Get audience and verify ownership
      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Upload to object storage
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorage = new ObjectStorageService();
      const uploadResult = await objectStorage.uploadMediaAsset({
        userId: currentUser.id,
        assetType: 'avatar',
        brandId: brand.id,
        base64Data,
      });

      // Update audience with avatar URL
      const updated = await storage.updateTargetAudience(id, {
        aiPortraitImageUrl: uploadResult.publicUrl
      });

      res.json({ 
        success: true, 
        aiPortraitImageUrl: uploadResult.publicUrl,
        audience: updated 
      });
    } catch (error) {
      console.error("Upload avatar error:", error);
      res.status(500).json({ error: "Помилка завантаження аватара" });
    }
  });

  // Generate brand interaction image for target audience
  app.post("/api/target-audiences/:id/generate-interaction", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      const { scenario } = req.body;
      
      // Get audience and verify ownership
      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Build prompt for brand interaction image
      const prompt = buildBrandInteractionPrompt(audience, brand, scenario || "using_product");
      
      // Collect reference images (logo and avatar)
      const referenceImages: { url: string; label: string }[] = [];
      
      // Use logo URL - refresh only if it's a signed URL (has X-Goog-Signature)
      if (brand.logo) {
        try {
          let logoUrl = brand.logo;
          // Only refresh if it's a signed URL (private storage)
          if (brand.logo.includes("X-Goog-Signature")) {
            const { refreshSignedUrl } = await import("./objectStorage");
            logoUrl = await refreshSignedUrl(brand.logo);
            console.log("Refreshed signed logo URL for brand interaction image");
          } else {
            console.log("Using public logo URL for brand interaction image");
          }
          referenceImages.push({ url: logoUrl, label: "Brand Logo - use this exact logo in the image" });
        } catch (logoError) {
          console.error("Failed to process logo URL:", logoError);
          // Try using original URL as fallback
          referenceImages.push({ url: brand.logo, label: "Brand Logo - use this exact logo in the image" });
        }
      }
      
      // Use avatar URL - refresh only if it's a signed URL (has X-Goog-Signature)
      if (audience.aiPortraitImageUrl) {
        try {
          let avatarUrl = audience.aiPortraitImageUrl;
          if (audience.aiPortraitImageUrl.includes("X-Goog-Signature")) {
            const { refreshSignedUrl } = await import("./objectStorage");
            avatarUrl = await refreshSignedUrl(audience.aiPortraitImageUrl);
            console.log("Refreshed signed avatar URL for brand interaction image");
          } else {
            console.log("Using public/data avatar URL for brand interaction image");
          }
          referenceImages.push({ url: avatarUrl, label: "Target Persona - generate this person in the scene" });
        } catch (avatarError) {
          console.error("Failed to process avatar URL:", avatarError);
          referenceImages.push({ url: audience.aiPortraitImageUrl, label: "Target Persona - generate this person in the scene" });
        }
      }
      
      // Generate image using Gemini with reference images
      const { generateImage, generateImageWithReferences } = await import("./replit_integrations/image/client");
      
      let imageDataUrl: string;
      if (referenceImages.length > 0) {
        imageDataUrl = await generateImageWithReferences(prompt, referenceImages);
      } else {
        imageDataUrl = await generateImage(prompt);
      }
      
      // Get existing images and add new one
      const existingImages = (audience.brandInteractionImages as string[]) || [];
      const updatedImages = [...existingImages, imageDataUrl];
      
      // Update audience with new interaction image
      const updated = await storage.updateTargetAudience(id, {
        brandInteractionImages: updatedImages
      });

      res.json({ 
        success: true, 
        imageUrl: imageDataUrl,
        brandInteractionImages: updatedImages,
        audience: updated 
      });
    } catch (error) {
      console.error("Generate brand interaction error:", error);
      res.status(500).json({ error: "Помилка генерації зображення" });
    }
  });

  // Delete brand interaction image
  app.delete("/api/target-audiences/:id/interaction-image/:imageIndex", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id, imageIndex } = req.params;
      const index = parseInt(imageIndex, 10);
      
      // Get audience and verify ownership
      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Аудиторію не знайдено" });
      }

      const brand = await storage.getUserBrand(audience.brandId);
      if (!brand || brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      // Remove image at index
      const existingImages = (audience.brandInteractionImages as string[]) || [];
      if (index < 0 || index >= existingImages.length) {
        return res.status(400).json({ error: "Невірний індекс зображення" });
      }
      
      const updatedImages = existingImages.filter((_, i) => i !== index);
      
      const updated = await storage.updateTargetAudience(id, {
        brandInteractionImages: updatedImages
      });

      res.json({ 
        success: true, 
        brandInteractionImages: updatedImages,
        audience: updated 
      });
    } catch (error) {
      console.error("Delete interaction image error:", error);
      res.status(500).json({ error: "Помилка видалення зображення" });
    }
  });

  // Game sessions with user auth
  app.get("/api/user/game-sessions", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const sessions = await storage.getUserGameSessions(currentUser.id);
      res.json(sessions);
    } catch (error) {
      console.error("Get user game sessions error:", error);
      res.status(500).json({ error: "Помилка отримання ігрових сесій" });
    }
  });

  // User stats
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const stats = await storage.getUserStats(currentUser.id);
      res.json(stats);
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ error: "Помилка отримання статистики" });
    }
  });

  // Create new game session (requires auth)
  app.post("/api/game-sessions", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check game quota
      const canCreate = await storage.canCreateGame(currentUser.id);
      if (!canCreate) {
        return res.status(403).json({ 
          error: "Досягнуто ліміт ігор для вашого тарифу", 
          code: "GAME_QUOTA_EXCEEDED"
        });
      }

      const validatedData = insertGameSessionSchema.parse({
        ...req.body,
        userId: currentUser.id,
        currentCard: req.body.currentCard?.toString() || "1",
      });
      
      const session = await storage.createGameSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Delete game session
  app.delete("/api/game-sessions/:sessionId", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { sessionId } = req.params;
      
      // Verify session belongs to user
      const session = await storage.getGameSession(sessionId);
      if (!session || session.userId !== currentUser.id) {
        return res.status(404).json({ error: "Game session not found" });
      }

      const deleted = await storage.deleteGameSession(sessionId);
      if (!deleted) {
        return res.status(404).json({ error: "Game session not found" });
      }

      res.json({ message: "Game session deleted successfully" });
    } catch (error) {
      console.error("Delete game session error:", error);
      res.status(500).json({ error: "Failed to delete game session" });
    }
  });

  // Get game session
  app.get("/api/game-sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getGameSession(id);
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching game session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update game session
  app.patch("/api/game-sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateGameSessionSchema.parse(req.body);
      const session = await storage.updateGameSession(id, id, validatedData);
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error updating game session:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Save card response
  app.post("/api/game-sessions/:id/responses", async (req, res) => {
    try {
      const { id } = req.params;
      const { cardId, response, responseType = "text", timeSpent, isWithinTimeLimit, earnedXP } = req.body;
      
      console.log("Saving response:", { sessionId: id, cardId, response, responseType });
      console.log("Timer data:", { timeSpent, isWithinTimeLimit, earnedXP });
      console.log("Response type:", typeof response);
      console.log("Response length:", response?.length);
      
      // Check if required fields are present
      if (!cardId) {
        console.log("Missing cardId");
        return res.status(400).json({ error: "Card ID is required" });
      }
      
      // Allow empty responses for text cards - they can be saved as draft
      if (response === undefined || response === null) {
        console.log("Response is null or undefined:", response);
        return res.status(400).json({ error: "Response is required" });
      }
      
      // Verify card exists before saving response  
      try {
        const cardExists = await storage.getGameCard(cardId);
        if (!cardExists) {
          console.log(`Card ${cardId} does not exist in database`);
          return res.status(400).json({ error: `Card ${cardId} does not exist` });
        }
        console.log(`Card ${cardId} found in database:`, cardExists.title);
      } catch (cardError) {
        console.error("Error checking card existence:", cardError);
        return res.status(400).json({ error: "Error validating card" });
      }
      
      const session = await storage.saveCardResponse(id, cardId, response, responseType, {
        timeSpent,
        isWithinTimeLimit,
        earnedXP
      });
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error saving card response:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Update game progress
  app.post("/api/game-sessions/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const progressData = updateProgressSchema.parse(req.body);
      
      const session = await storage.updateGameSession(id, id, progressData);
      
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Get game progress
  app.get("/api/game-sessions/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const progress = await storage.getGameProgress(id);
      
      if (!progress) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get card option sets for specific card
  app.get('/api/cards/:cardId/option-sets', async (req, res) => {
    try {
      const cardId = req.params.cardId;
      const optionSetIds = await storage.getCardOptionSetsByCardId(cardId);
      
      // Get full option set data
      const optionSets = [];
      for (const setId of optionSetIds) {
        const set = await storage.getCardOptionSet(setId);
        if (set) {
          const options = await storage.getCardOptionsBySetId(setId);
          optionSets.push({ ...set, options });
        }
      }
      
      res.json(optionSets);
    } catch (error) {
      console.error('Error fetching card option sets:', error);
      res.status(500).json({ error: 'Failed to fetch card option sets' });
    }
  });

  // Generate brand map
  app.get("/api/game-sessions/:id/brand-map", async (req, res) => {
    try {
      const { id } = req.params;
      const brandMap = await storage.generateBrandMap(id);
      
      if (!brandMap) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      res.json(brandMap);
    } catch (error) {
      console.error("Error generating brand map:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Complete game session
  app.post("/api/game-sessions/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if session exists first
      const existingSession = await storage.getGameSession(id);
      if (!existingSession) {
        return res.status(404).json({ error: "Game session not found" });
      }
      
      // Only update if not already completed
      if (!existingSession.completed) {
        const session = await storage.updateGameSession(id, id, {
          completed: new Date(),
          progress: 100,
        });
        
        console.log(`Game session ${id} marked as completed`);
        res.json(session);
      } else {
        console.log(`Game session ${id} already completed`);
        res.json(existingSession);
      }
    } catch (error) {
      console.error("Error completing game session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get game levels
  app.get("/api/game-levels", async (req, res) => {
    try {
      const levels = await storage.getGameLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching game levels:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get game cards (all or by level)
  app.get("/api/game-cards", async (req, res) => {
    try {
      const { level } = req.query;
      const cards = await storage.getGameCards(level as string);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching game cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get options for specific card
  app.get("/api/game-cards/:cardId/options", async (req, res) => {
    try {
      const { cardId } = req.params;
      const options = await storage.getCardOptionsByCardId(cardId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching card options:", error);
      res.status(500).json({ error: "Failed to fetch card options" });
    }
  });

  // Get all card options (for admin options list)
  app.get("/api/admin/card-options/all", requireAdmin, async (req, res) => {
    try {
      const allOptions = await storage.getAllCardOptions();
      res.json(allOptions);
    } catch (error) {
      console.error("Error fetching all card options:", error);
      res.status(500).json({ error: "Failed to fetch all card options" });
    }
  });

  // Get card responses for session with card details
  app.get("/api/game-sessions/:id/responses", async (req, res) => {
    try {
      const { id } = req.params;
      const responses = await storage.getSessionCardResponses(id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching card responses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get card responses as a map (cardId -> response) for UI consumption
  app.get("/api/game-sessions/:id/responses-map", async (req, res) => {
    try {
      const { id } = req.params;
      const { raw } = req.query;
      
      // If raw=true, get untranslated responses for GameCard
      if (raw === 'true') {
        const rawResponses = await db
          .select()
          .from(cardResponsesTable)
          .where(eq(cardResponsesTable.sessionId, id));
        
        const responsesMap: Record<string, any> = {};
        for (const r of rawResponses) {
          responsesMap[r.cardId] = {
            response: r.response,
            responseType: r.responseType,
            skipped: r.responseType === 'skip' || (r.response && typeof r.response === 'object' && (r.response as any).skipped === true),
            reason: r.response && typeof r.response === 'object' ? (r.response as any).reason : undefined,
            timeSpent: r.timeSpent,
            isWithinTimeLimit: r.isWithinTimeLimit,
            earnedXP: r.earnedXP
          };
        }
        return res.json(responsesMap);
      }
      
      const responses = await storage.getSessionCardResponses(id);
      
      // Convert array to map for easier lookup in UI
      const responsesMap: Record<string, any> = {};
      for (const r of responses) {
        responsesMap[r.cardId] = {
          response: r.response,
          responseType: r.responseType,
          skipped: r.responseType === 'skip' || (r.response && typeof r.response === 'object' && r.response.skipped === true),
          reason: r.response && typeof r.response === 'object' ? r.response.reason : undefined,
          timeSpent: r.timeSpent,
          isWithinTimeLimit: r.isWithinTimeLimit,
          earnedXP: r.earnedXP
        };
      }
      
      res.json(responsesMap);
    } catch (error) {
      console.error("Error fetching card responses map:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // =============================================================================
  // ADMIN ROUTES - Access restricted to admin role only
  // =============================================================================

  // Admin dashboard data
  app.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all game cards for admin editing
  app.get("/api/admin/cards", requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getAllCardsWithProperties();
      res.json(cards);
    } catch (error) {
      console.error("Error fetching admin cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update game card
  app.put("/api/admin/cards/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const cardData = req.body;
      const updatedCard = await storage.updateGameCard(id, cardData);
      res.json(updatedCard);
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new game card
  app.post("/api/admin/cards", requireAdmin, async (req, res) => {
    try {
      const cardData = req.body;
      const newCard = await storage.createGameCard(cardData);
      res.json(newCard);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete game card
  app.delete("/api/admin/cards/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGameCard(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get card properties
  app.get("/api/admin/cards/:id/properties", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const properties = await storage.getCardProperties(id);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching card properties:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update card properties
  app.put("/api/admin/cards/:id/properties", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const properties = req.body.properties;
      const updatedProperties = await storage.updateCardProperties(id, properties);
      res.json(updatedProperties);
    } catch (error) {
      console.error("Error updating card properties:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all levels for admin editing
  app.get("/api/admin/levels", requireAdmin, async (req, res) => {
    try {
      const levels = await storage.getGameLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching admin levels:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update game level
  app.put("/api/admin/levels/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const levelData = req.body;
      const updatedLevel = await storage.updateGameLevel(id, levelData);
      res.json(updatedLevel);
    } catch (error) {
      console.error("Error updating level:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reorder cards
  app.post("/api/admin/cards/reorder", requireAdmin, async (req, res) => {
    try {
      console.log("Reorder request body:", req.body);
      const { cards } = req.body;
      console.log("Cards to reorder:", cards);
      
      if (!cards || !Array.isArray(cards)) {
        return res.status(400).json({ error: "Invalid cards data" });
      }
      
      await storage.reorderCards(cards);
      res.json({ success: true, message: "Cards reordered successfully" });
    } catch (error) {
      console.error("Error reordering cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Normalize card positions
  app.post("/api/admin/cards/normalize-positions", requireAdmin, async (req, res) => {
    try {
      await storage.normalizeCardPositions();
      res.json({ success: true, message: "Card positions normalized" });
    } catch (error) {
      console.error("Error normalizing positions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin users management
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user subscription details (admin)
  app.get("/api/admin/users/:id/subscription", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getUserSubscriptionWithPlan(id);
      const plans = await storage.getSubscriptionPlans();
      res.json({ subscription, plans });
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user payment history (admin)
  app.get("/api/admin/users/:id/payments", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const payments = await storage.getUserPaymentHistory(id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user subscription (admin)
  app.put("/api/admin/users/:id/subscription", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { planId, status, billingPeriod } = req.body;
      
      // Check if user has existing subscription
      let subscription = await storage.getUserSubscription(id);
      
      if (subscription) {
        // Update existing subscription
        const updates: any = {};
        if (planId !== undefined) updates.planId = planId;
        if (status !== undefined) updates.status = status;
        if (billingPeriod !== undefined) updates.billingPeriod = billingPeriod;
        
        subscription = await storage.updateUserSubscription(id, updates);
      } else if (planId) {
        // Create new subscription
        subscription = await storage.createUserSubscription({
          userId: id,
          planId,
          billingPeriod: billingPeriod || 'monthly',
          status: status || 'active',
        });
      }
      
      const subscriptionWithPlan = await storage.getUserSubscriptionWithPlan(id);
      res.json(subscriptionWithPlan);
    } catch (error) {
      console.error("Error updating user subscription:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Card Option Sets Routes
  app.get("/api/admin/card-option-sets", requireAdmin, async (req, res) => {
    try {
      const cardTypeId = req.query.cardTypeId as string | undefined;
      const optionSets = await storage.getCardOptionSets(cardTypeId);
      res.json(optionSets);
    } catch (error) {
      console.error("Error fetching card option sets:", error);
      res.status(500).json({ error: "Failed to fetch card option sets" });
    }
  });

  // Get options for specific option set
  app.get("/api/admin/card-option-sets/:setId/options", requireAdmin, async (req, res) => {
    try {
      const { setId } = req.params;
      const options = await storage.getCardOptionsBySetId(setId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching card options:", error);
      res.status(500).json({ error: "Failed to fetch card options" });
    }
  });

  app.get("/api/admin/card-option-sets/:id", requireAdmin, async (req, res) => {
    try {
      const optionSet = await storage.getCardOptionSet(req.params.id);
      if (!optionSet) {
        return res.status(404).json({ error: "Card option set not found" });
      }
      res.json(optionSet);
    } catch (error) {
      console.error("Error fetching card option set:", error);
      res.status(500).json({ error: "Failed to fetch card option set" });
    }
  });

  app.post("/api/admin/card-option-sets", requireAdmin, async (req, res) => {
    try {
      const optionSet = await storage.createCardOptionSet(req.body);
      res.json(optionSet);
    } catch (error) {
      console.error("Error creating card option set:", error);
      res.status(500).json({ error: "Failed to create card option set" });
    }
  });

  app.put("/api/admin/card-option-sets/:id", requireAdmin, async (req, res) => {
    try {
      const optionSet = await storage.updateCardOptionSet(req.params.id, req.body);
      if (!optionSet) {
        return res.status(404).json({ error: "Card option set not found" });
      }
      res.json(optionSet);
    } catch (error) {
      console.error("Error updating card option set:", error);
      res.status(500).json({ error: "Failed to update card option set" });
    }
  });

  app.delete("/api/admin/card-option-sets/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCardOptionSet(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Card option set not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting card option set:", error);
      res.status(500).json({ error: "Failed to delete card option set" });
    }
  });

  // Card Options Routes
  app.get("/api/admin/card-options/:optionSetId", requireAdmin, async (req, res) => {
    try {
      const options = await storage.getCardOptions(req.params.optionSetId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching card options:", error);
      res.status(500).json({ error: "Failed to fetch card options" });
    }
  });

  app.post("/api/admin/card-options", requireAdmin, async (req, res) => {
    try {
      const option = await storage.createCardOption(req.body);
      res.json(option);
    } catch (error) {
      console.error("Error creating card option:", error);
      res.status(500).json({ error: "Failed to create card option" });
    }
  });

  app.put("/api/admin/card-options/:id", requireAdmin, async (req, res) => {
    try {
      const option = await storage.updateCardOption(req.params.id, req.body);
      if (!option) {
        return res.status(404).json({ error: "Card option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Error updating card option:", error);
      res.status(500).json({ error: "Failed to update card option" });
    }
  });

  app.delete("/api/admin/card-options/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCardOption(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Card option not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting card option:", error);
      res.status(500).json({ error: "Failed to delete card option" });
    }
  });

  // =====================================================
  // DATABASE SYNC ROUTES (Dev to Production)
  // =====================================================

  // Get comparison between dev and prod databases
  app.get("/api/admin/db-sync/compare", requireAdmin, async (req, res) => {
    try {
      const devDbUrl = process.env.DEVELOPMENT_DATABASE_URL;
      const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;
      
      if (!devDbUrl || !prodDbUrl) {
        return res.status(400).json({ 
          error: "Database URLs not configured",
          devConfigured: !!devDbUrl,
          prodConfigured: !!prodDbUrl
        });
      }

      // Import neon for both databases
      const { neon } = await import("@neondatabase/serverless");
      const devQuery = neon(devDbUrl);
      const prodQuery = neon(prodDbUrl);

      // Tables to sync
      const tables = [
        'game_levels',
        'game_cards', 
        'card_properties',
        'card_relations',
        'card_option_sets',
        'card_options',
        'card_option_set_links',
        'users',
        'user_profiles',
        'user_settings',
        'user_brands',
        'game_sessions',
        'card_responses'
      ];

      const comparison: any[] = [];

      for (const table of tables) {
        try {
          // Get dev count
          let devCount = 0;
          try {
            const devResult = await devQuery(`SELECT COUNT(*) as count FROM "${table}"`);
            devCount = Number(devResult[0]?.count || 0);
          } catch (e: any) {
            if (e.message?.includes('does not exist')) {
              devCount = -1;
            }
          }

          // Get prod count
          let prodCount = 0;
          try {
            const prodResult = await prodQuery(`SELECT COUNT(*) as count FROM "${table}"`);
            prodCount = Number(prodResult[0]?.count || 0);
          } catch (e: any) {
            if (e.message?.includes('does not exist')) {
              prodCount = -1; // Table doesn't exist in prod
            }
          }

          comparison.push({
            table,
            devCount: devCount >= 0 ? devCount : 0,
            prodCount: prodCount >= 0 ? prodCount : 0,
            diff: (devCount >= 0 ? devCount : 0) - (prodCount >= 0 ? prodCount : 0),
            status: prodCount === -1 ? 'missing' : (devCount === prodCount ? 'synced' : 'different')
          });
        } catch (e: any) {
          comparison.push({
            table,
            devCount: 0,
            prodCount: 0,
            diff: 0,
            status: 'error',
            error: e.message
          });
        }
      }

      res.json({ comparison, devDbConnected: true, prodDbConnected: true });
    } catch (error: any) {
      console.error("DB Sync compare error:", error);
      res.status(500).json({ error: error.message || "Failed to compare databases" });
    }
  });

  // Sync a specific table from dev to prod
  app.post("/api/admin/db-sync/sync-table", requireAdmin, async (req, res) => {
    try {
      const { table } = req.body;
      if (!table) {
        return res.status(400).json({ error: "Table name required" });
      }

      const devDbUrl = process.env.DEVELOPMENT_DATABASE_URL;
      const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;
      if (!devDbUrl || !prodDbUrl) {
        return res.status(400).json({ error: "Database URLs not configured" });
      }

      const { neon } = await import("@neondatabase/serverless");
      const devQuery = neon(devDbUrl);
      const prodQuery = neon(prodDbUrl);

      // Get all data from dev
      const devData = await devQuery(`SELECT * FROM "${table}"`);
      
      if (devData.length === 0) {
        return res.json({ synced: 0, message: "No data to sync" });
      }

      // Truncate prod table first
      await prodQuery(`TRUNCATE TABLE "${table}" CASCADE`);

      // Build INSERT statements  
      const columns = Object.keys(devData[0]);
      let synced = 0;

      // Get column types for proper JSON handling
      const columnTypesResult = await devQuery(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      const jsonColumns = new Set(
        columnTypesResult
          .filter((r: any) => r.data_type === 'json' || r.data_type === 'jsonb')
          .map((r: any) => r.column_name)
      );

      for (const row of devData) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          
          // Handle JSON columns FIRST - always stringify any value
          if (jsonColumns.has(col)) {
            const jsonStr = JSON.stringify(val).replace(/'/g, "''");
            return `'${jsonStr}'::json`;
          }
          
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'number') return String(val);
          if (typeof val === 'object') {
            const jsonStr = JSON.stringify(val).replace(/'/g, "''");
            return `'${jsonStr}'`;
          }
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        const columnsStr = columns.map(c => `"${c}"`).join(', ');
        const valuesStr = values.join(', ');
        
        await prodQuery(`INSERT INTO "${table}" (${columnsStr}) VALUES (${valuesStr})`);
        synced++;
      }

      res.json({ synced, message: `Successfully synced ${synced} rows` });
    } catch (error: any) {
      console.error("DB Sync table error:", error);
      res.status(500).json({ error: error.message || "Failed to sync table" });
    }
  });

  // Sync all tables
  app.post("/api/admin/db-sync/sync-all", requireAdmin, async (req, res) => {
    try {
      const devDbUrl = process.env.DEVELOPMENT_DATABASE_URL;
      const prodDbUrl = process.env.PRODUCTION_DATABASE_URL;
      if (!devDbUrl || !prodDbUrl) {
        return res.status(400).json({ error: "Database URLs not configured" });
      }

      const { neon } = await import("@neondatabase/serverless");
      const devQuery = neon(devDbUrl);
      const prodQuery = neon(prodDbUrl);

      // Tables in order (respecting foreign keys)
      const tables = [
        'game_levels',
        'users',
        'user_profiles',
        'user_settings',
        'user_brands',
        'game_cards',
        'card_properties',
        'card_relations',
        'card_option_sets',
        'card_options',
        'card_option_set_links',
        'game_sessions',
        'card_responses'
      ];

      const results: any[] = [];

      // First truncate all tables in reverse order
      for (const table of [...tables].reverse()) {
        try {
          await prodQuery(`TRUNCATE TABLE "${table}" CASCADE`);
        } catch (e) {
          // Ignore if table doesn't exist
        }
      }

      // Now insert data
      for (const table of tables) {
        try {
          const devData = await devQuery(`SELECT * FROM "${table}"`);
          
          if (devData.length === 0) {
            results.push({ table, synced: 0, status: 'empty' });
            continue;
          }

          const columns = Object.keys(devData[0]);
          let synced = 0;

          // Get column types for proper JSON handling
          const columnTypesResult = await devQuery(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
          `);
          const jsonColumns = new Set(
            columnTypesResult
              .filter((r: any) => r.data_type === 'json' || r.data_type === 'jsonb')
              .map((r: any) => r.column_name)
          );

          for (const row of devData) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null || val === undefined) return 'NULL';
              
              // Handle JSON columns FIRST - always stringify any value
              if (jsonColumns.has(col)) {
                const jsonStr = JSON.stringify(val).replace(/'/g, "''");
                return `'${jsonStr}'::json`;
              }
              
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'number') return String(val);
              if (typeof val === 'object') {
                const jsonStr = JSON.stringify(val).replace(/'/g, "''");
                return `'${jsonStr}'`;
              }
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            const columnsStr = columns.map(c => `"${c}"`).join(', ');
            const valuesStr = values.join(', ');
            
            await prodQuery(`INSERT INTO "${table}" (${columnsStr}) VALUES (${valuesStr})`);
            synced++;
          }

          results.push({ table, synced, status: 'success' });
        } catch (e: any) {
          results.push({ table, synced: 0, status: 'error', error: e.message });
        }
      }

      res.json({ results, success: true });
    } catch (error: any) {
      console.error("DB Sync all error:", error);
      res.status(500).json({ error: error.message || "Failed to sync all tables" });
    }
  });

  // ============= AI/OpenAI Settings & Analysis =============

  // Check AI providers settings (OpenAI and Perplexity)
  app.get("/api/admin/ai-settings", requireAdmin, async (req, res) => {
    try {
      const configured = await isOpenAIConfigured();
      const openaiDbSetting = await storage.getAppSetting("OPENAI_API_KEY");
      const perplexityDbSetting = await storage.getAppSetting("PERPLEXITY_API_KEY");
      const claudeDbSetting = await storage.getAppSetting("ANTHROPIC_API_KEY");
      
      // Get AI configuration settings
      const aiProvider = await storage.getAppSetting("AI_PROVIDER");
      const aiModelOpenAI = await storage.getAppSetting("AI_MODEL_OPENAI");
      const aiModelPerplexity = await storage.getAppSetting("AI_MODEL_PERPLEXITY");
      const aiModelClaude = await storage.getAppSetting("AI_MODEL_CLAUDE");
      const aiContext = await storage.getAppSetting("AI_CONTEXT");
      
      res.json({
        openai: {
          configured: !!openaiDbSetting?.value || !!process.env.OPENAI_API_KEY,
          hasDbKey: !!openaiDbSetting?.value,
          hasEnvKey: !!process.env.OPENAI_API_KEY,
          keySource: openaiDbSetting?.value ? 'database' : (process.env.OPENAI_API_KEY ? 'environment' : 'none')
        },
        perplexity: {
          configured: !!perplexityDbSetting?.value || !!process.env.PERPLEXITY_API_KEY,
          hasDbKey: !!perplexityDbSetting?.value,
          hasEnvKey: !!process.env.PERPLEXITY_API_KEY,
          keySource: perplexityDbSetting?.value ? 'database' : (process.env.PERPLEXITY_API_KEY ? 'environment' : 'none')
        },
        claude: {
          configured: !!claudeDbSetting?.value || !!process.env.ANTHROPIC_API_KEY,
          hasDbKey: !!claudeDbSetting?.value,
          hasEnvKey: !!process.env.ANTHROPIC_API_KEY,
          keySource: claudeDbSetting?.value ? 'database' : (process.env.ANTHROPIC_API_KEY ? 'environment' : 'none')
        },
        settings: {
          provider: aiProvider?.value || 'openai',
          modelOpenAI: aiModelOpenAI?.value || 'gpt-4o',
          modelPerplexity: aiModelPerplexity?.value || 'sonar-pro',
          modelClaude: aiModelClaude?.value || 'claude-sonnet-4-20250514',
          context: aiContext?.value || ''
        },
        configured
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Save AI API key to database (OpenAI, Perplexity or Claude)
  app.post("/api/admin/ai-settings", requireAdmin, async (req, res) => {
    try {
      const { apiKey, provider = 'openai' } = req.body;
      
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return res.status(400).json({ error: "Некоректний API ключ" });
      }

      const keyNames: Record<string, string> = {
        openai: 'OPENAI_API_KEY',
        perplexity: 'PERPLEXITY_API_KEY',
        claude: 'ANTHROPIC_API_KEY'
      };
      const descriptions: Record<string, string> = {
        openai: 'OpenAI API ключ для AI аналізу брендів',
        perplexity: 'Perplexity API ключ для AI аналізу брендів',
        claude: 'Anthropic Claude API ключ для AI аналізу брендів'
      };
      const providerNames: Record<string, string> = {
        openai: 'OpenAI',
        perplexity: 'Perplexity',
        claude: 'Claude (Anthropic)'
      };

      const keyName = keyNames[provider] || 'OPENAI_API_KEY';
      const description = descriptions[provider] || 'API ключ для AI аналізу брендів';

      await storage.setAppSetting(keyName, apiKey.trim(), true, description);

      // Reset AI client cache when any key is updated
      const { resetAIClient } = await import("./openai");
      resetAIClient();

      res.json({ 
        success: true, 
        message: `${providerNames[provider] || provider} API ключ успішно збережено` 
      });
    } catch (error: any) {
      console.error("Error saving API key:", error);
      res.status(500).json({ error: "Не вдалося зберегти API ключ" });
    }
  });

  // Save AI configuration settings
  app.post("/api/admin/ai-settings/config", requireAdmin, async (req, res) => {
    try {
      const { provider, modelOpenAI, modelPerplexity, modelClaude, context } = req.body;

      if (provider) {
        await storage.setAppSetting("AI_PROVIDER", provider, false, "Активний AI провайдер (openai/perplexity/claude)");
      }
      if (modelOpenAI) {
        await storage.setAppSetting("AI_MODEL_OPENAI", modelOpenAI, false, "Модель OpenAI для використання");
      }
      if (modelPerplexity) {
        await storage.setAppSetting("AI_MODEL_PERPLEXITY", modelPerplexity, false, "Модель Perplexity для використання");
      }
      if (modelClaude) {
        await storage.setAppSetting("AI_MODEL_CLAUDE", modelClaude, false, "Модель Claude для використання");
      }
      if (context !== undefined) {
        await storage.setAppSetting("AI_CONTEXT", context, false, "Додатковий контекст для AI промптів");
      }
      
      // Reset AI client cache when config changes
      const { resetAIClient } = await import("./openai");
      resetAIClient();

      res.json({ success: true, message: "Налаштування успішно збережено" });
    } catch (error: any) {
      console.error("Error saving AI config:", error);
      res.status(500).json({ error: "Не вдалося зберегти налаштування" });
    }
  });

  // Get AI usage statistics
  app.get("/api/admin/ai-usage", requireAdmin, async (req, res) => {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month' | 'all') || 'all';
      const stats = await storage.getAIUsageStats(period);
      const recentLogs = await storage.getAIUsageLogs(20);
      
      res.json({
        stats,
        recentLogs
      });
    } catch (error: any) {
      console.error("Error fetching AI usage:", error);
      res.status(500).json({ error: "Не вдалося отримати статистику AI" });
    }
  });

  // Get NanoBanana usage statistics
  app.get("/api/admin/nanobanana-usage", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getNanoBananaUsageStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching NanoBanana usage:", error);
      res.status(500).json({ error: "Не вдалося отримати статистику NanoBanana" });
    }
  });

  // Generation Templates CRUD
  app.get("/api/admin/generation-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getGenerationTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching generation templates:", error);
      res.status(500).json({ error: "Не вдалося отримати шаблони" });
    }
  });

  app.get("/api/generation-templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getGenerationTemplates();
      // Return only active templates for regular users, without prompts
      const activeTemplates = templates
        .filter(t => t.isActive)
        .map(({ prompt, ...rest }) => rest);
      res.json(activeTemplates);
    } catch (error: any) {
      console.error("Error fetching generation templates:", error);
      res.status(500).json({ error: "Не вдалося отримати шаблони" });
    }
  });

  app.post("/api/admin/generation-templates", requireAdmin, async (req, res) => {
    try {
      const { name, description, referenceImageUrl, prompt, isActive, sortOrder } = req.body;
      if (!name || !prompt) {
        return res.status(400).json({ error: "Назва та промпт обов'язкові" });
      }
      
      let finalReferenceUrl: string | null = null;
      
      // Pre-process the reference image before creating template
      if (referenceImageUrl && referenceImageUrl.startsWith('data:image/')) {
        // Will upload after getting template ID
      } else if (referenceImageUrl && referenceImageUrl.startsWith('http')) {
        // Will upload after getting template ID
      }
      
      // First create the template to get an ID
      const template = await storage.createGenerationTemplate({
        name,
        description: description || null,
        referenceImageUrl: null, // Will be set after upload
        prompt,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      });
      
      // If referenceImageUrl is base64, upload it to object storage
      if (referenceImageUrl && referenceImageUrl.startsWith('data:image/')) {
        try {
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorageService = new ObjectStorageService();
          finalReferenceUrl = await objectStorageService.uploadTemplateReferenceImage(template.id, referenceImageUrl);
          const updatedTemplate = await storage.updateGenerationTemplate(template.id, { referenceImageUrl: finalReferenceUrl });
          return res.json(updatedTemplate);
        } catch (uploadError: any) {
          console.error('Failed to upload reference image:', uploadError);
          // Delete the template since image upload failed
          await storage.deleteGenerationTemplate(template.id);
          return res.status(422).json({ error: "Не вдалося завантажити зображення: " + (uploadError.message || "невідома помилка") });
        }
      } else if (referenceImageUrl && referenceImageUrl.startsWith('http')) {
        // If it's a URL (e.g., from AI generation), download and upload to storage
        try {
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorageService = new ObjectStorageService();
          finalReferenceUrl = await objectStorageService.uploadImageFromUrl(`templates/${template.id}`, referenceImageUrl);
          const updatedTemplate = await storage.updateGenerationTemplate(template.id, { referenceImageUrl: finalReferenceUrl });
          return res.json(updatedTemplate);
        } catch (uploadError: any) {
          console.error('Failed to save reference image URL:', uploadError);
          // Delete the template since image upload failed
          await storage.deleteGenerationTemplate(template.id);
          return res.status(422).json({ error: "Не вдалося зберегти зображення: " + (uploadError.message || "невідома помилка") });
        }
      }
      
      res.json(template);
    } catch (error: any) {
      console.error("Error creating generation template:", error);
      res.status(500).json({ error: "Не вдалося створити шаблон" });
    }
  });

  app.patch("/api/admin/generation-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let { name, description, referenceImageUrl, prompt, isActive, sortOrder } = req.body;
      
      // Handle base64 image upload
      if (referenceImageUrl && referenceImageUrl.startsWith('data:image/')) {
        try {
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorageService = new ObjectStorageService();
          referenceImageUrl = await objectStorageService.uploadTemplateReferenceImage(id, referenceImageUrl);
        } catch (uploadError: any) {
          console.error('Failed to upload reference image:', uploadError);
          // Return error - don't silently fail
          return res.status(422).json({ error: "Не вдалося завантажити зображення: " + (uploadError.message || "невідома помилка") });
        }
      } else if (referenceImageUrl && referenceImageUrl.startsWith('http') && !referenceImageUrl.includes('storage.googleapis.com')) {
        // If it's an external URL (not already on our storage), download and upload
        try {
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorageService = new ObjectStorageService();
          referenceImageUrl = await objectStorageService.uploadImageFromUrl(`templates/${id}`, referenceImageUrl);
        } catch (uploadError: any) {
          console.error('Failed to save reference image URL:', uploadError);
          // Return error - don't silently fail
          return res.status(422).json({ error: "Не вдалося зберегти зображення: " + (uploadError.message || "невідома помилка") });
        }
      }
      
      const template = await storage.updateGenerationTemplate(id, {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(referenceImageUrl !== undefined && { referenceImageUrl }),
        ...(prompt !== undefined && { prompt }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      });
      if (!template) {
        return res.status(404).json({ error: "Шаблон не знайдено" });
      }
      
      res.json(template);
    } catch (error: any) {
      console.error("Error updating generation template:", error);
      res.status(500).json({ error: "Не вдалося оновити шаблон" });
    }
  });

  app.delete("/api/admin/generation-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGenerationTemplate(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting generation template:", error);
      res.status(500).json({ error: "Не вдалося видалити шаблон" });
    }
  });

  // Upload reference image for template
  app.post("/api/admin/generation-templates/:id/upload-image", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "Зображення обов'язкове" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const imageUrl = await objectStorageService.uploadTemplateReferenceImage(id, imageData);
      
      // Update the template with new image URL
      const template = await storage.updateGenerationTemplate(id, { referenceImageUrl: imageUrl });
      if (!template) {
        return res.status(404).json({ error: "Шаблон не знайдено" });
      }
      
      res.json({ imageUrl, template });
    } catch (error: any) {
      console.error("Error uploading template reference image:", error);
      res.status(500).json({ error: error.message || "Не вдалося завантажити зображення" });
    }
  });

  // Generate reference image for template using AI
  app.post("/api/admin/generation-templates/generate-reference", requireAdmin, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Промпт обов'язковий" });
      }

      // Get user's Gemini API key from user_profiles table
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Користувач не авторизований" });
      }
      
      const userProfile = await storage.getUserProfile(userId);
      const apiKey = userProfile?.geminiApiKey;
      
      if (!apiKey) {
        return res.status(400).json({ error: "NanoBanana API ключ не налаштований. Будь ласка, додайте ключ у налаштуваннях." });
      }

      const { generateImageWithNanoBanana } = await import('./nanobanana');
      const result = await generateImageWithNanoBanana(apiKey, prompt, undefined, "1:1");
      
      if (!result.success || !result.imageUrl) {
        return res.status(500).json({ error: result.error || "Не вдалося згенерувати зображення" });
      }
      
      res.json({ imageUrl: result.imageUrl, prompt });
    } catch (error: any) {
      console.error("Error generating reference image:", error);
      res.status(500).json({ error: error.message || "Не вдалося згенерувати зображення" });
    }
  });

  // Save generated image as template reference
  app.post("/api/admin/generation-templates/:id/save-generated", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "URL зображення обов'язковий" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      // Download the image and upload to object storage
      const savedUrl = await objectStorageService.uploadImageFromUrl(`templates/${id}`, imageUrl);
      
      // Update the template with new image URL
      const template = await storage.updateGenerationTemplate(id, { referenceImageUrl: savedUrl });
      if (!template) {
        return res.status(404).json({ error: "Шаблон не знайдено" });
      }
      
      res.json({ imageUrl: savedUrl, template });
    } catch (error: any) {
      console.error("Error saving generated image:", error);
      res.status(500).json({ error: error.message || "Не вдалося зберегти зображення" });
    }
  });

  // ===== Merch Types Routes =====
  
  // Get all merch types (admin)
  app.get("/api/admin/merch-types", requireAdmin, async (req, res) => {
    try {
      const merchTypes = await storage.getMerchTypes();
      res.json(merchTypes);
    } catch (error: any) {
      console.error("Error fetching merch types:", error);
      res.status(500).json({ error: "Не вдалося отримати типи мерчу" });
    }
  });

  // Get active merch types (user)
  app.get("/api/merch-types", requireAuth, async (req, res) => {
    try {
      const merchTypes = await storage.getMerchTypes();
      // Filter to active only and return without exposing full prompt
      const activeMerchTypes = merchTypes
        .filter(mt => mt.isActive)
        .map(mt => ({
          id: mt.id,
          name: mt.name,
          emoji: mt.emoji,
          sortOrder: mt.sortOrder,
        }));
      res.json(activeMerchTypes);
    } catch (error: any) {
      console.error("Error fetching merch types:", error);
      res.status(500).json({ error: "Не вдалося отримати типи мерчу" });
    }
  });

  // Create merch type (admin)
  app.post("/api/admin/merch-types", requireAdmin, async (req, res) => {
    try {
      const { name, emoji, prompt, isActive, sortOrder } = req.body;
      if (!name || !emoji || !prompt) {
        return res.status(400).json({ error: "Назва, емоджі та промпт обов'язкові" });
      }
      const merchType = await storage.createMerchType({
        name,
        emoji,
        prompt,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      });
      res.json(merchType);
    } catch (error: any) {
      console.error("Error creating merch type:", error);
      res.status(500).json({ error: "Не вдалося створити тип мерчу" });
    }
  });

  // Update merch type (admin)
  app.patch("/api/admin/merch-types/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, emoji, prompt, isActive, sortOrder } = req.body;
      const merchType = await storage.updateMerchType(id, {
        ...(name !== undefined && { name }),
        ...(emoji !== undefined && { emoji }),
        ...(prompt !== undefined && { prompt }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      });
      if (!merchType) {
        return res.status(404).json({ error: "Тип мерчу не знайдено" });
      }
      res.json(merchType);
    } catch (error: any) {
      console.error("Error updating merch type:", error);
      res.status(500).json({ error: "Не вдалося оновити тип мерчу" });
    }
  });

  // Delete merch type (admin)
  app.delete("/api/admin/merch-types/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMerchType(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting merch type:", error);
      res.status(500).json({ error: "Не вдалося видалити тип мерчу" });
    }
  });

  // Reorder merch types (admin)
  app.post("/api/admin/merch-types/reorder", requireAdmin, async (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds має бути масивом" });
      }
      await storage.reorderMerchTypes(orderedIds);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error reordering merch types:", error);
      res.status(500).json({ error: "Не вдалося змінити порядок типів мерчу" });
    }
  });

  // Get all brands for admin Brand Space visualization
  app.get("/api/admin/brands", requireAdmin, async (req, res) => {
    try {
      const brands = await storage.getAllBrands();
      res.json(brands);
    } catch (error: any) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ error: "Не вдалося отримати бренди" });
    }
  });

  // Get game sessions for a specific brand (admin)
  app.get("/api/admin/brand-sessions/:brandId", requireAdmin, async (req, res) => {
    try {
      const { brandId } = req.params;
      const sessions = await storage.getGameSessionsByBrand(brandId);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching brand sessions:", error);
      res.status(500).json({ error: "Не вдалося отримати сесії бренду" });
    }
  });

  // Update card response (admin only)
  app.patch("/api/admin/card-responses/:sessionId/:cardId", requireAdmin, async (req, res) => {
    try {
      const { sessionId, cardId } = req.params;
      const { response } = req.body;
      
      if (response === undefined) {
        return res.status(400).json({ error: "Відповідь обов'язкова" });
      }
      
      const updated = await storage.updateCardResponse(sessionId, cardId, response);
      if (!updated) {
        return res.status(404).json({ error: "Відповідь не знайдено" });
      }
      
      res.json({ success: true, response: updated });
    } catch (error: any) {
      console.error("Error updating card response:", error);
      res.status(500).json({ error: "Не вдалося оновити відповідь" });
    }
  });

  // Generate AI insights for a game session
  app.post("/api/game-sessions/:sessionId/ai-insights", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const isConfigured = await isOpenAIConfigured();
      if (!isConfigured) {
        return res.status(400).json({ error: "AI API не налаштовано. Зверніться до адміністратора." });
      }

      const { sessionId } = req.params;
      const startTime = Date.now();
      
      // Get game session to find brand info
      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }
      
      // Get brand data if available
      let brandData: { name: string; description?: string } | undefined;
      if (gameSession.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandData = { 
            name: brand.name, 
            description: brand.description || undefined 
          };
        }
      }
      
      const responses = await storage.getSessionCardResponses(sessionId);
      
      if (!responses || responses.length === 0) {
        return res.status(400).json({ error: "Немає відповідей для аналізу" });
      }

      // Format responses with full structure (use cardDescription as question)
      const formattedResponses = responses.map(r => ({
        level: r.level,
        cardTitle: r.cardTitle,
        question: r.cardDescription || undefined,
        response: r.response
      }));

      console.log("AI Analysis Request:", {
        sessionId,
        brandName: brandData?.name,
        responsesCount: formattedResponses.length,
        levels: Array.from(new Set(formattedResponses.map(r => r.level)))
      });

      const insights = await generateBrandInsights(formattedResponses, brandData);
      const generationTimeMs = Date.now() - startTime;

      // Save analysis to database if brand exists
      if (gameSession.brandId) {
        try {
          // Extract key metrics for storage
          const levelStrengths: string[] = [];
          const levelWeaknesses: string[] = [];
          const levelRecommendations: string[] = [];
          
          if (insights.levels) {
            insights.levels.forEach((level: any) => {
              if (level.strengths) levelStrengths.push(...level.strengths);
              if (level.weaknesses) levelWeaknesses.push(...level.weaknesses);
              if (level.recommendations) levelRecommendations.push(...level.recommendations);
            });
          }

          await storage.createBrandAiAnalysis({
            brandId: gameSession.brandId,
            userId: currentUser.id,
            analysisType: 'full',
            content: insights,
            score: insights.overallScore || null,
            insights: insights.nextSteps || null,
            recommendations: levelRecommendations.length > 0 ? levelRecommendations : null,
            strengths: levelStrengths.length > 0 ? levelStrengths : null,
            weaknesses: levelWeaknesses.length > 0 ? levelWeaknesses : null,
            provider: 'openai',
            model: 'gpt-4o',
            tokensUsed: null,
            generationTimeMs,
          });
          console.log("AI Analysis saved to database for brand:", gameSession.brandId);
        } catch (saveError) {
          console.error("Failed to save AI analysis to database:", saveError);
          // Continue - we still want to return the insights even if saving failed
        }
      }

      res.json(insights);
    } catch (error: any) {
      console.error("AI Insights error:", error);
      res.status(500).json({ error: error.message || "Помилка генерації AI-аналізу" });
    }
  });

  // Generate AI insights for a specific level
  app.post("/api/game-sessions/:sessionId/ai-insights/:level", requireAuth, async (req, res) => {
    try {
      const isConfigured = await isOpenAIConfigured();
      if (!isConfigured) {
        return res.status(400).json({ error: "AI API не налаштовано" });
      }

      const { sessionId, level } = req.params;
      if (!["soul", "mind", "body"].includes(level)) {
        return res.status(400).json({ error: "Невірний рівень" });
      }

      // Get game session to find brand info
      const gameSession = await storage.getGameSession(sessionId);
      let brandData: { name: string; description?: string } | undefined;
      if (gameSession?.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandData = { name: brand.name, description: brand.description || undefined };
        }
      }

      const responses = await storage.getSessionCardResponses(sessionId);
      const levelResponses = responses.filter(r => r.level === level);
      
      if (levelResponses.length === 0) {
        return res.status(400).json({ error: "Немає відповідей для цього рівня" });
      }

      const insight = await analyzeBrandLevel(
        level as "soul" | "mind" | "body",
        levelResponses.map(r => ({ cardTitle: r.cardTitle, question: r.cardDescription, response: r.response })),
        brandData
      );
      res.json(insight);
    } catch (error: any) {
      console.error("Level AI Insights error:", error);
      res.status(500).json({ error: error.message || "Помилка аналізу рівня" });
    }
  });

  // AI Assist - Generate card response
  app.post("/api/ai/assist", requireAuth, async (req, res) => {
    try {
      const isConfigured = await isAIConfigured();
      if (!isConfigured) {
        return res.status(400).json({ error: "AI API не налаштовано. Зверніться до адміністратора." });
      }

      const { cardTitle, cardDescription, currentText, minLength, maxLength, brandName, previousResponses } = req.body;

      if (!cardTitle || !cardDescription) {
        return res.status(400).json({ error: "Необхідно вказати назву та опис картки" });
      }

      const result = await generateCardResponse({
        cardTitle,
        cardDescription,
        currentText: currentText || "",
        minLength: minLength || 50,
        maxLength: maxLength || 500,
        brandName,
        previousResponses
      });

      res.json(result);
    } catch (error: any) {
      console.error("AI Assist error:", error);
      res.status(500).json({ error: error.message || "Помилка генерації тексту" });
    }
  });

  // AI Chat - Get chat history for a game session
  app.get("/api/game-sessions/:sessionId/chat", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      const messages = await storage.getAiChatMessages(sessionId);
      res.json(messages);
    } catch (error: any) {
      console.error("Get chat history error:", error);
      res.status(500).json({ error: "Не вдалося отримати історію чату" });
    }
  });

  // AI Chat - Send message
  app.post("/api/game-sessions/:sessionId/chat", requireAuth, async (req, res) => {
    try {
      const isConfigured = await isOpenAIConfigured();
      if (!isConfigured) {
        return res.status(400).json({ error: "AI API не налаштовано. Зверніться до адміністратора." });
      }

      const { sessionId } = req.params;
      const { message, agentId, productId, audienceId, imageUrls } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Повідомлення обов'язкове" });
      }
      
      // Validate imageUrls if provided (accepts both http URLs and base64 data URLs)
      const validImageUrls: string[] = [];
      if (imageUrls && Array.isArray(imageUrls)) {
        for (const url of imageUrls) {
          if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image/'))) {
            validImageUrls.push(url);
          }
        }
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      // Get agent if provided
      let agentContext: { name: string; context: string; personality?: string; expertise?: string[]; language?: string } | undefined;
      let agentName: string | undefined;
      if (agentId) {
        const agent = await storage.getUserAgent(agentId);
        if (agent && agent.userId === userId && agent.isActive) {
          agentContext = {
            name: agent.name,
            context: agent.context,
            personality: agent.personality || undefined,
            expertise: agent.expertise || undefined,
            language: agent.language || undefined,
          };
          agentName = agent.name;
        }
      }

      // Get brand info
      let brandName = "Бренд";
      let brandDescription: string | undefined;
      if (gameSession.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandName = brand.name;
          brandDescription = brand.description || undefined;
        }
      }

      // Get card responses for context
      const responses = await storage.getSessionCardResponses(sessionId);
      const formattedResponses = responses.map(r => ({
        level: r.level,
        cardTitle: r.cardTitle,
        question: r.cardDescription || undefined,
        response: r.response
      }));

      // Get chat history (filter out image messages - OpenAI doesn't support role='image')
      const existingMessages = await storage.getAiChatMessages(sessionId);
      const chatHistory = existingMessages
        .filter(m => m.role !== 'image')
        .map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content
        }));

      // Save user message with agent info and image URLs
      await storage.addAiChatMessage({
        sessionId,
        userId,
        role: "user",
        content: message,
        agentId: agentId || null,
        agentName: agentName || null,
        metadata: validImageUrls.length > 0 ? { imageUrls: validImageUrls } : null,
      });

      // Get product context if specified
      let productContext: { name: string; shortDescription?: string; fullDescription?: string; category?: string; subcategory?: string; price?: string; currency?: string; targetAudience?: string; features?: string[]; benefits?: string[]; useCases?: string[]; keywords?: string[] } | undefined;
      if (productId && gameSession.brandId) {
        const product = await storage.getBrandProduct(productId);
        if (product && product.brandId === gameSession.brandId) {
          productContext = {
            name: product.name,
            shortDescription: product.shortDescription || undefined,
            fullDescription: product.fullDescription || undefined,
            category: product.category || undefined,
            subcategory: product.subcategory || undefined,
            price: product.price || undefined,
            currency: product.currency || undefined,
            targetAudience: product.targetAudience || undefined,
            features: (product.features as string[]) || undefined,
            benefits: (product.benefits as string[]) || undefined,
            useCases: (product.useCases as string[]) || undefined,
            keywords: (product.keywords as string[]) || undefined,
          };
          console.log('Chat using product context:', product.name);
        }
      }

      // Get audience context if specified (with segments)
      let audienceCtx: { name: string; description?: string; ageRange?: string; gender?: string; location?: string; income?: string; education?: string; occupation?: string; values?: string[]; interests?: string[]; painPoints?: string[]; goals?: string[]; motivations?: string[]; fears?: string[]; buyingBehavior?: string; brandInteraction?: string; aiPortrait?: string; segments?: any[] } | undefined;
      if (audienceId && gameSession.brandId) {
        const audience = await storage.getTargetAudience(audienceId);
        if (audience && audience.brandId === gameSession.brandId) {
          const segments = await storage.getAudienceSegments(audienceId);
          audienceCtx = {
            name: audience.name,
            description: audience.description || undefined,
            ageRange: audience.ageRange || undefined,
            gender: audience.gender || undefined,
            location: audience.location || undefined,
            income: audience.income || undefined,
            education: audience.education || undefined,
            occupation: audience.occupation || undefined,
            values: (audience.values as string[]) || undefined,
            interests: (audience.interests as string[]) || undefined,
            painPoints: (audience.painPoints as string[]) || undefined,
            goals: (audience.goals as string[]) || undefined,
            motivations: (audience.motivations as string[]) || undefined,
            fears: (audience.fears as string[]) || undefined,
            buyingBehavior: audience.buyingBehavior || undefined,
            brandInteraction: audience.brandInteraction || undefined,
            aiPortrait: audience.aiPortrait || undefined,
            segments: segments.map(s => ({
              name: s.name,
              description: s.description || undefined,
              personaName: s.personaName || undefined,
              personaAge: s.personaAge || undefined,
              personaJob: s.personaJob || undefined,
              personaStory: s.personaStory || undefined,
              personaQuote: s.personaQuote || undefined,
              characteristics: (s.characteristics as string[]) || undefined,
              specificNeeds: (s.specificNeeds as string[]) || undefined,
              communicationStyle: s.communicationStyle || undefined,
            })),
          };
          console.log('Chat using audience context:', audience.name, `with ${segments.length} segments`);
        }
      }

      // Get AI response with images
      const aiResponse = await sendBrandChatMessage(
        message,
        chatHistory,
        {
          brandName,
          brandDescription,
          responses: formattedResponses,
          agentContext,
          productContext,
          audienceContext: audienceCtx,
        },
        sessionId,
        validImageUrls.length > 0 ? validImageUrls : undefined
      );

      // Save AI response with agent info
      const savedMessage = await storage.addAiChatMessage({
        sessionId,
        userId,
        role: "assistant",
        content: aiResponse.response,
        metadata: aiResponse.tokensUsed ? { tokens: aiResponse.tokensUsed } : null,
        agentId: agentId || null,
        agentName: agentName || null,
      });

      res.json({
        message: savedMessage,
        tokensUsed: aiResponse.tokensUsed
      });
    } catch (error: any) {
      console.error("AI Chat error:", error);
      res.status(500).json({ error: error.message || "Помилка AI чату" });
    }
  });

  // AI Chat - Delete chat history
  app.delete("/api/game-sessions/:sessionId/chat", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      await storage.deleteAiChatMessages(sessionId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete chat error:", error);
      res.status(500).json({ error: "Не вдалося видалити історію чату" });
    }
  });

  // User Settings API
  app.get("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const profile = await storage.getUserProfile(userId);
      
      res.json({
        hasGeminiApiKey: !!profile?.geminiApiKey,
        maskedApiKey: profile?.geminiApiKey ? 
          (await import('./encryption')).maskApiKey(
            (await import('./encryption')).decryptApiKey(profile.geminiApiKey) || ''
          ) : undefined
      });
    } catch (error: any) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Не вдалося отримати налаштування" });
    }
  });

  app.post("/api/user/settings/gemini-api-key", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: "API ключ обов'язковий" });
      }

      const { encryptApiKey } = await import('./encryption');
      const encryptedKey = encryptApiKey(apiKey);

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId, geminiApiKey: encryptedKey } as any);
      } else {
        profile = await storage.updateUserProfile(userId, { geminiApiKey: encryptedKey });
      }

      res.json({ success: true, message: "API ключ збережено" });
    } catch (error: any) {
      console.error("Save API key error:", error);
      res.status(500).json({ error: "Не вдалося зберегти API ключ" });
    }
  });

  app.delete("/api/user/settings/gemini-api-key", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      await storage.updateUserProfile(userId, { geminiApiKey: null });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete API key error:", error);
      res.status(500).json({ error: "Не вдалося видалити API ключ" });
    }
  });

  // User Profile endpoints
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId } as any);
      }

      // Don't expose API key
      const { geminiApiKey, ...safeProfile } = profile;
      res.json({ ...safeProfile, hasApiKey: !!geminiApiKey });
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Не вдалося отримати профіль" });
    }
  });

  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { firstName, lastName, bio, company, position, industry, employeeCount, website } = req.body;

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ 
          userId, firstName, lastName, bio, company, position, industry, employeeCount, website 
        } as any);
      } else {
        profile = await storage.updateUserProfile(userId, { 
          firstName, lastName, bio, company, position, industry, employeeCount, website 
        });
      }

      res.json(profile);
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Не вдалося оновити профіль" });
    }
  });

  app.post("/api/user/avatar", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { imageData } = req.body;
      if (!imageData || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ error: "Невірний формат зображення" });
      }

      // Check quota before upload
      const base64Data = imageData.split(',')[1] || imageData;
      const estimatedSize = Math.ceil(base64Data.length * 0.75);
      const hasQuota = await storage.checkQuotaAvailable(userId, estimatedSize);
      if (!hasQuota) {
        return res.status(400).json({ error: "Досягнуто ліміт зберігання" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
      // Upload avatar to object storage using new media system
      const uploadResult = await objectStorageService.uploadMediaAsset({
        userId,
        assetType: 'avatar',
        base64Data: imageData
      });

      // Create media asset record
      await storage.createMediaAsset({
        userId,
        brandId: null,
        assetType: 'avatar',
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        filename: 'avatar',
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        altText: 'User avatar',
      });

      // Update profile
      await storage.updateUserProfile(userId, { avatarUrl: uploadResult.publicUrl });

      res.json({ avatarUrl: uploadResult.publicUrl });
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      res.status(500).json({ error: error.message || "Не вдалося завантажити аватар" });
    }
  });

  app.post("/api/user/onboarding/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { firstName, lastName, company, position, industry, employeeCount, skipped } = req.body;

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ 
          userId, 
          firstName, 
          lastName, 
          company, 
          position, 
          industry, 
          employeeCount,
          onboardingCompleted: !skipped,
          onboardingSkipped: !!skipped
        } as any);
      } else {
        profile = await storage.updateUserProfile(userId, { 
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(company && { company }),
          ...(position && { position }),
          ...(industry && { industry }),
          ...(employeeCount && { employeeCount }),
          onboardingCompleted: !skipped,
          onboardingSkipped: !!skipped
        });
      }

      // Award XP for completing onboarding
      if (!skipped) {
        await storage.updateUserProfile(userId, { 
          totalXp: (profile?.totalXp || 0) + 50 
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Complete onboarding error:", error);
      res.status(500).json({ error: "Не вдалося завершити онбординг" });
    }
  });

  // NanoBanana Image Generation
  app.post("/api/game-sessions/:sessionId/generate-image", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { prompt, aspectRatio = '1:1', logoUrl, templateId, merchTypeId, referenceUrls, usePro = false, agentId, productId, audienceId } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      // Get agent context if specified
      let agentContext = '';
      if (agentId) {
        const agent = await storage.getUserAgent(agentId);
        if (agent && agent.userId === userId) {
          agentContext = agent.context || '';
          console.log('Image generation using agent context:', agent.name, agentContext?.substring(0, 100));
        }
      }

      // Get template if specified
      let templatePrompt = '';
      let templateReferenceUrl = '';
      if (templateId) {
        const template = await storage.getGenerationTemplate(templateId);
        if (template && template.isActive) {
          templatePrompt = template.prompt;
          templateReferenceUrl = template.referenceImageUrl || '';
        }
      }

      // Get merch type if specified
      let merchTypePrompt = '';
      if (merchTypeId) {
        const merchType = await storage.getMerchType(merchTypeId);
        if (merchType && merchType.isActive) {
          merchTypePrompt = merchType.prompt;
        }
      }

      // Either prompt, template, or merch type is required
      if (!prompt && !templatePrompt && !merchTypePrompt) {
        return res.status(400).json({ error: "Виберіть тип мерчу, шаблон або введіть опис зображення" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile?.geminiApiKey) {
        return res.status(400).json({ 
          error: "API ключ не налаштовано. Додайте NanoBanana API ключ у налаштуваннях." 
        });
      }

      // Get brand context
      let brandContext = '';
      if (gameSession.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandContext = `Brand: ${brand.name}. ${brand.description || ''}`;
        }
      }

      // Get product context if specified (verify it belongs to the same brand)
      let productContext = '';
      if (productId && gameSession.brandId) {
        const product = await storage.getBrandProduct(productId);
        if (product && product.brandId === gameSession.brandId) {
          productContext = `Product: ${product.name}`;
          if (product.shortDescription) productContext += `. ${product.shortDescription}`;
          if (product.category) productContext += `. Category: ${product.category}`;
          if (product.targetAudience) productContext += `. Target audience: ${product.targetAudience}`;
          console.log('Image generation using product context:', product.name);
        }
      }

      // Get audience context if specified (verify it belongs to the same brand)
      let audienceContext = '';
      if (audienceId && gameSession.brandId) {
        const audience = await storage.getTargetAudience(audienceId);
        if (audience && audience.brandId === gameSession.brandId) {
          audienceContext = `Target audience: ${audience.name}`;
          if (audience.description) audienceContext += `. ${audience.description}`;
          if (audience.ageRange) audienceContext += `. Age: ${audience.ageRange}`;
          if (audience.gender && audience.gender !== 'all') audienceContext += `. Gender: ${audience.gender}`;
          const values = audience.values as string[] | null;
          if (values && values.length > 0) audienceContext += `. Values: ${values.join(', ')}`;
          const interests = audience.interests as string[] | null;
          if (interests && interests.length > 0) audienceContext += `. Interests: ${interests.join(', ')}`;
          console.log('Image generation using audience context:', audience.name);
        }
      }

      // Combine prompts: merch type (primary) + template + user prompt (which includes style)
      let finalPrompt = merchTypePrompt || templatePrompt || prompt || '';
      if (merchTypePrompt && prompt) {
        // Append user's style/instructions to merch prompt
        finalPrompt = `${merchTypePrompt}. Style: ${prompt}`;
      } else if (templatePrompt && prompt) {
        // Append user's style/instructions to template prompt
        finalPrompt = `${templatePrompt}. Style: ${prompt}`;
      }
      
      // Add agent context as additional style/design instructions
      if (agentContext) {
        finalPrompt = `${finalPrompt}\n\nDesign context and style requirements:\n${agentContext}`;
        console.log('Final prompt with agent context:', finalPrompt.substring(0, 200));
      }
      
      // Add product context
      if (productContext) {
        finalPrompt = `${finalPrompt}\n\n${productContext}`;
        console.log('Added product context to prompt');
      }
      
      // Add audience context
      if (audienceContext) {
        finalPrompt = `${finalPrompt}\n\n${audienceContext}`;
        console.log('Added audience context to prompt');
      }

      // Combine template reference and user-uploaded references
      const referenceUrl = templateReferenceUrl || (referenceUrls && referenceUrls.length > 0 ? referenceUrls[0] : undefined);
      
      // If logoUrl is base64, upload it to object storage first to get a public URL
      let processedLogoUrl = logoUrl;
      if (logoUrl && logoUrl.startsWith('data:')) {
        try {
          console.log('Logo is base64, uploading to object storage first...');
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorageService = new ObjectStorageService();
          const uploadResult = await objectStorageService.uploadMediaAsset({
            userId,
            assetType: 'logo',
            brandId: gameSession.brandId || undefined,
            base64Data: logoUrl
          });
          processedLogoUrl = uploadResult.publicUrl;
          console.log('Logo uploaded for generation, URL:', processedLogoUrl);
        } catch (uploadError) {
          console.error('Failed to upload base64 logo for generation:', uploadError);
          return res.status(400).json({ 
            error: "Не вдалося підготувати лого для генерації. Спробуйте завантажити лого ще раз." 
          });
        }
      }
      
      const { generateImageWithNanoBanana } = await import('./nanobanana');
      const result = await generateImageWithNanoBanana(profile.geminiApiKey, finalPrompt, brandContext, aspectRatio, sessionId, userId, processedLogoUrl, referenceUrl, usePro);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Save image message to database
      const imageUrl = result.imageUrl || result.imageBase64;
      if (imageUrl) {
        // Use user prompt, or description based on merch type/template
        const messageContent = prompt || 
          (merchTypeId ? `Generated ${merchTypePrompt.substring(0, 50)}...` : '') ||
          (templateId ? `Template generation` : 'Image generated');
        await storage.saveChatMessage(sessionId, userId, 'image', messageContent, imageUrl);
        
        // Automatically save to media library
        try {
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorageService = new ObjectStorageService();
          
          let uploadResult;
          if (result.imageBase64) {
            // Upload base64 directly
            const estimatedSize = Math.ceil(result.imageBase64.length * 0.75);
            const hasQuota = await storage.checkQuotaAvailable(userId, estimatedSize);
            if (hasQuota) {
              uploadResult = await objectStorageService.uploadMediaAsset({
                userId,
                assetType: 'merch',
                brandId: gameSession.brandId || undefined,
                base64Data: result.imageBase64
              });
            }
          } else if (result.imageUrl && !result.imageUrl.startsWith('data:')) {
            // Download from URL and upload
            const response = await fetch(result.imageUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const base64 = Buffer.from(buffer).toString('base64');
              const mimeType = response.headers.get('content-type') || 'image/png';
              const fullBase64 = `data:${mimeType};base64,${base64}`;
              
              const estimatedSize = buffer.byteLength;
              const hasQuota = await storage.checkQuotaAvailable(userId, estimatedSize);
              if (hasQuota) {
                uploadResult = await objectStorageService.uploadMediaAsset({
                  userId,
                  assetType: 'merch',
                  brandId: gameSession.brandId || undefined,
                  base64Data: fullBase64
                });
              }
            }
          }
          
          if (uploadResult) {
            await storage.createMediaAsset({
              userId,
              brandId: gameSession.brandId || null,
              assetType: 'merch',
              storageKey: uploadResult.storageKey,
              publicUrl: uploadResult.publicUrl,
              filename: messageContent.substring(0, 100) || `Generated-${Date.now()}`,
              mimeType: uploadResult.mimeType,
              sizeBytes: uploadResult.sizeBytes,
              altText: messageContent.substring(0, 200) || 'Generated image',
            });
            console.log('Generated image saved to media library:', uploadResult.publicUrl);
          }
        } catch (mediaError) {
          console.warn('Failed to auto-save generated image to media library:', mediaError);
          // Don't fail the request, just log the warning
        }
      }

      res.json({ 
        success: true, 
        imageBase64: result.imageBase64,
        imageUrl: result.imageUrl
      });
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Не вдалося згенерувати зображення" });
    }
  });

  // OpenAI DALL-E Image Generation
  app.post("/api/game-sessions/:sessionId/generate-dalle", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      if (!prompt) {
        return res.status(400).json({ error: "Введіть опис зображення" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      // Get brand context for enhanced prompts
      let brandContext = '';
      if (gameSession.brandId) {
        const brand = await storage.getUserBrand(gameSession.brandId);
        if (brand) {
          brandContext = `For brand "${brand.name}". ${brand.description || ''}`;
        }
      }

      const finalPrompt = brandContext ? `${prompt}. ${brandContext}` : prompt;

      const { generateImageWithDALLE } = await import('./openai');
      const result = await generateImageWithDALLE(finalPrompt, size, quality, style);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Save image message to database
      if (result.imageUrl) {
        await storage.saveChatMessage(sessionId, userId, 'image', prompt, result.imageUrl);
        
        // Automatically save to media library
        try {
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorageService = new ObjectStorageService();
          
          // Download from URL and upload
          const response = await fetch(result.imageUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/png';
            const fullBase64 = `data:${mimeType};base64,${base64}`;
            
            const estimatedSize = buffer.byteLength;
            const hasQuota = await storage.checkQuotaAvailable(userId, estimatedSize);
            if (hasQuota) {
              const uploadResult = await objectStorageService.uploadMediaAsset({
                userId,
                assetType: 'merch',
                brandId: gameSession.brandId || undefined,
                base64Data: fullBase64
              });
              
              await storage.createMediaAsset({
                userId,
                brandId: gameSession.brandId || null,
                assetType: 'merch',
                storageKey: uploadResult.storageKey,
                publicUrl: uploadResult.publicUrl,
                filename: prompt.substring(0, 100) || `DALLE-${Date.now()}`,
                mimeType: uploadResult.mimeType,
                sizeBytes: uploadResult.sizeBytes,
                altText: prompt.substring(0, 200) || 'DALL-E generated image',
              });
              console.log('DALL-E image saved to media library:', uploadResult.publicUrl);
            }
          }
        } catch (mediaError) {
          console.warn('Failed to auto-save DALL-E image to media library:', mediaError);
        }
      }

      res.json({ 
        success: true, 
        imageUrl: result.imageUrl
      });
    } catch (error: any) {
      console.error("DALL-E generation error:", error);
      res.status(500).json({ error: "Не вдалося згенерувати зображення" });
    }
  });

  // Upload reference image for chat
  app.post("/api/game-sessions/:sessionId/upload-reference", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { imageData, filename } = req.body;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      if (!imageData || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ error: "Невірний формат зображення" });
      }

      const gameSession = await storage.getGameSession(sessionId);
      if (!gameSession) {
        return res.status(404).json({ error: "Гру не знайдено" });
      }

      if (gameSession.userId !== userId) {
        return res.status(403).json({ error: "Немає доступу до цієї гри" });
      }

      // Check quota before upload
      const base64Data = imageData.split(',')[1] || imageData;
      const estimatedSize = Math.ceil(base64Data.length * 0.75);
      const hasQuota = await storage.checkQuotaAvailable(userId, estimatedSize);
      if (!hasQuota) {
        return res.status(400).json({ error: "Досягнуто ліміт зберігання" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();

      const uploadResult = await objectStorageService.uploadMediaAsset({
        userId,
        assetType: 'attachment',
        brandId: gameSession.brandId || undefined,
        base64Data: imageData
      });

      // Create media asset record
      const mediaAsset = await storage.createMediaAsset({
        userId,
        brandId: gameSession.brandId || null,
        assetType: 'attachment',
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        filename: filename || `reference-${Date.now()}`,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        altText: 'Reference image for chat',
      });

      res.json({
        success: true,
        url: uploadResult.publicUrl,
        assetId: mediaAsset.id
      });
    } catch (error: any) {
      console.error("Reference upload error:", error);
      res.status(500).json({ error: "Не вдалося завантажити зображення" });
    }
  });

  // ============= Media Assets API =============

  // Upload media asset
  app.post("/api/media/upload", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { base64Data, assetType, brandId, altText, filename } = req.body;

      if (!base64Data || !assetType) {
        return res.status(400).json({ error: "Необхідні base64Data та assetType" });
      }

      // Validate asset type
      const validTypes = ['logo', 'avatar', 'chat_user', 'chat_ai', 'merch', 'attachment'];
      if (!validTypes.includes(assetType)) {
        return res.status(400).json({ error: "Некоректний тип медіа" });
      }

      // Check size limit (~5MB in base64)
      if (base64Data.length > 7000000) {
        return res.status(400).json({ error: "Файл занадто великий (макс. 5MB)" });
      }

      // Check quota
      const estimatedSize = Math.ceil(base64Data.length * 0.75); // Approx decoded size
      const hasQuota = await storage.checkQuotaAvailable(currentUser.id, estimatedSize);
      if (!hasQuota) {
        return res.status(400).json({ error: "Досягнуто ліміт зберігання. Видаліть деякі файли або зверніться до адміністратора." });
      }

      // Upload to object storage
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadResult = await objectStorageService.uploadMediaAsset({
        userId: currentUser.id,
        assetType: assetType as 'logo' | 'avatar' | 'chat_user' | 'chat_ai' | 'merch' | 'attachment',
        brandId,
        base64Data
      });

      // Save to database
      const mediaAsset = await storage.createMediaAsset({
        userId: currentUser.id,
        brandId: brandId || null,
        assetType,
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        filename: filename || null,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        altText: altText || null,
      });

      res.json(mediaAsset);
    } catch (error: any) {
      console.error("Media upload error:", error);
      res.status(500).json({ error: "Не вдалося завантажити медіа" });
    }
  });

  // Get user's media assets
  app.get("/api/media", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const assetType = req.query.type as string | undefined;
      const assets = await storage.getUserMediaAssets(currentUser.id, assetType);
      res.json(assets);
    } catch (error: any) {
      console.error("Get media error:", error);
      res.status(500).json({ error: "Не вдалося отримати медіа" });
    }
  });

  // Get user's media quota
  app.get("/api/media/quota", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      let quota = await storage.getUserMediaQuota(currentUser.id);
      if (!quota) {
        quota = await storage.createOrUpdateUserMediaQuota(currentUser.id, {});
      }

      res.json({
        ...quota,
        usedPercentBytes: Math.round((quota.usedBytes / quota.maxTotalBytes) * 100),
        usedPercentFiles: Math.round((quota.usedFiles / quota.maxFiles) * 100),
      });
    } catch (error: any) {
      console.error("Get quota error:", error);
      res.status(500).json({ error: "Не вдалося отримати квоту" });
    }
  });

  // Delete media asset
  app.delete("/api/media/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { id } = req.params;
      
      // Verify ownership
      const asset = await storage.getMediaAsset(id);
      if (!asset) {
        return res.status(404).json({ error: "Медіа не знайдено" });
      }
      if (asset.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteMediaAsset(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete media error:", error);
      res.status(500).json({ error: "Не вдалося видалити медіа" });
    }
  });

  // Get brand's media assets
  app.get("/api/brands/:brandId/media", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { brandId } = req.params;
      
      // Verify brand ownership
      const brand = await storage.getUserBrand(brandId);
      if (!brand) {
        return res.status(404).json({ error: "Бренд не знайдено" });
      }
      if (brand.userId !== currentUser.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      const assets = await storage.getBrandMediaAssets(brandId);
      res.json(assets);
    } catch (error: any) {
      console.error("Get brand media error:", error);
      res.status(500).json({ error: "Не вдалося отримати медіа бренду" });
    }
  });

  // Save chat image to user's media library
  app.post("/api/media/save-chat-image", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { imageUrl, imageBase64, brandId, altText } = req.body;

      if (!imageUrl && !imageBase64) {
        return res.status(400).json({ error: "Необхідне imageUrl або imageBase64" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();

      let uploadResult;

      if (imageBase64) {
        // Direct base64 upload
        const estimatedSize = Math.ceil(imageBase64.length * 0.75);
        const hasQuota = await storage.checkQuotaAvailable(currentUser.id, estimatedSize);
        if (!hasQuota) {
          return res.status(400).json({ error: "Досягнуто ліміт зберігання" });
        }

        uploadResult = await objectStorageService.uploadMediaAsset({
          userId: currentUser.id,
          assetType: 'merch',
          brandId,
          base64Data: imageBase64
        });
      } else if (imageUrl.startsWith('data:image/')) {
        // Base64 data URL
        const base64Data = imageUrl.split(',')[1] || imageUrl;
        const estimatedSize = Math.ceil(base64Data.length * 0.75);
        const hasQuota = await storage.checkQuotaAvailable(currentUser.id, estimatedSize);
        if (!hasQuota) {
          return res.status(400).json({ error: "Досягнуто ліміт зберігання" });
        }

        uploadResult = await objectStorageService.uploadMediaAsset({
          userId: currentUser.id,
          assetType: 'merch',
          brandId,
          base64Data: imageUrl
        });
      } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // External URL - fetch and convert to base64
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) {
            return res.status(400).json({ error: "Не вдалося завантажити зображення за URL" });
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const contentType = response.headers.get('content-type') || 'image/png';
          const fullBase64 = `data:${contentType};base64,${base64Data}`;
          
          const estimatedSize = buffer.length;
          const hasQuota = await storage.checkQuotaAvailable(currentUser.id, estimatedSize);
          if (!hasQuota) {
            return res.status(400).json({ error: "Досягнуто ліміт зберігання" });
          }

          uploadResult = await objectStorageService.uploadMediaAsset({
            userId: currentUser.id,
            assetType: 'merch',
            brandId,
            base64Data: fullBase64
          });
        } catch (fetchError) {
          console.error("Error fetching image URL:", fetchError);
          return res.status(400).json({ error: "Не вдалося завантажити зображення за URL" });
        }
      } else {
        return res.status(400).json({ error: "Невірний формат URL зображення" });
      }

      // Create media asset record
      const mediaAsset = await storage.createMediaAsset({
        userId: currentUser.id,
        brandId: brandId || null,
        assetType: 'merch',
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        filename: `chat-image-${Date.now()}`,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        altText: altText || 'Chat generated image',
      });

      res.json(mediaAsset);
    } catch (error: any) {
      console.error("Save chat image error:", error);
      res.status(500).json({ error: "Не вдалося зберегти зображення" });
    }
  });

  // ============= Subscription Plans API =============

  // Get all subscription plans (public)
  app.get("/api/subscriptions/plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans(true);
      res.json(plans);
    } catch (error: any) {
      console.error("Get plans error:", error);
      res.status(500).json({ error: "Не вдалося отримати тарифи" });
    }
  });

  // Get current user's subscription
  app.get("/api/subscriptions/current", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const subWithPlan = await storage.getUserSubscriptionWithPlan(currentUser.id);
      res.json(subWithPlan || null);
    } catch (error: any) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Не вдалося отримати підписку" });
    }
  });

  // Get user subscription with analysis usage count
  app.get("/api/user/subscription-with-usage", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const subWithPlan = await storage.getUserSubscriptionWithPlan(currentUser.id);
      
      // Get user's analysis count (completed + processing to match quota enforcement)
      const analyses = await storage.getExternalBrandAnalyses(currentUser.id);
      const analysisUsed = analyses.filter(a => 
        a.status === 'completed' || a.status === 'processing'
      ).length;

      if (subWithPlan) {
        res.json({
          plan: subWithPlan.plan,
          subscription: subWithPlan.subscription,
          analysisUsed
        });
      } else {
        // Return default free plan if no subscription
        const plans = await storage.getSubscriptionPlans(true);
        const freePlan = plans.find(p => p.name === 'free');
        res.json({
          plan: freePlan || { name: 'free', analysisQuota: 1 },
          subscription: null,
          analysisUsed
        });
      }
    } catch (error: any) {
      console.error("Get subscription with usage error:", error);
      res.status(500).json({ error: "Не вдалося отримати підписку" });
    }
  });

  // Get user's quotas
  app.get("/api/subscriptions/quotas", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const quotas = await storage.getUserQuotas(currentUser.id);
      res.json(quotas);
    } catch (error: any) {
      console.error("Get quotas error:", error);
      res.status(500).json({ error: "Не вдалося отримати квоти" });
    }
  });

  // Mock checkout - simulate payment
  app.post("/api/subscriptions/checkout", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { planId, billingPeriod } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: "Необхідно вказати planId" });
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan || !plan.isActive) {
        return res.status(404).json({ error: "Тариф не знайдено" });
      }

      // Calculate price
      const period = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
      const price = period === 'yearly' ? plan.priceYearly : plan.priceMonthly;

      // Calculate expiration date
      let expiresAt: Date | null = null;
      let nextPaymentAt: Date | null = null;
      if (price > 0) {
        expiresAt = new Date();
        if (period === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        nextPaymentAt = expiresAt;
      }

      // Create subscription
      const subscription = await storage.createUserSubscription({
        userId: currentUser.id,
        planId: plan.id,
        billingPeriod: period,
        status: 'active',
        expiresAt,
        nextPaymentAt,
        paymentMethod: 'mock',
        lastPaymentAt: new Date(),
      });

      // Log mock payment
      if (price > 0) {
        await storage.createPaymentHistory({
          userId: currentUser.id,
          subscriptionId: subscription.id,
          planId: plan.id,
          amount: price,
          currency: plan.currency,
          status: 'completed',
          paymentMethod: 'mock',
          description: `Mock payment for ${plan.displayName} (${period})`,
        });
      }

      res.json({
        success: true,
        subscription,
        plan,
        message: price > 0 
          ? `Успішно оформлено підписку "${plan.displayName}" (mock-оплата)` 
          : `Активовано безкоштовний тариф "${plan.displayName}"`
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: "Не вдалося оформити підписку" });
    }
  });

  // Cancel subscription
  app.post("/api/subscriptions/cancel", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      // Get current subscription to cancel Monobank subscription if exists
      const currentSubscription = await storage.getUserSubscription(currentUser.id);
      
      // Cancel Monobank subscription if active
      const monoToken = process.env.MONOBANK_TOKEN;
      if (currentSubscription?.monoSubscriptionId && monoToken) {
        try {
          const { MonobankService } = await import("./monobank");
          const monobank = new MonobankService(monoToken);
          await monobank.cancelSubscription(currentSubscription.monoSubscriptionId);
          console.log('Cancelled Monobank subscription:', currentSubscription.monoSubscriptionId);
        } catch (monoError) {
          console.error('Error cancelling Monobank subscription:', monoError);
        }
      }

      const subscription = await storage.cancelUserSubscription(currentUser.id);
      
      // Switch to free plan
      const defaultPlan = await storage.getDefaultSubscriptionPlan();
      if (defaultPlan) {
        await storage.createUserSubscription({
          userId: currentUser.id,
          planId: defaultPlan.id,
          billingPeriod: 'monthly',
          status: 'active',
        });
      }

      res.json({
        success: true,
        message: "Підписку скасовано. Ви переведені на безкоштовний тариф."
      });
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Не вдалося скасувати підписку" });
    }
  });

  // Get payment history
  app.get("/api/subscriptions/payments", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const payments = await storage.getUserPaymentHistory(currentUser.id);
      res.json(payments);
    } catch (error: any) {
      console.error("Get payments error:", error);
      res.status(500).json({ error: "Не вдалося отримати історію платежів" });
    }
  });

  // ============= User Agents API =============
  
  // Get all user agents
  app.get("/api/agents", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      // Check if user has paid subscription
      const subscription = await storage.getUserSubscription(currentUser.id);
      if (!subscription || subscription.planId === 1) { // Free tier
        return res.status(403).json({ error: "Агенти доступні тільки для платних підписок" });
      }

      const agents = await storage.getUserAgents(currentUser.id);
      res.json(agents);
    } catch (error: any) {
      console.error("Get agents error:", error);
      res.status(500).json({ error: "Не вдалося отримати агентів" });
    }
  });

  // Get single agent
  app.get("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const agent = await storage.getUserAgent(req.params.id);
      if (!agent || agent.userId !== currentUser.id) {
        return res.status(404).json({ error: "Агента не знайдено" });
      }

      res.json(agent);
    } catch (error: any) {
      console.error("Get agent error:", error);
      res.status(500).json({ error: "Не вдалося отримати агента" });
    }
  });

  // Create agent
  app.post("/api/agents", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      // Check if user has paid subscription
      const subscription = await storage.getUserSubscription(currentUser.id);
      if (!subscription || subscription.planId === 1) {
        return res.status(403).json({ error: "Агенти доступні тільки для платних підписок" });
      }

      // Check agent limit (max 10 per user)
      const existingAgents = await storage.getUserAgents(currentUser.id);
      if (existingAgents.length >= 10) {
        return res.status(400).json({ error: "Досягнуто максимальну кількість агентів (10)" });
      }

      const agent = await storage.createUserAgent({
        ...req.body,
        userId: currentUser.id,
      });
      res.json(agent);
    } catch (error: any) {
      console.error("Create agent error:", error);
      res.status(500).json({ error: "Не вдалося створити агента" });
    }
  });

  // Update agent
  app.patch("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const agent = await storage.getUserAgent(req.params.id);
      if (!agent || agent.userId !== currentUser.id) {
        return res.status(404).json({ error: "Агента не знайдено" });
      }

      const updated = await storage.updateUserAgent(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Update agent error:", error);
      res.status(500).json({ error: "Не вдалося оновити агента" });
    }
  });

  // Delete agent
  app.delete("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const agent = await storage.getUserAgent(req.params.id);
      if (!agent || agent.userId !== currentUser.id) {
        return res.status(404).json({ error: "Агента не знайдено" });
      }

      await storage.deleteUserAgent(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete agent error:", error);
      res.status(500).json({ error: "Не вдалося видалити агента" });
    }
  });

  // Generate agent data with AI
  app.post("/api/agents/generate", requireAuth, async (req, res) => {
    try {
      const currentUser = getCurrentUserUnified(req);
      if (!currentUser) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const { description } = req.body;
      if (!description || description.length < 10) {
        return res.status(400).json({ error: "Опис має бути не менше 10 символів" });
      }

      const agentData = await generateAgentData(description);
      res.json(agentData);
    } catch (error: any) {
      console.error("Generate agent error:", error);
      res.status(500).json({ error: "Не вдалося згенерувати дані агента" });
    }
  });

  // ============= Admin Subscription Management =============

  // Get all plans (admin)
  app.get("/api/admin/subscriptions/plans", requireAdmin, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans(false);
      res.json(plans);
    } catch (error: any) {
      console.error("Admin get plans error:", error);
      res.status(500).json({ error: "Не вдалося отримати тарифи" });
    }
  });

  // Create plan (admin)
  app.post("/api/admin/subscriptions/plans", requireAdmin, async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.json(plan);
    } catch (error: any) {
      console.error("Admin create plan error:", error);
      res.status(500).json({ error: "Не вдалося створити тариф" });
    }
  });

  // Update plan (admin)
  app.patch("/api/admin/subscriptions/plans/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.updateSubscriptionPlan(id, req.body);
      res.json(plan);
    } catch (error: any) {
      console.error("Admin update plan error:", error);
      res.status(500).json({ error: "Не вдалося оновити тариф" });
    }
  });

  // Delete plan (admin)
  app.delete("/api/admin/subscriptions/plans/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubscriptionPlan(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin delete plan error:", error);
      res.status(500).json({ error: "Не вдалося видалити тариф" });
    }
  });

  // Get premium features (admin)
  app.get("/api/admin/subscriptions/features", requireAdmin, async (req, res) => {
    try {
      const features = await storage.getPremiumFeatures(false);
      res.json(features);
    } catch (error: any) {
      console.error("Admin get features error:", error);
      res.status(500).json({ error: "Не вдалося отримати фічі" });
    }
  });

  // Create premium feature (admin)
  app.post("/api/admin/subscriptions/features", requireAdmin, async (req, res) => {
    try {
      const feature = await storage.createPremiumFeature(req.body);
      res.json(feature);
    } catch (error: any) {
      console.error("Admin create feature error:", error);
      res.status(500).json({ error: "Не вдалося створити фічу" });
    }
  });

  // Update premium feature (admin)
  app.patch("/api/admin/subscriptions/features/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feature = await storage.updatePremiumFeature(id, req.body);
      res.json(feature);
    } catch (error: any) {
      console.error("Admin update feature error:", error);
      res.status(500).json({ error: "Не вдалося оновити фічу" });
    }
  });

  // Delete premium feature (admin)
  app.delete("/api/admin/subscriptions/features/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePremiumFeature(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin delete feature error:", error);
      res.status(500).json({ error: "Не вдалося видалити фічу" });
    }
  });

  // ============================================
  // Payment / Monobank integration
  // ============================================
  
  // Create payment intent
  app.post("/api/payments/create", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { planId, billingPeriod } = req.body;
      if (!planId || !billingPeriod) {
        return res.status(400).json({ error: "Не вказано тариф або період" });
      }

      const plan = await storage.getSubscriptionPlan(parseInt(planId));
      if (!plan) {
        return res.status(404).json({ error: "Тариф не знайдено" });
      }

      const amount = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
      if (amount === 0) {
        return res.status(400).json({ error: "Безкоштовний тариф не потребує оплати" });
      }

      const monoToken = process.env.MONOBANK_TOKEN;
      if (!monoToken) {
        return res.status(503).json({ error: "Платіжний сервіс тимчасово недоступний" });
      }

      const { MonobankService } = await import("./monobank");
      const monobank = new MonobankService(monoToken);

      const reference = `sub_${user.id}_${plan.id}_${Date.now()}`;
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DOMAINS?.split(',')[0] 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : 'http://localhost:5000';

      // Try subscription API first, fall back to regular invoice if it fails
      let invoiceResult: { invoiceId?: string; subscriptionId?: string; pageUrl: string };
      let isSubscription = false;
      
      try {
        const interval = billingPeriod === 'yearly' ? '1y' : '1m';
        const subscription = await monobank.createSubscription({
          amount,
          redirectUrl: `${baseUrl}/payment/callback`,
          webHookUrl: `${baseUrl}/api/payments/webhook`,
          interval,
          reference,
        });
        invoiceResult = {
          subscriptionId: subscription.subscriptionId,
          pageUrl: subscription.pageUrl,
        };
        isSubscription = true;
        console.log('Created Monobank subscription:', subscription.subscriptionId);
      } catch (subscriptionError: any) {
        console.log('Subscription API failed, falling back to regular invoice:', subscriptionError.message);
        
        // Fall back to regular invoice
        const invoice = await monobank.createInvoice({
          amount,
          reference,
          destination: `Підписка "${plan.displayName}"`,
          redirectUrl: `${baseUrl}/payment/callback`,
          webhookUrl: `${baseUrl}/api/payments/webhook`,
          validity: 3600,
        });
        invoiceResult = {
          invoiceId: invoice.invoiceId,
          pageUrl: invoice.pageUrl,
        };
        console.log('Created Monobank invoice:', invoice.invoiceId);
      }

      const payment = await storage.createPaymentHistory({
        userId: user.id,
        planId: plan.id,
        amount,
        currency: "UAH",
        status: "pending",
        paymentMethod: "monobank",
        description: `Підписка "${plan.displayName}" (${billingPeriod === 'yearly' ? 'рік' : 'місяць'})`,
        billingPeriod,
        monoInvoiceId: invoiceResult.subscriptionId || invoiceResult.invoiceId,
        monoPageUrl: invoiceResult.pageUrl,
        monoReference: reference,
        metadata: isSubscription 
          ? { isSubscription: true, monoSubscriptionId: invoiceResult.subscriptionId }
          : { isSubscription: false },
      });

      res.json({
        paymentId: payment.id,
        pageUrl: invoiceResult.pageUrl,
        subscriptionId: invoiceResult.subscriptionId,
        invoiceId: invoiceResult.invoiceId,
      });
    } catch (error: any) {
      console.error("Payment create error:", error);
      res.status(500).json({ error: "Не вдалося створити платіж" });
    }
  });

  // Monobank webhook handler
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const rawBody = JSON.stringify(req.body);
      const xSign = req.headers['x-sign'] as string;
      
      console.log("Monobank webhook received:", rawBody);

      const monoToken = process.env.MONOBANK_TOKEN;
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (xSign && monoToken) {
        try {
          const { MonobankService } = await import("./monobank");
          const monobank = new MonobankService(monoToken);
          const isValid = await monobank.verifyWebhookSignature(xSign, rawBody);
          if (!isValid && !isDevelopment) {
            console.error("Invalid webhook signature");
            return res.status(403).json({ error: "Invalid signature" });
          }
        } catch (sigError) {
          console.warn("Signature verification failed (sandbox mode):", sigError);
          if (!isDevelopment) {
            return res.status(403).json({ error: "Signature verification failed" });
          }
        }
      } else if (!isDevelopment && !xSign) {
        console.warn("Missing X-Sign header, but allowing in production for initial webhook test");
      }

      const { invoiceId, subscriptionId, status, failureReason, paymentId, reference } = req.body;
      
      let payment = null;
      
      if (invoiceId) {
        payment = await storage.getPaymentByMonoInvoiceId(invoiceId);
      }
      
      if (!payment && subscriptionId) {
        payment = await storage.getPaymentByMonoInvoiceId(subscriptionId);
      }
      
      if (!payment && reference) {
        payment = await storage.getPaymentByMonoReference(reference);
      }
      
      if (!invoiceId && !subscriptionId && !reference) {
        return res.status(400).json({ error: "Missing invoiceId, subscriptionId or reference" });
      }
      if (!payment) {
        console.error("Payment not found for invoiceId/subscriptionId/reference:", invoiceId, subscriptionId, reference);
        return res.status(404).json({ error: "Payment not found" });
      }

      await storage.updatePaymentById(payment.id, {
        status,
        monoPaymentId: paymentId,
        monoFailureReason: failureReason,
      });

      if (status === 'success' && payment.planId) {
        const plan = await storage.getSubscriptionPlan(payment.planId);
        if (plan) {
          const expiresAt = new Date();
          if (payment.billingPeriod === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          const metadata = payment.metadata as Record<string, any> || {};
          const monoSubscriptionId = metadata.monoSubscriptionId || null;

          const existingSub = await storage.getUserSubscription(payment.userId);
          if (existingSub) {
            await storage.updateUserSubscription(payment.userId, {
              planId: plan.id,
              billingPeriod: payment.billingPeriod || 'monthly',
              status: 'active',
              expiresAt,
              lastPaymentAt: new Date(),
              nextPaymentAt: expiresAt,
              paymentMethod: 'monobank',
              monoSubscriptionId,
              billingRetryCount: 0,
              billingGraceUntil: null,
              lastBillingError: null,
            });
          } else {
            await storage.createUserSubscription({
              userId: payment.userId,
              planId: plan.id,
              billingPeriod: payment.billingPeriod || 'monthly',
              status: 'active',
              expiresAt,
              lastPaymentAt: new Date(),
              nextPaymentAt: expiresAt,
              paymentMethod: 'monobank',
              monoSubscriptionId,
            });
          }
        }
      } else if (status === 'failure' && payment.planId) {
        const metadata = payment.metadata as Record<string, any> || {};
        if (metadata.isSubscription) {
          const existingSub = await storage.getUserSubscription(payment.userId);
          if (existingSub) {
            const graceUntil = new Date();
            graceUntil.setDate(graceUntil.getDate() + 2);
            
            await storage.updateUserSubscription(payment.userId, {
              status: 'past_due',
              billingGraceUntil: graceUntil,
              lastBillingError: failureReason || 'Payment failed',
              billingRetryCount: (existingSub.billingRetryCount || 0) + 1,
            });
          }
        }
      }

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Check payment status
  app.get("/api/payments/:invoiceId/status", requireAuth, async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const payment = await storage.getPaymentByMonoInvoiceId(invoiceId);
      
      if (!payment) {
        return res.status(404).json({ error: "Платіж не знайдено" });
      }

      const monoToken = process.env.MONOBANK_TOKEN;
      if (monoToken) {
        try {
          const { MonobankService } = await import("./monobank");
          const monobank = new MonobankService(monoToken);
          const status = await monobank.getInvoiceStatus(invoiceId);
          
          if (status.status !== payment.status) {
            await storage.updatePaymentByMonoInvoiceId(invoiceId, {
              status: status.status,
              monoFailureReason: status.failureReason,
            });
            payment.status = status.status;
          }
        } catch (e) {
          console.error("Error fetching Mono status:", e);
        }
      }

      res.json({
        status: payment.status,
        planId: payment.planId,
      });
    } catch (error: any) {
      console.error("Payment status error:", error);
      res.status(500).json({ error: "Не вдалося отримати статус" });
    }
  });

  // Get user payment history
  app.get("/api/payments/history", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const payments = await storage.getUserPaymentHistory(user.id);
      res.json(payments);
    } catch (error: any) {
      console.error("Payment history error:", error);
      res.status(500).json({ error: "Не вдалося отримати історію" });
    }
  });

  // Admin: Get all payments
  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await storage.getAllPayments(limit, offset);
      res.json(result);
    } catch (error: any) {
      console.error("Admin payments error:", error);
      res.status(500).json({ error: "Не вдалося отримати транзакції" });
    }
  });

  // Admin: Get payment settings
  app.get("/api/admin/payment-settings", requireAdmin, async (req, res) => {
    try {
      const monoTokenConfigured = !!process.env.MONOBANK_TOKEN;
      const sandboxMode = process.env.NODE_ENV === 'development' || process.env.PAYMENT_SANDBOX_MODE === 'true';
      const webhookUrl = `${req.protocol}://${req.get('host')}/api/payments/webhook`;
      
      res.json({
        sandboxMode,
        monoTokenConfigured,
        webhookUrl,
      });
    } catch (error: any) {
      console.error("Payment settings error:", error);
      res.status(500).json({ error: "Не вдалося отримати налаштування" });
    }
  });

  // Admin: Save payment settings
  app.post("/api/admin/payment-settings", requireAdmin, async (req, res) => {
    try {
      const { sandboxMode, monoToken } = req.body;
      
      if (monoToken !== undefined) {
        console.log("Note: Monobank token should be set via environment variable MONOBANK_TOKEN");
      }
      
      if (sandboxMode !== undefined) {
        console.log(`Sandbox mode ${sandboxMode ? 'enabled' : 'disabled'}`);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Payment settings save error:", error);
      res.status(500).json({ error: "Не вдалося зберегти налаштування" });
    }
  });

  // Admin: Create test payment
  app.post("/api/admin/test-payment", requireAdmin, async (req, res) => {
    try {
      const { amount } = req.body;
      const monoToken = process.env.MONOBANK_TOKEN;
      
      if (!monoToken) {
        return res.status(400).json({ error: "Monobank токен не налаштовано" });
      }
      
      const { MonobankService } = await import("./monobank");
      const monobank = new MonobankService(monoToken);
      
      const user = (req as any).user!;
      const testAmount = amount || 10000;
      const reference = `test_${Date.now()}_${user.id}`;
      
      const invoice = await monobank.createInvoice({
        amount: testAmount,
        reference,
        destination: "Тестовий платіж",
        redirectUrl: `${req.protocol}://${req.get('host')}/payment/callback`,
        webhookUrl: `${req.protocol}://${req.get('host')}/api/payments/webhook`,
      });
      
      await storage.createPaymentHistory({
        userId: user.id,
        amount: testAmount,
        currency: "UAH",
        status: "pending",
        paymentMethod: "monobank",
        description: "Тестовий платіж",
        billingPeriod: "monthly",
        monoInvoiceId: invoice.invoiceId,
        monoPageUrl: invoice.pageUrl,
        monoReference: reference,
      });
      
      res.json({
        pageUrl: invoice.pageUrl,
        invoiceId: invoice.invoiceId,
      });
    } catch (error: any) {
      console.error("Test payment error:", error);
      res.status(500).json({ error: error.message || "Не вдалося створити тестовий платіж" });
    }
  });

  // User: Retry failed payment
  app.post("/api/payments/retry", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const subscription = await storage.getUserSubscription(user.id);
      if (!subscription) {
        return res.status(404).json({ error: "Підписку не знайдено" });
      }

      if (subscription.status !== 'past_due') {
        return res.status(400).json({ error: "Немає прострочених платежів" });
      }

      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return res.status(404).json({ error: "Тариф не знайдено" });
      }

      const monoToken = process.env.MONOBANK_TOKEN;
      if (!monoToken) {
        return res.status(400).json({ error: "Платіжна система не налаштована" });
      }

      const { MonobankService } = await import("./monobank");
      const monobank = new MonobankService(monoToken);

      const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] || `${req.protocol}://${req.get('host')}`.replace(/https?:\/\//, '');
      const protocol = baseUrl.includes("localhost") ? "http" : "https";

      const amount = subscription.billingPeriod === "yearly" ? plan.priceYearly : plan.priceMonthly;
      const reference = `RETRY-${subscription.id}-${Date.now()}`;

      const invoice = await monobank.createInvoice({
        amount: amount || 0,
        reference,
        destination: `Повторна оплата підписки "${plan.displayName}"`,
        redirectUrl: `${protocol}://${baseUrl}/profile?tab=subscription&billing=success`,
        webhookUrl: `${protocol}://${baseUrl}/api/payments/webhook`,
        validity: 3600,
      });

      await storage.createPaymentHistory({
        userId: user.id,
        subscriptionId: subscription.id,
        planId: plan.id,
        amount: amount || 0,
        currency: plan.currency,
        status: "pending",
        paymentMethod: "monobank",
        description: `Повторна оплата підписки "${plan.displayName}"`,
        billingPeriod: subscription.billingPeriod,
        monoInvoiceId: invoice.invoiceId,
        monoPageUrl: invoice.pageUrl,
        monoReference: reference,
        metadata: { isRetry: true, subscriptionId: subscription.id },
      });

      res.json({
        pageUrl: invoice.pageUrl,
        invoiceId: invoice.invoiceId,
      });
    } catch (error: any) {
      console.error("Payment retry error:", error);
      res.status(500).json({ error: error.message || "Не вдалося повторити платіж" });
    }
  });

  // User: Get billing status
  app.get("/api/billing/status", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const subWithPlan = await storage.getUserSubscriptionWithPlan(user.id);
      if (!subWithPlan) {
        return res.json({
          status: 'none',
          hasBillingIssue: false,
        });
      }

      const { subscription, plan } = subWithPlan;
      const now = new Date();
      const graceUntil = subscription.billingGraceUntil ? new Date(subscription.billingGraceUntil) : null;
      const isInGracePeriod = graceUntil && graceUntil > now;
      const graceDaysRemaining = graceUntil 
        ? Math.max(0, Math.ceil((graceUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      res.json({
        status: subscription.status,
        planName: plan.displayName,
        hasBillingIssue: subscription.status === 'past_due',
        isInGracePeriod,
        graceDaysRemaining,
        graceUntil: graceUntil?.toISOString(),
        lastBillingError: subscription.lastBillingError,
        billingRetryCount: subscription.billingRetryCount,
        nextPaymentAt: subscription.nextPaymentAt?.toISOString(),
        amount: subscription.billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly,
        currency: plan.currency,
      });
    } catch (error: any) {
      console.error("Billing status error:", error);
      res.status(500).json({ error: "Не вдалося отримати статус оплати" });
    }
  });

  // ============================================
  // External Brand Analysis Endpoints
  // ============================================

  // Get user's brand analyses history
  app.get("/api/brand-analysis", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const analyses = await storage.getExternalBrandAnalyses(user.id);
      res.json(analyses);
    } catch (error: any) {
      console.error("Get brand analyses error:", error);
      res.status(500).json({ error: "Не вдалося отримати історію аналізів" });
    }
  });

  // Get specific brand analysis
  app.get("/api/brand-analysis/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const analysis = await storage.getExternalBrandAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Аналіз не знайдено" });
      }
      if (analysis.userId !== user.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      res.json(analysis);
    } catch (error: any) {
      console.error("Get brand analysis error:", error);
      res.status(500).json({ error: "Не вдалося отримати аналіз" });
    }
  });

  // Create new brand analysis
  app.post("/api/brand-analysis", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      // Validate request body
      const createAnalysisSchema = z.object({
        url: z.string().url({ message: "Невірний формат URL" }),
        templateId: z.number().optional()
      });
      
      const validation = createAnalysisSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Невірні дані" });
      }
      
      const { url, templateId } = validation.data;

      // Get user's subscription plan
      const subWithPlan = await storage.getUserSubscriptionWithPlan(user.id);
      let userPlan = subWithPlan?.plan;
      
      if (!userPlan) {
        // Get default free plan
        const plans = await storage.getSubscriptionPlans(true);
        userPlan = plans.find(p => p.name === 'free');
      }

      // Validate template access - custom templates require Pro subscription
      if (templateId) {
        const template = await storage.getBrandAnalysisTemplate(templateId);
        if (template && !template.isStandard) {
          // Custom template - check if user has Pro subscription
          if (!userPlan || userPlan.name !== 'pro') {
            return res.status(403).json({ 
              error: "Цей шаблон доступний тільки для підписників Pro" 
            });
          }
        }
      }

      // Check analysis quota - count both completed and processing to prevent rapid-fire bypass
      const existingAnalyses = await storage.getExternalBrandAnalyses(user.id);
      const activeCount = existingAnalyses.filter(a => 
        a.status === 'completed' || a.status === 'processing'
      ).length;
      const quotaLimit = userPlan?.analysisQuota || 1;
      
      if (activeCount >= quotaLimit) {
        return res.status(403).json({ 
          error: `Вичерпано ліміт аналізів (${quotaLimit}). Оновіть підписку для продовження.` 
        });
      }

      // Determine source type from URL
      let sourceType = 'website';
      if (url.includes('instagram.com')) sourceType = 'instagram';
      else if (url.includes('facebook.com')) sourceType = 'facebook';
      else if (url.includes('linkedin.com')) sourceType = 'linkedin';

      // Create pending analysis
      const analysis = await storage.createExternalBrandAnalysis({
        userId: user.id,
        url,
        sourceType,
        status: 'processing',
      });

      // Run AI analysis in background with optional templateId
      runBrandAnalysis(analysis.id, url, sourceType, templateId).catch(err => {
        console.error("Brand analysis background error:", err);
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Create brand analysis error:", error);
      res.status(500).json({ error: "Не вдалося створити аналіз" });
    }
  });

  // Delete brand analysis
  app.delete("/api/brand-analysis/:id", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUserUnified(req);
      if (!user) {
        return res.status(401).json({ error: "Не авторизовано" });
      }

      const analysis = await storage.getExternalBrandAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Аналіз не знайдено" });
      }
      if (analysis.userId !== user.id) {
        return res.status(403).json({ error: "Немає доступу" });
      }

      await storage.deleteExternalBrandAnalysis(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete brand analysis error:", error);
      res.status(500).json({ error: "Не вдалося видалити аналіз" });
    }
  });

  // ============================================
  // Admin: Brand Analysis Settings
  // ============================================

  // Get all brand analysis settings
  app.get("/api/admin/brand-analysis-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getBrandAnalysisSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Get brand analysis settings error:", error);
      res.status(500).json({ error: "Не вдалося отримати налаштування" });
    }
  });

  // Update brand analysis setting
  app.put("/api/admin/brand-analysis-settings/:key", requireAdmin, async (req, res) => {
    try {
      const updateSettingSchema = z.object({
        value: z.string().min(1, "Значення обов'язкове")
      });
      
      const validation = updateSettingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Невірні дані" });
      }
      
      const { value } = validation.data;
      const setting = await storage.updateBrandAnalysisSetting(req.params.key, value);
      if (!setting) {
        return res.status(404).json({ error: "Налаштування не знайдено" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Update brand analysis setting error:", error);
      res.status(500).json({ error: "Не вдалося оновити налаштування" });
    }
  });

  // Create or update brand analysis setting (upsert)
  app.post("/api/admin/brand-analysis-settings", requireAdmin, async (req, res) => {
    try {
      const createSettingSchema = z.object({
        key: z.string().min(1, "Ключ обов'язковий"),
        value: z.string().min(1, "Значення обов'язкове"),
        description: z.string().optional(),
        category: z.string().optional()
      });
      
      const validation = createSettingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Невірні дані" });
      }
      
      const { key, value, description, category } = validation.data;
      
      // Check if setting already exists
      const existing = await storage.getBrandAnalysisSetting(key);
      if (existing) {
        // Update existing setting
        const updated = await storage.updateBrandAnalysisSetting(key, value);
        return res.json(updated);
      }
      
      const setting = await storage.createBrandAnalysisSetting({
        key,
        value,
        description,
        category: category || 'general',
      });
      res.json(setting);
    } catch (error: any) {
      console.error("Create brand analysis setting error:", error);
      res.status(500).json({ error: "Не вдалося створити налаштування" });
    }
  });

  // ============================================
  // Brand Analysis Templates Admin Endpoints
  // ============================================

  // Get all brand analysis templates
  app.get("/api/admin/brand-analysis-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getBrandAnalysisTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Get brand analysis templates error:", error);
      res.status(500).json({ error: "Не вдалося отримати шаблони" });
    }
  });

  // Get single brand analysis template
  app.get("/api/admin/brand-analysis-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Невірний ID" });
      }
      const template = await storage.getBrandAnalysisTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Шаблон не знайдено" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Get brand analysis template error:", error);
      res.status(500).json({ error: "Не вдалося отримати шаблон" });
    }
  });

  // Create brand analysis template
  app.post("/api/admin/brand-analysis-templates", requireAdmin, async (req, res) => {
    try {
      const templateSchema = z.object({
        name: z.string().min(1, "Назва обов'язкова"),
        description: z.string().optional(),
        systemPrompt: z.string().min(1, "Системний промпт обов'язковий"),
        analysisContext: z.string().optional(),
        soulCriteria: z.string().optional(),
        mindCriteria: z.string().optional(),
        bodyCriteria: z.string().optional(),
        scoringScale: z.string().optional(),
        balanceWeight: z.string().optional(),
        outputLanguage: z.string().optional(),
        includeRecommendations: z.boolean().optional(),
        maxStrengths: z.number().optional(),
        maxWeaknesses: z.number().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      });
      
      const validation = templateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Невірні дані" });
      }
      
      const template = await storage.createBrandAnalysisTemplate(validation.data);
      
      // If this is set as default, update other templates
      if (validation.data.isDefault) {
        await storage.setDefaultBrandAnalysisTemplate(template.id);
      }
      
      res.json(template);
    } catch (error: any) {
      console.error("Create brand analysis template error:", error);
      res.status(500).json({ error: "Не вдалося створити шаблон" });
    }
  });

  // Update brand analysis template
  app.put("/api/admin/brand-analysis-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Невірний ID" });
      }
      
      const templateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        systemPrompt: z.string().optional(),
        analysisContext: z.string().optional(),
        soulCriteria: z.string().optional(),
        mindCriteria: z.string().optional(),
        bodyCriteria: z.string().optional(),
        scoringScale: z.string().optional(),
        balanceWeight: z.string().optional(),
        outputLanguage: z.string().optional(),
        includeRecommendations: z.boolean().optional(),
        maxStrengths: z.number().optional(),
        maxWeaknesses: z.number().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      });
      
      const validation = templateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Невірні дані" });
      }
      
      // If setting as default, update all templates first
      if (validation.data.isDefault) {
        await storage.setDefaultBrandAnalysisTemplate(id);
      }
      
      const template = await storage.updateBrandAnalysisTemplate(id, validation.data);
      if (!template) {
        return res.status(404).json({ error: "Шаблон не знайдено" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Update brand analysis template error:", error);
      res.status(500).json({ error: "Не вдалося оновити шаблон" });
    }
  });

  // Delete brand analysis template
  app.delete("/api/admin/brand-analysis-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Невірний ID" });
      }
      
      const deleted = await storage.deleteBrandAnalysisTemplate(id);
      if (!deleted) {
        return res.status(404).json({ error: "Шаблон не знайдено" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete brand analysis template error:", error);
      res.status(500).json({ error: "Не вдалося видалити шаблон" });
    }
  });

  // Set template as default
  app.post("/api/admin/brand-analysis-templates/:id/set-default", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Невірний ID" });
      }
      
      const success = await storage.setDefaultBrandAnalysisTemplate(id);
      if (!success) {
        return res.status(404).json({ error: "Шаблон не знайдено" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Set default brand analysis template error:", error);
      res.status(500).json({ error: "Не вдалося встановити шаблон за замовчуванням" });
    }
  });

  // Get default template for users
  app.get("/api/brand-analysis/template", requireAuth, async (req, res) => {
    try {
      const template = await storage.getDefaultBrandAnalysisTemplate();
      res.json(template || null);
    } catch (error: any) {
      console.error("Get default brand analysis template error:", error);
      res.status(500).json({ error: "Не вдалося отримати шаблон" });
    }
  });

  // Sync dev to production - Preview changes
  app.get("/api/admin/brand-analysis-sync/preview", requireAdmin, async (req, res) => {
    try {
      const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;
      if (!productionDbUrl) {
        return res.status(400).json({ error: "Production database URL not configured" });
      }

      // Get dev data
      const devSettings = await storage.getBrandAnalysisSettings();
      const devTemplates = await storage.getBrandAnalysisTemplates();

      // Connect to production and get data
      const { neon } = await import("@neondatabase/serverless");
      const prodSql = neon(productionDbUrl);

      // Get production settings
      let prodSettings: any[] = [];
      let prodTemplates: any[] = [];

      try {
        const settingsResult = await prodSql`SELECT * FROM brand_analysis_settings ORDER BY id`;
        prodSettings = settingsResult;
      } catch (e) {
        console.log("Production settings table may not exist:", e);
      }

      try {
        const templatesResult = await prodSql`SELECT * FROM brand_analysis_templates ORDER BY id`;
        prodTemplates = templatesResult;
      } catch (e) {
        console.log("Production templates table may not exist:", e);
      }

      // Calculate diff for settings
      const settingsDiff = {
        toAdd: devSettings.filter(ds => !prodSettings.find((ps: any) => ps.key === ds.key)),
        toUpdate: devSettings.filter(ds => {
          const prod = prodSettings.find((ps: any) => ps.key === ds.key);
          return prod && prod.value !== ds.value;
        }),
        unchanged: devSettings.filter(ds => {
          const prod = prodSettings.find((ps: any) => ps.key === ds.key);
          return prod && prod.value === ds.value;
        }),
      };

      // Calculate diff for templates
      const templatesDiff = {
        toAdd: devTemplates.filter(dt => !prodTemplates.find((pt: any) => pt.name === dt.name)),
        toUpdate: devTemplates.filter(dt => {
          const prod = prodTemplates.find((pt: any) => pt.name === dt.name);
          return prod && (prod.system_prompt !== dt.systemPrompt || prod.output_language !== dt.outputLanguage);
        }),
        unchanged: devTemplates.filter(dt => {
          const prod = prodTemplates.find((pt: any) => pt.name === dt.name);
          return prod && prod.system_prompt === dt.systemPrompt && prod.output_language === dt.outputLanguage;
        }),
      };

      res.json({
        settings: {
          dev: devSettings.length,
          prod: prodSettings.length,
          diff: settingsDiff,
        },
        templates: {
          dev: devTemplates.length,
          prod: prodTemplates.length,
          diff: templatesDiff,
        },
      });
    } catch (error: any) {
      console.error("Sync preview error:", error);
      res.status(500).json({ error: "Не вдалося отримати дані для синхронізації" });
    }
  });

  // Sync dev to production - Apply changes
  app.post("/api/admin/brand-analysis-sync/apply", requireAdmin, async (req, res) => {
    try {
      const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;
      if (!productionDbUrl) {
        return res.status(400).json({ error: "Production database URL not configured" });
      }

      // Get dev data
      const devSettings = await storage.getBrandAnalysisSettings();
      const devTemplates = await storage.getBrandAnalysisTemplates();

      // Connect to production
      const { neon } = await import("@neondatabase/serverless");
      const prodSql = neon(productionDbUrl);

      // Ensure tables exist in production
      await prodSql`
        CREATE TABLE IF NOT EXISTS brand_analysis_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'general',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await prodSql`
        CREATE TABLE IF NOT EXISTS brand_analysis_templates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          system_prompt TEXT,
          analysis_context TEXT,
          soul_criteria TEXT,
          mind_criteria TEXT,
          body_criteria TEXT,
          scoring_scale TEXT,
          balance_weight TEXT,
          output_language VARCHAR(20) DEFAULT 'ukrainian',
          include_recommendations BOOLEAN DEFAULT true,
          max_strengths INTEGER DEFAULT 5,
          max_weaknesses INTEGER DEFAULT 5,
          is_active BOOLEAN DEFAULT true,
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      let settingsSynced = 0;
      let templatesSynced = 0;

      // Sync settings
      for (const setting of devSettings) {
        await prodSql`
          INSERT INTO brand_analysis_settings (key, value, description, category, is_active)
          VALUES (${setting.key}, ${setting.value}, ${setting.description}, ${setting.category}, ${setting.isActive})
          ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        `;
        settingsSynced++;
      }

      // Sync templates
      for (const template of devTemplates) {
        const exists = await prodSql`SELECT id FROM brand_analysis_templates WHERE name = ${template.name}`;
        
        if (exists.length > 0) {
          await prodSql`
            UPDATE brand_analysis_templates SET
              description = ${template.description},
              system_prompt = ${template.systemPrompt},
              analysis_context = ${template.analysisContext},
              soul_criteria = ${template.soulCriteria},
              mind_criteria = ${template.mindCriteria},
              body_criteria = ${template.bodyCriteria},
              scoring_scale = ${template.scoringScale},
              balance_weight = ${template.balanceWeight},
              output_language = ${template.outputLanguage},
              include_recommendations = ${template.includeRecommendations},
              max_strengths = ${template.maxStrengths},
              max_weaknesses = ${template.maxWeaknesses},
              is_active = ${template.isActive},
              is_default = ${template.isDefault},
              updated_at = NOW()
            WHERE name = ${template.name}
          `;
        } else {
          await prodSql`
            INSERT INTO brand_analysis_templates 
            (name, description, system_prompt, analysis_context, soul_criteria, mind_criteria, body_criteria, scoring_scale, balance_weight, output_language, include_recommendations, max_strengths, max_weaknesses, is_active, is_default)
            VALUES (${template.name}, ${template.description}, ${template.systemPrompt}, ${template.analysisContext}, ${template.soulCriteria}, ${template.mindCriteria}, ${template.bodyCriteria}, ${template.scoringScale}, ${template.balanceWeight}, ${template.outputLanguage}, ${template.includeRecommendations}, ${template.maxStrengths}, ${template.maxWeaknesses}, ${template.isActive}, ${template.isDefault})
          `;
        }
        templatesSynced++;
      }

      // Log the sync action
      const currentUser = req.user as any;
      console.log(`[SYNC] User ${currentUser?.email} synced brand analysis data to production: ${settingsSynced} settings, ${templatesSynced} templates`);

      res.json({
        success: true,
        settingsSynced,
        templatesSynced,
      });
    } catch (error: any) {
      console.error("Sync apply error:", error);
      res.status(500).json({ error: "Не вдалося синхронізувати дані: " + error.message });
    }
  });

  // Background function to run AI brand analysis
  async function runBrandAnalysis(analysisId: string, url: string, sourceType: string, templateId?: number) {
    const startTime = Date.now();
    
    try {
      // Get template: use specific template if provided, otherwise try default
      let template = null;
      if (templateId) {
        template = await storage.getBrandAnalysisTemplate(templateId);
      }
      if (!template) {
        template = await storage.getDefaultBrandAnalysisTemplate();
      }
      
      // Get analysis settings as fallback
      const systemPromptSetting = await storage.getBrandAnalysisSetting('system_prompt');
      const contextSetting = await storage.getBrandAnalysisSetting('analysis_context');
      
      // Use template if available, otherwise fallback to individual settings
      const systemPrompt = template?.systemPrompt || systemPromptSetting?.value || 'Ти експерт з брендингу та маркетингу.';
      const context = template?.analysisContext || contextSetting?.value || '';
      const soulCriteria = template?.soulCriteria || '';
      const mindCriteria = template?.mindCriteria || '';
      const bodyCriteria = template?.bodyCriteria || '';
      const scoringScale = template?.scoringScale || '';
      const balanceWeight = template?.balanceWeight || '';
      const outputLanguage = template?.outputLanguage || 'ukrainian';
      const includeRecommendations = template?.includeRecommendations ?? true;
      const maxStrengths = template?.maxStrengths ?? 5;
      const maxWeaknesses = template?.maxWeaknesses ?? 5;

      // Get AI configuration from admin settings
      const [
        providerSetting,
        modelOpenAISetting,
        modelPerplexitySetting,
        modelClaudeSetting,
        openaiKeySetting,
        perplexityKeySetting,
        claudeKeySetting
      ] = await Promise.all([
        storage.getAppSetting("AI_PROVIDER"),
        storage.getAppSetting("AI_MODEL_OPENAI"),
        storage.getAppSetting("AI_MODEL_PERPLEXITY"),
        storage.getAppSetting("AI_MODEL_CLAUDE"),
        storage.getAppSetting("OPENAI_API_KEY"),
        storage.getAppSetting("PERPLEXITY_API_KEY"),
        storage.getAppSetting("ANTHROPIC_API_KEY")
      ]);

      const provider = (providerSetting?.value as "openai" | "perplexity" | "claude") || "openai";
      
      let model: string;
      let apiKey: string;
      
      if (provider === "perplexity") {
        model = modelPerplexitySetting?.value || "sonar-pro";
        apiKey = perplexityKeySetting?.value || process.env.PERPLEXITY_API_KEY || "";
      } else if (provider === "claude") {
        model = modelClaudeSetting?.value || "claude-sonnet-4-20250514";
        apiKey = claudeKeySetting?.value || process.env.ANTHROPIC_API_KEY || "";
      } else {
        model = modelOpenAISetting?.value || "gpt-4o";
        apiKey = openaiKeySetting?.value || process.env.OPENAI_API_KEY || "";
      }

      if (!apiKey) {
        throw new Error(`API ключ для ${provider} не налаштовано. Перейдіть в Адміністрування → Налаштування → AI Settings`);
      }

      const languageInstruction = outputLanguage === 'english' 
        ? 'Please respond in English.' 
        : 'Відповідай українською мовою.';

      const userMessage = `Проаналізуй бренд за цим посиланням: ${url}

Тип джерела: ${sourceType}

${context}

${languageInstruction}

Надай детальний аналіз за методологією "Душа Бренду":

1. ДУША (Soul) - ЧОМУ бренд існує:
   ${soulCriteria || '- Місія та призначення\n   - Цінності\n   - Історія та глибинний сенс'}
   - Оцінка від 0 до 100

2. РОЗУМ (Mind) - ЩО і ЯК бренд комунікує:
   ${mindCriteria || '- Позиціонування\n   - Цільова аудиторія\n   - Повідомлення та стиль комунікації'}
   - Оцінка від 0 до 100

3. ТІЛО (Body) - ЯК бренд ВИГЛЯДАЄ:
   ${bodyCriteria || '- Візуальний стиль\n   - Кольори та типографіка\n   - Загальне враження'}
   - Оцінка від 0 до 100

${scoringScale ? `Шкала оцінювання: ${scoringScale}` : ''}

${balanceWeight ? `Оцінка балансу: ${balanceWeight}` : ''}

Також надай:
- Загальну оцінку (0-100)
- Оцінку балансу трьох компонентів (0-100)
- Сильні сторони (не більше ${maxStrengths})
- Слабкі сторони (не більше ${maxWeaknesses})
${includeRecommendations ? '- Рекомендації (список)' : ''}
- Короткий підсумок

Відповідь надай у форматі JSON:
{
  "brandName": "назва бренду",
  "soul": {
    "purpose": "призначення",
    "mission": "місія",
    "values": ["цінність1", "цінність2"],
    "story": "історія",
    "score": 75
  },
  "mind": {
    "positioning": "позиціонування",
    "audience": "цільова аудиторія",
    "communication": "стиль комунікації",
    "message": "ключове повідомлення",
    "score": 80
  },
  "body": {
    "visual": "візуальний стиль",
    "colors": ["колір1", "колір2"],
    "typography": "типографіка",
    "style": "загальний стиль",
    "score": 70
  },
  "overallScore": 75,
  "balanceScore": 80,
  "summary": "короткий підсумок",
  "strengths": ["сильна сторона 1", "сильна сторона 2"],
  "weaknesses": ["слабка сторона 1", "слабка сторона 2"],
  "recommendations": ["рекомендація 1", "рекомендація 2"]
}`;

      let content: string | null = null;
      let tokensUsed = 0;

      if (provider === "claude") {
        // Use Anthropic/Claude
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const claude = new Anthropic({ apiKey });
        
        const response = await claude.messages.create({
          model,
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        });
        
        const textBlock = response.content.find(block => block.type === 'text');
        content = textBlock?.type === 'text' ? textBlock.text : null;
        tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
      } else {
        // Use OpenAI or Perplexity (OpenAI-compatible API)
        const { default: OpenAI } = await import('openai');
        const baseURL = provider === "perplexity" ? "https://api.perplexity.ai" : undefined;
        const openai = new OpenAI({ apiKey, baseURL });

        const response = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 4000,
        });

        content = response.choices[0]?.message?.content;
        tokensUsed = response.usage?.total_tokens || 0;
      }

      if (!content) {
        throw new Error('Empty response from AI');
      }

      // Extract JSON from response (Claude may include extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const analysisResult = JSON.parse(jsonMatch[0]);
      const generationTimeMs = Date.now() - startTime;

      // Update analysis with results
      await storage.updateExternalBrandAnalysis(analysisId, {
        brandName: analysisResult.brandName,
        soulAnalysis: analysisResult.soul,
        mindAnalysis: analysisResult.mind,
        bodyAnalysis: analysisResult.body,
        overallScore: analysisResult.overallScore,
        balanceScore: analysisResult.balanceScore,
        summary: analysisResult.summary,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        recommendations: analysisResult.recommendations,
        provider,
        model,
        tokensUsed,
        generationTimeMs,
        status: 'completed',
      });

      console.log(`Brand analysis ${analysisId} completed in ${generationTimeMs}ms`);
    } catch (error: any) {
      console.error(`Brand analysis ${analysisId} failed:`, error);
      await storage.updateExternalBrandAnalysis(analysisId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
