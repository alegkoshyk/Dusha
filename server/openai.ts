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
  brandData: { name: string; description?: string; values?: string[]; mission?: string },
  audienceType: "primary" | "secondary" | "niche" = "primary",
  existingSegments?: { name: string; description?: string }[]
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

  const prompt = `Ти - експерт з маркетингу та сегментації аудиторії. Створи детальний портрет представника ${audienceTypeDesc} цільової аудиторії для бренду.

📌 Бренд: ${brandData.name}
${brandData.description ? `📝 Опис: ${brandData.description}` : ""}
${brandData.values?.length ? `🎯 Цінності: ${brandData.values.join(", ")}` : ""}
${brandData.mission ? `🚀 Місія: ${brandData.mission}` : ""}
${segmentsContext}

Створи JSON з детальним портретом персони:
{
  "name": "типове українське ім'я",
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
