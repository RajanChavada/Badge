import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Main action: Save interaction + enrich with LLM + generate recommendations
 * This is the FEEDBACK LOOP entry point - separated to avoid circular dependencies
 */
export const process = action({
  args: {
    visitorId: v.string(),
    visitorBoothId: v.string(),
    boothName: v.string(),
    transcript: v.string(),
    hasAudio: v.boolean(),
    recordingDurationSec: v.number(),
  },
  handler: async (ctx, args): Promise<{
    interactionId: string;
    summary: string;
    tags: string[];
    sentiment: string;
    confidence: number;
    keyTopics: string[];
    actionItems: string[];
    mentionedSkills: string[];
    mentionedInterests: string[];
    connectionPotential: string;
    suggestedFollowUp: string;
    llmModel: string;
    interactionNumber: number;
  }> => {
    console.log("[Process] Processing transcript for feedback loop...");

    // 1. Get visitor's previous interactions for context
    const previousInteractions = await ctx.runQuery(api.interactions.listByVisitor, {
      visitorId: args.visitorId,
    });

    const previousTags: string[] = previousInteractions.flatMap((i: { tags?: string[] }) => i.tags || []);
    const uniquePreviousTags = [...new Set(previousTags)];

    // 2. Enrich transcript with LLM (with visitor context!)
    let enriched: {
      summary: string;
      tags: string[];
      sentiment: string;
      confidence: number;
      keyTopics: string[];
      actionItems: string[];
      mentionedSkills: string[];
      mentionedInterests: string[];
      connectionPotential: string;
      suggestedFollowUp: string;
    };
    let llmModel = "openrouter";

    try {
      enriched = await ctx.runAction(api.llm.enrichTranscript, {
        transcript: args.transcript,
        boothName: args.boothName,
        visitorContext: {
          previousTags: uniquePreviousTags.slice(0, 10),
          interactionCount: previousInteractions.length,
        },
      });
      console.log("[Process] LLM enrichment complete:", enriched);
    } catch (err) {
      console.error("[Process] LLM failed:", err);
      enriched = {
        summary: "Interaction recorded",
        tags: [],
        sentiment: "neutral",
        confidence: 0,
        keyTopics: [],
        actionItems: [],
        mentionedSkills: [],
        mentionedInterests: [],
        connectionPotential: "medium",
        suggestedFollowUp: "Follow up soon",
      };
      llmModel = "fallback";
    }

    // 3. Save to database
    const interactionId = await ctx.runMutation(api.interactions.insert, {
      visitorId: args.visitorId,
      visitorBoothId: args.visitorBoothId,
      boothName: args.boothName,
      transcript: args.transcript,
      hasAudio: args.hasAudio,
      transcriptSource: "elevenlabs",
      recordingDurationSec: args.recordingDurationSec,
      summary: enriched.summary,
      tags: enriched.tags,
      sentiment: enriched.sentiment,
      confidence: enriched.confidence,
      keyTopics: enriched.keyTopics,
      actionItems: enriched.actionItems,
      mentionedSkills: enriched.mentionedSkills,
      mentionedInterests: enriched.mentionedInterests,
      connectionPotential: enriched.connectionPotential,
      suggestedFollowUp: enriched.suggestedFollowUp,
      processingStatus: "complete",
      llmModel,
    });

    console.log("[Process] Saved:", interactionId);

    // 4. FEEDBACK LOOP: Generate new recommendations based on updated profile
    const newInteractionCount = previousInteractions.length + 1;
    
    // Generate recommendations after every 2 interactions or first interaction
    if (newInteractionCount === 1 || newInteractionCount % 2 === 0) {
      console.log("[Process] Triggering recommendation refresh...");
      try {
        // Note: File is named reccomendations.ts (typo), so API is reccomendations
        await ctx.runAction(api.reccomendations.generateForVisitor, {
          visitorId: args.visitorId,
        });
      } catch (err) {
        console.error("[Process] Recommendation generation failed:", err);
      }
    }

    return {
      interactionId: interactionId.toString(),
      ...enriched,
      llmModel,
      interactionNumber: newInteractionCount,
    };
  },
});
