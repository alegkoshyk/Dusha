import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";

// AI Configuration interface
interface AIConfig {
  provider: "openai" | "perplexity" | "claude";
  model: string;
  context: string;
  apiKey: string;
}

// Default models
const DEFAULT_OPENAI_MODEL = "gpt-4o";
const DEFAULT_PERPLEXITY_MODEL = "sonar-pro";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514";

let aiClient: OpenAI | null = null;
let claudeClient: Anthropic | null = null;
let cachedConfig: AIConfig | null = null;

async function getAIConfig(): Promise<AIConfig> {
  const [
    providerSetting,
    modelOpenAISetting,
    modelPerplexitySetting,
    modelClaudeSetting,
    contextSetting,
    openaiKeySetting,
    perplexityKeySetting,
    claudeKeySetting
  ] = await Promise.all([
    storage.getAppSetting("AI_PROVIDER"),
    storage.getAppSetting("AI_MODEL_OPENAI"),
    storage.getAppSetting("AI_MODEL_PERPLEXITY"),
    storage.getAppSetting("AI_MODEL_CLAUDE"),
    storage.getAppSetting("AI_CONTEXT"),
    storage.getAppSetting("OPENAI_API_KEY"),
    storage.getAppSetting("PERPLEXITY_API_KEY"),
    storage.getAppSetting("ANTHROPIC_API_KEY")
  ]);

  const provider = (providerSetting?.value as "openai" | "perplexity" | "claude") || "openai";
  
  let model: string;
  let apiKey: string;
  
  if (provider === "perplexity") {
    model = modelPerplexitySetting?.value || DEFAULT_PERPLEXITY_MODEL;
    apiKey = perplexityKeySetting?.value || process.env.PERPLEXITY_API_KEY || "";
  } else if (provider === "claude") {
    model = modelClaudeSetting?.value || DEFAULT_CLAUDE_MODEL;
    apiKey = claudeKeySetting?.value || process.env.ANTHROPIC_API_KEY || "";
  } else {
    model = modelOpenAISetting?.value || DEFAULT_OPENAI_MODEL;
    apiKey = openaiKeySetting?.value || process.env.OPENAI_API_KEY || "";
  }

  return {
    provider,
    model,
    context: contextSetting?.value || "",
    apiKey
  };
}

async function getOpenAIClient(): Promise<{ client: OpenAI; config: AIConfig }> {
  const config = await getAIConfig();
  
  const configKey = `${config.provider}-${config.apiKey}`;
  const cachedKey = cachedConfig ? `${cachedConfig.provider}-${cachedConfig.apiKey}` : null;
  
  if (configKey !== cachedKey) {
    aiClient = null;
    claudeClient = null;
    cachedConfig = config;
  }
  
  if (!aiClient) {
    if (!config.apiKey) {
      const providerName = config.provider === "perplexity" ? "Perplexity" : "OpenAI";
      throw new Error(`${providerName} API ключ не налаштовано`);
    }
    
    const baseURL = config.provider === "perplexity" 
      ? "https://api.perplexity.ai"
      : undefined;
    
    aiClient = new OpenAI({ 
      apiKey: config.apiKey,
      baseURL 
    });
  }
  
  return { client: aiClient, config };
}

async function getClaudeClient(): Promise<{ client: Anthropic; config: AIConfig }> {
  const config = await getAIConfig();
  
  const configKey = `${config.provider}-${config.apiKey}`;
  const cachedKey = cachedConfig ? `${cachedConfig.provider}-${cachedConfig.apiKey}` : null;
  
  if (configKey !== cachedKey) {
    aiClient = null;
    claudeClient = null;
    cachedConfig = config;
  }
  
  if (!claudeClient) {
    if (!config.apiKey) {
      throw new Error("Anthropic API ключ не налаштовано");
    }
    
    claudeClient = new Anthropic({ 
      apiKey: config.apiKey
    });
  }
  
  return { client: claudeClient, config };
}

async function getAIClient(): Promise<{ client: OpenAI; config: AIConfig }> {
  return getOpenAIClient();
}

export async function isAIConfigured(): Promise<boolean> {
  const config = await getAIConfig();
  return !!config.apiKey;
}

export function resetAIClient(): void {
  aiClient = null;
  cachedConfig = null;
}

// For backwards compatibility
export async function isOpenAIConfigured(): Promise<boolean> {
  return isAIConfigured();
}

export function resetOpenAIClient(): void {
  resetAIClient();
}

export interface LevelInsight {
  level: "soul" | "mind" | "body";
  levelName: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  consistencyScore: number;
}

export interface BrandInsights {
  overallScore: number;
  overallSummary: string;
  brandName: string;
  levels: LevelInsight[];
  checklist: {
    category: string;
    items: {
      text: string;
      status: "done" | "needs_improvement" | "missing";
      priority: "high" | "medium" | "low";
    }[];
  }[];
  nextSteps: string[];
}

export interface BrandData {
  name: string;
  description?: string;
}

// Format responses for structured output
function formatResponsesForPrompt(responses: { cardTitle: string; question?: string; response: any }[]): string {
  return responses.map(r => {
    const questionText = r.question ? `\n   Питання: ${r.question}` : '';
    const responseText = typeof r.response === 'object' 
      ? JSON.stringify(r.response, null, 2) 
      : String(r.response);
    return `📋 ${r.cardTitle}${questionText}\n   Відповідь: ${responseText}`;
  }).join("\n\n");
}

export async function analyzeBrandLevel(
  level: "soul" | "mind" | "body",
  responses: { cardTitle: string; question?: string; response: any }[],
  brandData?: BrandData
): Promise<LevelInsight> {
  const { client, config } = await getAIClient();

  const levelNames = {
    soul: "Душа Бренду",
    mind: "Розум Бренду",
    body: "Тіло Бренду"
  };

  const levelDescriptions = {
    soul: "цінності, місія, історія бренду, його призначення та емоційна складова",
    mind: "стратегія, позиціонування, архетип, цільова аудиторія та унікальна пропозиція",
    body: "продукти, канали комунікації, візуальний стиль, тон голосу та метрики успіху"
  };

  const brandContext = brandData 
    ? `\n\n📌 Інформація про бренд:\n- Назва: ${brandData.name}${brandData.description ? `\n- Опис: ${brandData.description}` : ''}`
    : '';

  const customContext = config.context 
    ? `\n\n📝 Додатковий контекст:\n${config.context}`
    : '';

  const prompt = `Ти - експерт з бренд-стратегії. Проаналізуй відповіді користувача для рівня "${levelNames[level]}" бренду.
${brandContext}

🎯 Рівень "${levelNames[level]}" включає: ${levelDescriptions[level]}.
${customContext}

📊 Відповіді користувача:

${formatResponsesForPrompt(responses)}

Дай структурований аналіз у форматі JSON з такими полями:
- summary: короткий підсумок (2-3 речення українською)
- strengths: масив сильних сторін (українською, максимум 5)
- weaknesses: масив слабких сторін або прогалин (українською, максимум 5)
- recommendations: масив конкретних рекомендацій для покращення (українською, максимум 5)
- consistencyScore: оцінка узгодженості від 0 до 100

Відповідай ТІЛЬКИ валідним JSON об'єктом.`;

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content: "Ти - експерт з бренд-стратегії. Відповідай тільки валідним JSON без додаткового тексту."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048
  });

  // Log AI usage
  const usage = response.usage;
  if (usage) {
    const costRates = config.provider === "perplexity"
      ? { input: 0.000001, output: 0.000001 }
      : { input: 0.00001, output: 0.00003 };
    
    const estimatedCost = (usage.prompt_tokens * costRates.input) + (usage.completion_tokens * costRates.output);
    
    await storage.logAIUsage({
      provider: config.provider,
      model: config.model,
      tokensInput: usage.prompt_tokens,
      tokensOutput: usage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "analyzeBrandLevel",
    });
  }

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Пуста відповідь від AI");
  }

  const result = JSON.parse(content);
  
  return {
    level,
    levelName: levelNames[level],
    summary: result.summary || "",
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    recommendations: result.recommendations || [],
    consistencyScore: Math.min(100, Math.max(0, result.consistencyScore || 50))
  };
}

export async function generateBrandInsights(
  allResponses: { level: string; cardTitle: string; question?: string; response: any }[],
  brandData?: BrandData
): Promise<BrandInsights> {
  const { client, config } = await getAIClient();

  const soulResponses = allResponses.filter(r => r.level === "soul");
  const mindResponses = allResponses.filter(r => r.level === "mind");
  const bodyResponses = allResponses.filter(r => r.level === "body");

  const levelInsights: LevelInsight[] = [];
  
  if (soulResponses.length > 0) {
    levelInsights.push(await analyzeBrandLevel("soul", soulResponses, brandData));
  }
  if (mindResponses.length > 0) {
    levelInsights.push(await analyzeBrandLevel("mind", mindResponses, brandData));
  }
  if (bodyResponses.length > 0) {
    levelInsights.push(await analyzeBrandLevel("body", bodyResponses, brandData));
  }

  const brandContext = brandData 
    ? `\n📌 Бренд: ${brandData.name}${brandData.description ? ` - ${brandData.description}` : ''}`
    : '';

  const customContext = config.context 
    ? `\n\n📝 Додатковий контекст:\n${config.context}`
    : '';

  const overallPrompt = `Ти - експерт з бренд-стратегії. На основі аналізу всіх трьох рівнів бренду, створи загальний висновок.
${brandContext}
${customContext}

📊 Аналіз рівнів:
${levelInsights.map(l => `
🔹 ${l.levelName} (оцінка: ${l.consistencyScore}/100):
   Підсумок: ${l.summary}
   Сильні сторони: ${l.strengths.join(", ")}
   Слабкі сторони: ${l.weaknesses.join(", ")}
`).join("\n")}

Створи JSON з:
- overallScore: загальна оцінка консистентності бренду (0-100)
- overallSummary: загальний підсумок про стан бренду (3-4 речення українською)
- checklist: масив категорій для чекліста консистентності бренду, кожна категорія має:
  - category: назва категорії (наприклад "Ідентичність", "Комунікація", "Стратегія")
  - items: масив пунктів, кожен з:
    - text: опис пункту
    - status: "done" | "needs_improvement" | "missing"
    - priority: "high" | "medium" | "low"
- nextSteps: масив наступних кроків для покращення бренду (максимум 5)

Відповідай ТІЛЬКИ валідним JSON.`;

  const overallResponse = await client.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content: "Ти - експерт з бренд-стратегії. Відповідай тільки валідним JSON без додаткового тексту."
      },
      { role: "user", content: overallPrompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096
  });

  // Log AI usage
  const overallUsage = overallResponse.usage;
  if (overallUsage) {
    const costRates = config.provider === "perplexity"
      ? { input: 0.000001, output: 0.000001 }
      : { input: 0.00001, output: 0.00003 };
    
    const estimatedCost = (overallUsage.prompt_tokens * costRates.input) + (overallUsage.completion_tokens * costRates.output);
    
    await storage.logAIUsage({
      provider: config.provider,
      model: config.model,
      tokensInput: overallUsage.prompt_tokens,
      tokensOutput: overallUsage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "generateBrandInsights",
    });
  }

  const overallContent = overallResponse.choices[0].message.content;
  if (!overallContent) {
    throw new Error("Пуста відповідь від AI");
  }

  const overallResult = JSON.parse(overallContent);

  return {
    overallScore: Math.min(100, Math.max(0, overallResult.overallScore || 50)),
    overallSummary: overallResult.overallSummary || "",
    brandName: brandData?.name || "Бренд",
    levels: levelInsights,
    checklist: overallResult.checklist || [],
    nextSteps: overallResult.nextSteps || []
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BrandContext {
  brandName: string;
  brandDescription?: string;
  responses: { level: string; cardTitle: string; question?: string; response: any }[];
}

export async function sendBrandChatMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  brandContext: BrandContext,
  sessionId?: string
): Promise<{ response: string; tokensUsed?: { input: number; output: number } }> {
  const config = await getAIConfig();

  const systemPrompt = `Ти - експертний консультант з брендингу та маркетингу. Ти допомагаєш підприємцям розвивати їхні бренди.

📌 Контекст бренду:
- Назва: ${brandContext.brandName}
${brandContext.brandDescription ? `- Опис: ${brandContext.brandDescription}` : ''}

📊 Дані бренду з гри "Душа Бренду":
${brandContext.responses.map(r => {
  const responseText = typeof r.response === 'object' 
    ? JSON.stringify(r.response, null, 2) 
    : String(r.response);
  return `[${r.level.toUpperCase()}] ${r.cardTitle}: ${responseText}`;
}).join('\n')}

${config.context ? `\n📝 Додатковий контекст:\n${config.context}` : ''}

Твоя роль:
- Давай практичні поради на основі даних бренду
- Допомагай уточнювати стратегію та позиціонування
- Відповідай чітко, конструктивно та українською мовою
- Пропонуй конкретні кроки та приклади`;

  // Build messages array ensuring alternation
  const historyMessages = chatHistory.slice(-10).filter(m => m.role !== "system");
  
  // For Claude, we need to handle messages differently
  if (config.provider === "claude") {
    const { client: claude } = await getClaudeClient();
    
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    let lastRole: string | null = null;
    
    for (const msg of historyMessages) {
      if (msg.role === "user" || msg.role === "assistant") {
        if (msg.role === lastRole && claudeMessages.length > 0) {
          claudeMessages[claudeMessages.length - 1].content += "\n\n" + msg.content;
        } else {
          claudeMessages.push({ role: msg.role, content: msg.content });
          lastRole = msg.role;
        }
      }
    }
    
    // Add new user message
    if (lastRole === "user" && claudeMessages.length > 0) {
      claudeMessages[claudeMessages.length - 1].content += "\n\n" + userMessage;
    } else {
      claudeMessages.push({ role: "user", content: userMessage });
    }
    
    const response = await claude.messages.create({
      model: config.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages
    });
    
    const usage = response.usage;
    if (usage) {
      const costRates = { input: 0.000003, output: 0.000015 }; // Claude Sonnet pricing
      const estimatedCost = (usage.input_tokens * costRates.input) + (usage.output_tokens * costRates.output);
      
      await storage.logAIUsage({
        provider: config.provider,
        model: config.model,
        tokensInput: usage.input_tokens,
        tokensOutput: usage.output_tokens,
        costEstimate: estimatedCost.toFixed(6),
        endpoint: "brandChat",
        sessionId: sessionId || null,
      });
    }
    
    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Пуста відповідь від Claude");
    }
    
    return {
      response: content.text,
      tokensUsed: usage ? {
        input: usage.input_tokens,
        output: usage.output_tokens
      } : undefined
    };
  }
  
  // OpenAI / Perplexity path
  const { client } = await getOpenAIClient();
  
  const allMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt }
  ];
  
  let lastRole: string | null = "system";
  for (const msg of historyMessages) {
    if (msg.role === lastRole && lastRole !== "system") {
      const prev = allMessages[allMessages.length - 1];
      if (prev && prev.role === msg.role) {
        prev.content += "\n\n" + msg.content;
        continue;
      }
    }
    allMessages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content
    });
    lastRole = msg.role;
  }
  
  if (lastRole === "user" && allMessages.length > 1) {
    const lastMsg = allMessages[allMessages.length - 1];
    lastMsg.content += "\n\n" + userMessage;
  } else {
    allMessages.push({ role: "user", content: userMessage });
  }

  const response = await client.chat.completions.create({
    model: config.model,
    messages: allMessages,
    max_tokens: 2048,
    temperature: 0.7
  });

  const usage = response.usage;
  if (usage) {
    const costRates = config.provider === "perplexity"
      ? { input: 0.000001, output: 0.000001 }
      : { input: 0.00001, output: 0.00003 };
    
    const estimatedCost = (usage.prompt_tokens * costRates.input) + (usage.completion_tokens * costRates.output);
    
    await storage.logAIUsage({
      provider: config.provider,
      model: config.model,
      tokensInput: usage.prompt_tokens,
      tokensOutput: usage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "brandChat",
      sessionId: sessionId || null,
    });
  }

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Пуста відповідь від AI");
  }

  return {
    response: content,
    tokensUsed: usage ? {
      input: usage.prompt_tokens,
      output: usage.completion_tokens
    } : undefined
  };
}

export interface AIAssistRequest {
  cardTitle: string;
  cardDescription: string;
  currentText: string;
  minLength: number;
  maxLength: number;
  brandName?: string;
  previousResponses?: { cardTitle: string; response: string }[];
}

export async function generateCardResponse(request: AIAssistRequest): Promise<{ text: string }> {
  const { client, config } = await getAIClient();

  const contextResponses = request.previousResponses?.slice(-5).map(r => 
    `- ${r.cardTitle}: ${r.response}`
  ).join('\n') || '';

  const prompt = `Ти - експерт з брендингу. Допоможи сформулювати відповідь для картки "${request.cardTitle}".

📌 Завдання: ${request.cardDescription}

${request.brandName ? `🏷️ Бренд: ${request.brandName}` : ''}

${contextResponses ? `📋 Попередні відповіді користувача:\n${contextResponses}` : ''}

${request.currentText ? `✏️ Поточний текст користувача: "${request.currentText}"` : ''}

⚠️ ВАЖЛИВО:
- Відповідь має бути ${request.minLength}-${request.maxLength} символів
- Писати українською мовою
- Бути конкретним та практичним
- ${request.currentText ? 'Покращити та доповнити текст користувача' : 'Запропонувати приклад відповіді'}

Напиши ТІЛЬКИ текст відповіді, без пояснень чи коментарів.`;

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content: "Ти - експерт з брендингу. Пиши коротко, чітко та українською мовою. Відповідай тільки текстом без коментарів."
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 512,
    temperature: 0.8
  });

  const usage = response.usage;
  if (usage) {
    const costRates = config.provider === "perplexity"
      ? { input: 0.000001, output: 0.000001 }
      : { input: 0.00001, output: 0.00003 };
    
    const estimatedCost = (usage.prompt_tokens * costRates.input) + (usage.completion_tokens * costRates.output);
    
    await storage.logAIUsage({
      provider: config.provider,
      model: config.model,
      tokensInput: usage.prompt_tokens,
      tokensOutput: usage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "generateCardResponse",
    });
  }

  let text = response.choices[0].message.content || "";
  
  // Обрізаємо до maxLength якщо потрібно
  if (text.length > request.maxLength) {
    text = text.substring(0, request.maxLength - 3) + "...";
  }
  
  // Перевіряємо minLength - якщо текст занадто короткий, додаємо пояснення
  if (text.length < request.minLength && text.length > 0) {
    // Текст занадто короткий, повертаємо як є - користувач може доповнити
    console.log(`AI response length (${text.length}) is below minLength (${request.minLength})`);
  }

  return { text };
}

// DALL-E image generation
export async function generateImageWithDALLE(
  prompt: string, 
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024",
  quality: "standard" | "hd" = "standard",
  style: "vivid" | "natural" = "vivid"
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const config = await getAIConfig();
    
    // Only works with OpenAI provider
    if (config.provider !== "openai") {
      return { success: false, error: "DALL-E доступний тільки з OpenAI провайдером" };
    }
    
    if (!config.apiKey) {
      return { success: false, error: "OpenAI API ключ не налаштовано" };
    }
    
    const client = new OpenAI({ apiKey: config.apiKey });
    
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality,
      style
    });
    
    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return { success: false, error: "Не вдалося отримати зображення" };
    }
    
    // Log usage - DALL-E pricing
    const costEstimate = quality === "hd" ? 0.08 : 0.04; // approx pricing per image
    await storage.logAIUsage({
      provider: "openai",
      model: "dall-e-3",
      tokensInput: 0,
      tokensOutput: 0,
      costEstimate: costEstimate.toFixed(6),
      endpoint: "generateImageWithDALLE",
    });
    
    return { success: true, imageUrl };
  } catch (error: any) {
    console.error("DALL-E generation error:", error);
    return { success: false, error: error.message || "Помилка генерації зображення" };
  }
}

// Target Audience Persona Generation
export interface GeneratedPersona {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  location: string;
  income: string;
  education: string;
  familyStatus: string;
  lifestyle: string;
  values: string[];
  interests: string[];
  painPoints: string[];
  goals: string[];
  motivations: string[];
  fears: string[];
  buyingBehavior: string;
  mediaConsumption: string[];
  decisionFactors: string[];
  quote: string;
  dayInLife: string;
  brandRelationship: string;
}

export async function generateAudiencePersona(
  brandData: { 
    name: string; 
    description?: string; 
    values?: string[]; 
    mission?: string;
    vision?: string;
    targetAudience?: string;
    uniqueValue?: string;
    tagline?: string;
  },
  audienceType: "primary" | "secondary" | "niche" = "primary",
  existingSegments?: { name: string; description?: string }[],
  customPrompt?: string,
  personaName?: string,
  selectedSegments?: { name: string; description?: string; ageRange?: string; gender?: string; location?: string; income?: string; education?: string; occupation?: string; contextDescription?: string; targetBehavior?: string }[],
  selectedSubSegments?: { name: string; description?: string; contextDescription?: string; specificNeeds?: string; differentiators?: string }[]
): Promise<GeneratedPersona> {
  const { client, config } = await getAIClient();

  const segmentsContext = existingSegments?.length 
    ? `\nІснуючі сегменти аудиторії: ${existingSegments.map(s => s.name).join(", ")}`
    : "";

  const audienceTypeDesc = {
    primary: "основної (найбільшої та найважливішої)",
    secondary: "вторинної (додаткової, менш критичної)",
    niche: "нішевої (спеціалізованої, вузької)"
  }[audienceType];

  const customDirection = customPrompt?.trim() 
    ? `\n\n🎯 ОСОБЛИВІ ВКАЗІВКИ ВІД КОРИСТУВАЧА:\n${customPrompt}\n\nВраховуй ці вказівки як пріоритетний напрямок для створення персони!`
    : "";

  // Build segment context if selected
  let segmentContext = "";
  if (selectedSegments?.length) {
    segmentContext += "\n\n📊 ОБРАНІ СЕГМЕНТИ (персона має відповідати цим характеристикам):\n";
    selectedSegments.forEach((seg, i) => {
      segmentContext += `\n${i + 1}. ${seg.name}`;
      if (seg.description) segmentContext += `\n   Опис: ${seg.description}`;
      if (seg.ageRange) segmentContext += `\n   Вік: ${seg.ageRange}`;
      if (seg.gender) segmentContext += `\n   Стать: ${seg.gender}`;
      if (seg.location) segmentContext += `\n   Локація: ${seg.location}`;
      if (seg.income) segmentContext += `\n   Дохід: ${seg.income}`;
      if (seg.education) segmentContext += `\n   Освіта: ${seg.education}`;
      if (seg.occupation) segmentContext += `\n   Професія: ${seg.occupation}`;
      if (seg.contextDescription) segmentContext += `\n   Контекст: ${seg.contextDescription}`;
      if (seg.targetBehavior) segmentContext += `\n   Поведінка: ${seg.targetBehavior}`;
    });
  }

  if (selectedSubSegments?.length) {
    segmentContext += "\n\n📂 ОБРАНІ ПІДСЕГМЕНТИ:\n";
    selectedSubSegments.forEach((sub, i) => {
      segmentContext += `\n${i + 1}. ${sub.name}`;
      if (sub.description) segmentContext += `\n   Опис: ${sub.description}`;
      if (sub.contextDescription) segmentContext += `\n   Контекст: ${sub.contextDescription}`;
      if (sub.specificNeeds) segmentContext += `\n   Потреби: ${sub.specificNeeds}`;
      if (sub.differentiators) segmentContext += `\n   Відмінності: ${sub.differentiators}`;
    });
  }

  // Handle provided name
  const nameInstruction = personaName?.trim()
    ? `\n\n⚠️ ВАЖЛИВО: Ім'я персони ПОВИННО бути "${personaName}" - не змінюй його!`
    : "";

  const prompt = `Ти - експерт з маркетингу та сегментації аудиторії. Створи детальний портрет представника ${audienceTypeDesc} цільової аудиторії для бренду.

📌 Бренд: ${brandData.name}
${brandData.description ? `📝 Опис бренду: ${brandData.description}` : ""}
${brandData.tagline ? `💬 Слоган: ${brandData.tagline}` : ""}
${brandData.values?.length ? `🎯 Цінності бренду: ${brandData.values.join(", ")}` : ""}
${brandData.mission ? `🚀 Місія: ${brandData.mission}` : ""}
${brandData.vision ? `🔮 Візія: ${brandData.vision}` : ""}
${brandData.targetAudience ? `👥 Загальний опис ЦА: ${brandData.targetAudience}` : ""}
${brandData.uniqueValue ? `⭐ Унікальна цінність: ${brandData.uniqueValue}` : ""}
${segmentsContext}${segmentContext}${customDirection}${nameInstruction}

Створи JSON з детальним портретом персони:
{
  "name": "${personaName?.trim() || "типове українське ім'я"}",
  "age": число (реалістичний вік),
  "gender": "чоловік" або "жінка",
  "occupation": "професія/посада",
  "location": "місто/регіон України",
  "income": "рівень доходу",
  "education": "освіта",
  "familyStatus": "сімейний стан",
  "lifestyle": "опис стилю життя (2-3 речення)",
  "values": ["масив 3-5 ключових цінностей"],
  "interests": ["масив 4-6 інтересів/хобі"],
  "painPoints": ["масив 3-5 болей/проблем, які вирішує бренд"],
  "goals": ["масив 3-5 цілей персони"],
  "motivations": ["масив 3-4 мотивацій до покупки"],
  "fears": ["масив 2-3 страхи/занепокоєння"],
  "buyingBehavior": "опис поведінки при покупках",
  "mediaConsumption": ["масив 3-5 каналів споживання медіа"],
  "decisionFactors": ["масив 3-5 факторів прийняття рішень"],
  "quote": "типова цитата, яку міг би сказати цей клієнт",
  "dayInLife": "опис типового дня (3-4 речення)",
  "brandRelationship": "як ця персона взаємодіє з брендом (2-3 речення)"
}

Відповідай ТІЛЬКИ валідним JSON українською мовою.`;

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content: "Ти - експерт з маркетингу. Відповідай тільки валідним JSON без додаткового тексту."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000
  });

  const usage = response.usage;
  if (usage) {
    const costRates = config.provider === "perplexity"
      ? { input: 0.000001, output: 0.000001 }
      : { input: 0.00001, output: 0.00003 };
    
    const estimatedCost = (usage.prompt_tokens * costRates.input) + (usage.completion_tokens * costRates.output);
    
    await storage.logAIUsage({
      provider: config.provider,
      model: config.model,
      tokensInput: usage.prompt_tokens,
      tokensOutput: usage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "generateAudiencePersona",
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Не вдалося згенерувати персону");
  }

  return JSON.parse(content) as GeneratedPersona;
}

// Generated Segment Data interface
export interface GeneratedSegmentData {
  // Standard parameters
  name: string;
  ageRange?: string;
  income?: string;
  needPain?: string;
  lifeContext?: string;
  awarenessLevel?: string;
  readinessToAct?: string;
  barrier?: string;
  trigger?: string;
  // Pro parameters - Demographics
  gender?: string;
  education?: string;
  familyStatus?: string;
  occupation?: string;
  companySize?: string;
  industry?: string;
  companyRevenue?: string;
  employeeCount?: string;
  // Pro parameters - Geographic
  location?: string;
  citySize?: string;
  climate?: string;
  urbanization?: string;
  localContext?: string;
  // Pro parameters - Psychographics
  values?: string;
  beliefs?: string;
  lifestyle?: string;
  interests?: string;
  fears?: string;
  triggersPsycho?: string;
  desires?: string;
  selfIdentification?: string;
  // Pro parameters - Behavioral
  purchaseFrequency?: string;
  usageScenarios?: string;
  loyaltyLevel?: string;
  willingnessToPay?: string;
  priceSensitivity?: string;
  interactionChannels?: string;
  purchaseTriggers?: string;
  purchaseBarriers?: string;
  // Pro parameters - Needs & Tasks (JTBD)
  taskToSolve?: string;
  painToRelieve?: string;
  desiredResult?: string;
  currentAlternatives?: string;
  // Pro parameters - Socio-cultural
  socialRole?: string;
  communities?: string;
  socialStatus?: string;
  influenceLevel?: string;
  languageSymbolsCodes?: string;
  // Pro parameters - Contextual
  currentState?: string;
  lifeStage?: string;
  decisionSituation?: string;
  timeSeasonEvent?: string;
}

export async function generateSegmentData(
  brandData: {
    name: string;
    description?: string;
    values?: string[];
    mission?: string;
    targetAudience?: string;
  },
  segmentDescription: string,
  tier: "standard" | "pro" = "standard"
): Promise<GeneratedSegmentData> {
  const { client, config } = await getAIClient();

  const standardFields = `{
  "name": "назва сегменту (коротка, описова)",
  "ageRange": "віковий діапазон (напр. '25-35', '45+')",
  "income": "рівень доходу (низький/середній/вище середнього/високий)",
  "needPain": "головна потреба або біль сегменту",
  "lifeContext": "криза | спокій | пошук | розвиток",
  "awarenessLevel": "не усвідомлює | усвідомлює | шукає рішення",
  "readinessToAct": "зараз | пізніше | колись",
  "barrier": "головний бар'єр (страх/гроші/недовіра/складність)",
  "trigger": "що змусить діяти (рекомендація/приклад/проста дія)"
}`;

  const proFields = `{
  "name": "назва сегменту",
  "ageRange": "віковий діапазон",
  "income": "рівень доходу",
  "needPain": "головна потреба або біль",
  "lifeContext": "криза | спокій | пошук | розвиток",
  "awarenessLevel": "не усвідомлює | усвідомлює | шукає рішення",
  "readinessToAct": "зараз | пізніше | колись",
  "barrier": "головний бар'єр",
  "trigger": "що змусить діяти",
  
  "gender": "стать (чоловіки/жінки/всі)",
  "education": "рівень освіти",
  "familyStatus": "сімейний стан",
  "occupation": "професія/посада",
  "companySize": "розмір компанії (для B2B)",
  "industry": "галузь (для B2B)",
  "companyRevenue": "оборот компанії (для B2B)",
  "employeeCount": "кількість співробітників (для B2B)",
  
  "location": "країна/регіон/місто",
  "citySize": "розмір міста",
  "climate": "клімат",
  "urbanization": "місто | село | передмістя",
  "localContext": "локальний контекст (культура, економіка)",
  
  "values": "цінності сегменту",
  "beliefs": "переконання",
  "lifestyle": "стиль життя",
  "interests": "інтереси",
  "fears": "страхи",
  "triggersPsycho": "психологічні тригери",
  "desires": "бажання",
  "selfIdentification": "самоідентифікація (я хто?)",
  
  "purchaseFrequency": "частота покупок",
  "usageScenarios": "сценарії використання",
  "loyaltyLevel": "рівень лояльності",
  "willingnessToPay": "готовність платити",
  "priceSensitivity": "чутливість до ціни",
  "interactionChannels": "канали взаємодії",
  "purchaseTriggers": "тригери покупки",
  "purchaseBarriers": "бар'єри покупки",
  
  "taskToSolve": "яку задачу хоче вирішити",
  "painToRelieve": "який біль зняти",
  "desiredResult": "який результат отримати",
  "currentAlternatives": "як вирішує зараз",
  
  "socialRole": "роль у суспільстві",
  "communities": "спільноти",
  "socialStatus": "соціальний статус",
  "influenceLevel": "лідер | послідовник",
  "languageSymbolsCodes": "мова, символи, коди",
  
  "currentState": "стрес | спокій | криза | зростання",
  "lifeStage": "життєвий етап",
  "decisionSituation": "ситуація прийняття рішення",
  "timeSeasonEvent": "час, сезон, подія"
}`;

  const fieldsTemplate = tier === "pro" ? proFields : standardFields;

  const prompt = `Ти - експерт з сегментації аудиторії та маркетингового аналізу. На основі опису сегменту створи детальну структуру з усіма параметрами.

📌 Бренд: ${brandData.name}
${brandData.description ? `📝 Опис бренду: ${brandData.description}` : ""}
${brandData.values?.length ? `🎯 Цінності: ${brandData.values.join(", ")}` : ""}
${brandData.mission ? `🚀 Місія: ${brandData.mission}` : ""}
${brandData.targetAudience ? `👥 ЦА: ${brandData.targetAudience}` : ""}

📋 ОПИС СЕГМЕНТУ ВІД КОРИСТУВАЧА:
${segmentDescription}

Створи JSON з параметрами сегменту (тип: ${tier === "pro" ? "PRO - повний набір" : "STANDARD - базовий набір"}):
${fieldsTemplate}

ВАЖЛИВО:
- Всі значення мають бути конкретними та релевантними до опису
- Якщо якийсь параметр не підходить для цього сегменту, залиш null
- Відповідай ТІЛЬКИ валідним JSON без markdown
- Для B2B полів заповнюй тільки якщо це бізнес-сегмент`;

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: "Ти - експерт з маркетингу та сегментації. Відповідаєш ТІЛЬКИ валідним JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const usage = response.usage;
  if (usage) {
    const costRates = {
      input: config.provider === "perplexity" ? 0.001 : 0.0025,
      output: config.provider === "perplexity" ? 0.001 : 0.01,
    };
    const estimatedCost = (usage.prompt_tokens * costRates.input) + (usage.completion_tokens * costRates.output);

    await storage.logAIUsage({
      provider: config.provider,
      model: config.model,
      tokensInput: usage.prompt_tokens,
      tokensOutput: usage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "generateSegmentData",
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Не вдалося згенерувати дані сегменту");
  }

  return JSON.parse(content) as GeneratedSegmentData;
}

// Types for generated product data
export interface GeneratedProductData {
  name: string;
  shortDescription: string;
  fullDescription: string;
  category?: string;
  subcategory?: string;
  price?: string;
  priceType?: string;
  features?: string[];
  benefits?: string[];
  targetAudience?: string;
  useCases?: string[];
  keywords?: string[];
  specifications?: Record<string, string>;
}

export async function generateProductData(
  brandData: {
    name: string;
    description?: string;
    values?: string[];
    mission?: string;
    targetAudience?: string;
  },
  productDescription: string
): Promise<GeneratedProductData> {
  const { client, config } = await getAIClient();

  const prompt = `Ти - експерт з продуктового маркетингу та брендингу. На основі опису продукту створи детальну структуру для картки продукту.

📌 Бренд: ${brandData.name}
${brandData.description ? `📝 Опис бренду: ${brandData.description}` : ""}
${brandData.values?.length ? `🎯 Цінності: ${brandData.values.join(", ")}` : ""}
${brandData.mission ? `🚀 Місія: ${brandData.mission}` : ""}
${brandData.targetAudience ? `👥 ЦА: ${brandData.targetAudience}` : ""}

📋 ОПИС ПРОДУКТУ ВІД КОРИСТУВАЧА:
${productDescription}

Створи JSON з параметрами продукту:
{
  "name": "назва продукту (коротка, продаюча)",
  "shortDescription": "короткий опис (1-2 речення, для превʼю)",
  "fullDescription": "повний опис продукту (2-4 абзаци, маркетинговий текст)",
  "category": "категорія продукту",
  "subcategory": "підкатегорія (якщо є)",
  "price": "рекомендована ціна (якщо можна визначити)",
  "priceType": "fixed | range | from | negotiable",
  "features": ["особливість 1", "особливість 2", "..."],
  "benefits": ["перевага 1", "перевага 2", "..."],
  "targetAudience": "для кого цей продукт",
  "useCases": ["сценарій використання 1", "сценарій 2", "..."],
  "keywords": ["ключове слово 1", "слово 2", "..."],
  "specifications": {"параметр": "значення", "...": "..."}
}

ВАЖЛИВО:
- Всі значення мають бути конкретними та релевантними до опису
- Створюй продаючі тексти, що підкреслюють цінність
- Якщо якийсь параметр неможливо визначити з опису, залиш null
- Відповідай ТІЛЬКИ валідним JSON без markdown`;

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: "Ти - експерт з продуктового маркетингу. Відповідаєш ТІЛЬКИ валідним JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const usage = response.usage;
  if (usage) {
    const costRates = {
      input: config.provider === "perplexity" ? 0.001 : 0.0025,
      output: config.provider === "perplexity" ? 0.001 : 0.01,
    };
    const estimatedCost = (usage.prompt_tokens * costRates.input) + (usage.completion_tokens * costRates.output);

    await storage.logAIUsage({
      provider: config.provider,
      model: config.model,
      tokensInput: usage.prompt_tokens,
      tokensOutput: usage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "generateProductData",
    });
  }

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Не вдалося згенерувати дані продукту");
  }

  return JSON.parse(content) as GeneratedProductData;
}
