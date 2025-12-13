import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const MODEL = "gpt-5";

let openaiClient: OpenAI | null = null;
let cachedApiKey: string | null = null;

async function getOpenAIApiKey(): Promise<string | null> {
  // First check database
  const dbSetting = await storage.getAppSetting("OPENAI_API_KEY");
  if (dbSetting?.value) {
    return dbSetting.value;
  }
  // Fall back to environment variable
  return process.env.OPENAI_API_KEY || null;
}

async function getOpenAIClient(): Promise<OpenAI> {
  const apiKey = await getOpenAIApiKey();
  
  // Reset client if API key changed
  if (apiKey !== cachedApiKey) {
    openaiClient = null;
    cachedApiKey = apiKey;
  }
  
  if (!openaiClient) {
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function isOpenAIConfigured(): Promise<boolean> {
  const apiKey = await getOpenAIApiKey();
  return !!apiKey;
}

export function resetOpenAIClient(): void {
  openaiClient = null;
  cachedApiKey = null;
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

export async function analyzeBrandLevel(
  level: "soul" | "mind" | "body",
  responses: { cardTitle: string; response: any }[]
): Promise<LevelInsight> {
  const openai = await getOpenAIClient();

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

  const prompt = `Ти - експерт з бренд-стратегії. Проаналізуй відповіді користувача для рівня "${levelNames[level]}" бренду.

Рівень "${levelNames[level]}" включає: ${levelDescriptions[level]}.

Відповіді користувача:
${responses.map(r => `- ${r.cardTitle}: ${JSON.stringify(r.response)}`).join("\n")}

Дай структурований аналіз у форматі JSON з такими полями:
- summary: короткий підсумок (2-3 речення українською)
- strengths: масив сильних сторін (українською, максимум 5)
- weaknesses: масив слабких сторін або прогалин (українською, максимум 5)
- recommendations: масив конкретних рекомендацій для покращення (українською, максимум 5)
- consistencyScore: оцінка узгодженості від 0 до 100

Відповідай ТІЛЬКИ валідним JSON об'єктом.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "Ти - експерт з бренд-стратегії. Відповідай тільки валідним JSON без додаткового тексту."
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2048
  });

  // Log AI usage
  const usage = response.usage;
  if (usage) {
    const costPerInputToken = 0.00001;
    const costPerOutputToken = 0.00003;
    const estimatedCost = (usage.prompt_tokens * costPerInputToken) + (usage.completion_tokens * costPerOutputToken);
    
    await storage.logAIUsage({
      provider: "openai",
      model: MODEL,
      tokensInput: usage.prompt_tokens,
      tokensOutput: usage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "analyzeBrandLevel",
    });
  }

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
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
  allResponses: { level: string; cardTitle: string; response: any }[]
): Promise<BrandInsights> {
  const openai = await getOpenAIClient();

  const soulResponses = allResponses.filter(r => r.level === "soul");
  const mindResponses = allResponses.filter(r => r.level === "mind");
  const bodyResponses = allResponses.filter(r => r.level === "body");

  const levelInsights: LevelInsight[] = [];
  
  if (soulResponses.length > 0) {
    levelInsights.push(await analyzeBrandLevel("soul", soulResponses));
  }
  if (mindResponses.length > 0) {
    levelInsights.push(await analyzeBrandLevel("mind", mindResponses));
  }
  if (bodyResponses.length > 0) {
    levelInsights.push(await analyzeBrandLevel("body", bodyResponses));
  }

  const overallPrompt = `Ти - експерт з бренд-стратегії. На основі аналізу всіх трьох рівнів бренду, створи загальний висновок.

Аналіз рівнів:
${levelInsights.map(l => `
${l.levelName} (оцінка: ${l.consistencyScore}/100):
- Підсумок: ${l.summary}
- Сильні сторони: ${l.strengths.join(", ")}
- Слабкі сторони: ${l.weaknesses.join(", ")}
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

  const overallResponse = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "Ти - експерт з бренд-стратегії. Відповідай тільки валідним JSON без додаткового тексту."
      },
      { role: "user", content: overallPrompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096
  });

  // Log AI usage
  const overallUsage = overallResponse.usage;
  if (overallUsage) {
    const costPerInputToken = 0.00001;
    const costPerOutputToken = 0.00003;
    const estimatedCost = (overallUsage.prompt_tokens * costPerInputToken) + (overallUsage.completion_tokens * costPerOutputToken);
    
    await storage.logAIUsage({
      provider: "openai",
      model: MODEL,
      tokensInput: overallUsage.prompt_tokens,
      tokensOutput: overallUsage.completion_tokens,
      costEstimate: estimatedCost.toFixed(6),
      endpoint: "generateBrandInsights",
    });
  }

  const overallContent = overallResponse.choices[0].message.content;
  if (!overallContent) {
    throw new Error("Empty response from OpenAI");
  }

  const overallResult = JSON.parse(overallContent);

  return {
    overallScore: Math.min(100, Math.max(0, overallResult.overallScore || 50)),
    overallSummary: overallResult.overallSummary || "",
    levels: levelInsights,
    checklist: overallResult.checklist || [],
    nextSteps: overallResult.nextSteps || []
  };
}
