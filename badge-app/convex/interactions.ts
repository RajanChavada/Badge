import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Insert interaction into database
export const insert = mutation({
  args: {
    visitorId: v.string(),
    visitorBoothId: v.string(),
    boothName: v.string(),
    transcript: v.optional(v.string()),
    notes: v.optional(v.string()),
    hasAudio: v.boolean(),
    transcriptSource: v.string(),
    recordingDurationSec: v.number(),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    sentiment: v.optional(v.string()),
    confidence: v.optional(v.number()),
    keyTopics: v.optional(v.array(v.string())),
    actionItems: v.optional(v.array(v.string())),
    processingStatus: v.string(),
    llmModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("interactions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get all interactions for a visitor
export const listByVisitor = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interactions")
      .withIndex("by_visitor_time", (q) => q.eq("visitorId", args.visitorId))
      .order("desc")
      .collect();
  },
});

// Get aggregated tags for identity evolution
export const getAggregatedTags = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();

    const tagCounts: Record<string, number> = {};
    let positiveCount = 0;

    for (const interaction of interactions) {
      if (interaction.tags) {
        for (const tag of interaction.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
      if (interaction.sentiment === "positive") positiveCount++;
    }

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    return {
      tags: sortedTags,
      totalInteractions: interactions.length,
      positiveRatio: interactions.length > 0 ? positiveCount / interactions.length : 0,
    };
  },
});

/**
 * Main action: Save and process an interaction with LLM
 */
export const saveProcessedInteraction = action({
  args: {
    visitorId: v.string(),
    visitorBoothId: v.string(),
    boothName: v.string(),
    transcript: v.string(),
    hasAudio: v.boolean(),
    recordingDurationSec: v.number(),
  },
  handler: async (ctx, args) => {
    console.log("[Interaction] Processing...", {
      visitorId: args.visitorId,
      boothName: args.boothName,
      transcriptLen: args.transcript.length,
    });

    // Step 1: Call LLM to enrich
    let enriched;
    let llmModel = "none";

    try {
      enriched = await ctx.runAction(api.llm.enrichTranscript, {
        transcript: args.transcript,
        boothName: args.boothName,
      });
      llmModel = process.env.OPENROUTER_API_KEY ? "openrouter" : "gemini";
      console.log("[Interaction] Enriched:", enriched);
    } catch (err) {
      console.error("[Interaction] LLM failed:", err);
      enriched = {
        summary: "Interaction recorded (processing failed)",
        tags: [],
        sentiment: "neutral",
        confidence: 0,
        keyTopics: [],
        actionItems: [],
      };
    }

    // Step 2: Save to database
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
      processingStatus: "complete",
      llmModel,
    });

    console.log("[Interaction] Saved:", interactionId);

    return {
      interactionId,
      summary: enriched.summary,
      tags: enriched.tags,
      sentiment: enriched.sentiment,
      confidence: enriched.confidence,
      keyTopics: enriched.keyTopics,
      actionItems: enriched.actionItems,
      llmModel,
    };
  },
}) as any;