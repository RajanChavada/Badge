import { v } from "convex/values";
import { action } from "./_generated/server";

declare const process: any;

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
    const geminiKey = (process as any).env.GEMINI_API_KEY;

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
  const contextSection = visitorContext && visitorContext.previousTags.length > 0
    ? `\n(For context only - previous topics discussed: ${visitorContext.previousTags.slice(0, 5).join(", ")})`
    : "";

  return `You are an AI networking coach at a hackathon/career fair event.

CURRENT CONVERSATION (THIS IS THE MOST IMPORTANT PART):
Person/Booth: ${boothName}

Transcript:
"""
${transcript}
"""
${contextSection}

Analyze THIS conversation and suggest what the person should do NEXT based on what was discussed.

Return ONLY valid JSON:
{
  "summary": "1-2 sentence summary of THIS conversation",
  "tags": ["topic-from-this-conversation-1", "topic-2", "topic-3"],
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "keyTopics": ["main-topic-from-transcript-1", "main-topic-2"],
  "actionItems": ["action based on THIS conversation"],
  "mentionedSkills": ["skills mentioned in THIS transcript"],
  "mentionedInterests": ["interests mentioned in THIS transcript"],
  "connectionPotential": "high" | "medium" | "low",
  "suggestedFollowUp": "NEXT BEST ACTION based on THIS conversation"
}

CRITICAL RULES FOR suggestedFollowUp:
1. The next action MUST be directly related to what was discussed in THIS transcript
2. If they talked about ballet, suggest ballet-related connections
3. If they talked about LeetCode, suggest coding practice or engineer connections
4. DO NOT suggest things unrelated to the transcript
5. Be specific: "Find someone on a dance/creative team" NOT "Find a Google Cloud recruiter" if they didn't mention that

Examples based on transcript content:
- Transcript mentions ballet → "Find someone interested in performing arts or creative projects"
- Transcript mentions LeetCode → "Connect with engineers who practice competitive programming"
- Transcript mentions recruiters → "Follow up with the recruiter about application timeline"`;
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
      suggestedFollowUp: parsed.suggestedFollowUp || "Find someone with complementary skills to connect with next",
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
    suggestedFollowUp: "Find someone with complementary skills to expand your network",
  };
}