import OpenAI from "openai";
import { storage } from "./storage";

// AI Configuration interface
interface AIConfig {
  provider: "openai" | "perplexity";
  model: string;
  context: string;
  apiKey: string;
}

// Default models
const DEFAULT_OPENAI_MODEL = "gpt-4o";
const DEFAULT_PERPLEXITY_MODEL = "sonar-pro";

let aiClient: OpenAI | null = null;
let cachedConfig: AIConfig | null = null;

async function getAIConfig(): Promise<AIConfig> {
  const [
    providerSetting,
    modelOpenAISetting,
    modelPerplexitySetting,
    contextSetting,
    openaiKeySetting,
    perplexityKeySetting
  ] = await Promise.all([
    storage.getAppSetting("AI_PROVIDER"),
    storage.getAppSetting("AI_MODEL_OPENAI"),
    storage.getAppSetting("AI_MODEL_PERPLEXITY"),
    storage.getAppSetting("AI_CONTEXT"),
    storage.getAppSetting("OPENAI_API_KEY"),
    storage.getAppSetting("PERPLEXITY_API_KEY")
  ]);

  const provider = (providerSetting?.value as "openai" | "perplexity") || "openai";
  
  let model: string;
  let apiKey: string;
  
  if (provider === "perplexity") {
    model = modelPerplexitySetting?.value || DEFAULT_PERPLEXITY_MODEL;
    apiKey = perplexityKeySetting?.value || process.env.PERPLEXITY_API_KEY || "";
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

async function getAIClient(): Promise<{ client: OpenAI; config: AIConfig }> {
  const config = await getAIConfig();
  
  // Reset client if config changed
  const configKey = `${config.provider}-${config.apiKey}`;
  const cachedKey = cachedConfig ? `${cachedConfig.provider}-${cachedConfig.apiKey}` : null;
  
  if (configKey !== cachedKey) {
    aiClient = null;
    cachedConfig = config;
  }
  
  if (!aiClient) {
    if (!config.apiKey) {
      throw new Error(`${config.provider === "perplexity" ? "Perplexity" : "OpenAI"} API ключ не налаштовано`);
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
  brandContext: BrandContext
): Promise<{ response: string; tokensUsed?: { input: number; output: number } }> {
  const { client, config } = await getAIClient();

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

  // Build messages array ensuring alternation for Perplexity compatibility
  const historyMessages = chatHistory.slice(-10).filter(m => m.role !== "system");
  const allMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt }
  ];
  
  // Add history ensuring user/assistant alternation
  let lastRole: string | null = "system";
  for (const msg of historyMessages) {
    // Skip if same role as last (except first after system)
    if (msg.role === lastRole && lastRole !== "system") {
      // Merge with previous message of same role
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
  
  // Add new user message (merge if last was also user)
  if (lastRole === "user" && allMessages.length > 1) {
    const lastMsg = allMessages[allMessages.length - 1];
    lastMsg.content += "\n\n" + userMessage;
  } else {
    allMessages.push({ role: "user", content: userMessage });
  }
  
  const messages = allMessages;

  const response = await client.chat.completions.create({
    model: config.model,
    messages,
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
