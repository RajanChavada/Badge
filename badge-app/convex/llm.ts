import { v } from "convex/values";
import { action } from "./_generated/server";

export interface EnrichedInteraction {
  summary: string;
  tags: string[];
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  keyTopics: string[];
  actionItems: string[];
  // New: extracted insights for recommendations
  mentionedSkills: string[];
  mentionedInterests: string[];
  connectionPotential: "high" | "medium" | "low";
  suggestedFollowUp: string;
}

/**
 * Process transcript with OpenRouter to extract structured insights
 * This is the core of the feedback loop
 */
export const enrichTranscript = action({
  args: {
    transcript: v.string(),
    boothName: v.string(),
    visitorContext: v.optional(v.object({
      previousTags: v.array(v.string()),
      interactionCount: v.number(),
    })),
  },
  handler: async (_, args): Promise<EnrichedInteraction> => {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      console.error("❌ GEMINI_API_KEY is missing. Please set it in the Convex Dashboard.");
      throw new Error("Configuration Error: GEMINI_API_KEY is missing. Check backend logs.");
    }

    console.log(`[LLM] Using Gemini Key starting with: ${geminiKey.substring(0, 4)}...`);

    try {
      return await callGemini(geminiKey, args.transcript, args.boothName, args.visitorContext);
    } catch (err) {
      console.error("[LLM] Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      return getDefaultResponse(`Analysis failed: ${errorMsg}`);
    }
  },
});

async function callGemini(
  apiKey: string,
  transcript: string,
  boothName: string,
  visitorContext?: { previousTags: string[]; interactionCount: number }
): Promise<EnrichedInteraction> {
  const prompt = buildPrompt(transcript, boothName, visitorContext);

  console.log("[LLM] Calling Gemini with transcript length:", transcript.length);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[LLM] Gemini API error:", response.status, error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  console.log("[LLM] Response received, parsing...");

  return parseResponse(content);
}

function buildPrompt(
  transcript: string,
  boothName: string,
  visitorContext?: { previousTags: string[]; interactionCount: number }
): string {
  const contextSection = visitorContext
    ? `
Visitor Context:
- Previous interaction tags: ${visitorContext.previousTags.join(", ") || "none"}
- Number of previous interactions: ${visitorContext.interactionCount}
`
    : "";

  return `You are an AI that analyzes networking conversations at career fairs and hackathons.
Your job is to extract insights that help attendees make better connections.

Booth/Person: ${boothName}
${contextSection}
Transcript:
"""
${transcript}
"""

Extract the following and return ONLY valid JSON:
{
  "summary": "1-2 sentence summary of the conversation",
  "tags": ["skill-or-interest-tag-1", "tag-2", "tag-3"],
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "keyTopics": ["main-topic-1", "main-topic-2"],
  "actionItems": ["follow-up action if mentioned"],
  "mentionedSkills": ["specific skills discussed"],
  "mentionedInterests": ["interests or passions mentioned"],
  "connectionPotential": "high" | "medium" | "low",
  "suggestedFollowUp": "specific suggestion for what to do next"
}

Guidelines:
- tags: lowercase, hyphenated (e.g., "machine-learning", "web-development")
- sentiment: "positive" = good rapport, mutual interest; "neutral" = informational; "negative" = mismatch
- connectionPotential: based on how well the conversation went and mutual fit
- suggestedFollowUp: actionable next step (e.g., "Send portfolio link", "Ask about internship timeline")`;
}

function parseResponse(content: string): EnrichedInteraction {
  try {
    // Clean up response if needed (API usually handles JSON mode well but safety first)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[LLM] No JSON found in response");
      return getDefaultResponse();
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || "Interaction recorded",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "neutral",
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5,
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      mentionedSkills: Array.isArray(parsed.mentionedSkills) ? parsed.mentionedSkills : [],
      mentionedInterests: Array.isArray(parsed.mentionedInterests) ? parsed.mentionedInterests : [],
      connectionPotential: ["high", "medium", "low"].includes(parsed.connectionPotential)
        ? parsed.connectionPotential
        : "medium",
      suggestedFollowUp: parsed.suggestedFollowUp || "Follow up within a week",
    };
  } catch (err) {
    console.error("[LLM] Parse error:", err);
    return getDefaultResponse();
  }
}

function getDefaultResponse(summaryOverride?: string): EnrichedInteraction {
  return {
    summary: summaryOverride || "Interaction recorded",
    tags: [],
    sentiment: "neutral",
    confidence: 0,
    keyTopics: [],
    actionItems: [],
    mentionedSkills: [],
    mentionedInterests: [],
    connectionPotential: "medium",
    suggestedFollowUp: "Follow up within a week",
  };
}