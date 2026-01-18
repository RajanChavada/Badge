import { v } from "convex/values";
import { action } from "./_generated/server";

interface EnrichedInteraction {
  summary: string;
  tags: string[];
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  keyTopics: string[];
  actionItems: string[];
}

/**
 * Process transcript with OpenRouter/Gemini to extract structured insights
 */
export const enrichTranscript = action({
  args: {
    transcript: v.string(),
    boothName: v.string(),
  },
  handler: async (_, args): Promise<EnrichedInteraction> => {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openrouterKey) {
      return await callOpenRouter(openrouterKey, args.transcript, args.boothName);
    } else if (geminiKey) {
      return await callGemini(geminiKey, args.transcript, args.boothName);
    }

    console.warn("No LLM API keys configured");
    return {
      summary: "Interaction recorded",
      tags: [],
      sentiment: "neutral",
      confidence: 0,
      keyTopics: [],
      actionItems: [],
    };
  },
});

async function callOpenRouter(
  apiKey: string,
  transcript: string,
  boothName: string
): Promise<EnrichedInteraction> {
  const prompt = buildPrompt(transcript, boothName);

  console.log("[LLM] Calling OpenRouter...");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://badge-app.dev",
      "X-Title": "Badge - Event Networking",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: "You analyze networking conversation recaps. Return ONLY valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[LLM] OpenRouter error:", error);
    throw new Error(`OpenRouter error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  console.log("[LLM] Response:", content.slice(0, 200));

  return parseResponse(content);
}

async function callGemini(
  apiKey: string,
  transcript: string,
  boothName: string
): Promise<EnrichedInteraction> {
  const prompt = buildPrompt(transcript, boothName);

  console.log("[LLM] Calling Gemini...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[LLM] Gemini error:", error);
    throw new Error(`Gemini error: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  console.log("[LLM] Response:", content.slice(0, 200));

  return parseResponse(content);
}

function buildPrompt(transcript: string, boothName: string): string {
  return `Analyze this networking conversation from a career fair.
Booth: ${boothName}

Transcript:
"""
${transcript}
"""

Return ONLY valid JSON (no markdown):
{
  "summary": "1-2 sentence summary",
  "tags": ["skill-tag", "interest-tag"],
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "keyTopics": ["topic1", "topic2"],
  "actionItems": ["follow-up if any"]
}

Tag guidelines: lowercase, hyphenated (e.g., "machine-learning"), max 5 tags.`;
}

function parseResponse(content: string): EnrichedInteraction {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || "Interaction recorded",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "neutral",
      confidence: typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  } catch (err) {
    console.error("[LLM] Parse error:", err);
    return {
      summary: "Interaction recorded",
      tags: [],
      sentiment: "neutral",
      confidence: 0,
      keyTopics: [],
      actionItems: [],
    };
  }
}