import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Insert interaction into database
 */
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
    mentionedSkills: v.optional(v.array(v.string())),
    mentionedInterests: v.optional(v.array(v.string())),
    connectionPotential: v.optional(v.string()),
    suggestedFollowUp: v.optional(v.string()),
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

// Get aggregated stats for a visitor
export const getVisitorStats = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();

    const tagCounts: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};
    const interestCounts: Record<string, number> = {};
    let positiveCount = 0;
    let highPotentialCount = 0;

    for (const interaction of interactions) {
      if (interaction.sentiment === "positive") positiveCount++;
      if (interaction.connectionPotential === "high") highPotentialCount++;

      for (const tag of interaction.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
      for (const skill of interaction.mentionedSkills || []) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
      for (const interest of interaction.mentionedInterests || []) {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      }
    }

    const sortByCount = (counts: Record<string, number>) =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([item, count]) => ({ item, count }));

    return {
      totalInteractions: interactions.length,
      positiveRate: interactions.length > 0 ? positiveCount / interactions.length : 0,
      highPotentialRate: interactions.length > 0 ? highPotentialCount / interactions.length : 0,
      topTags: sortByCount(tagCounts).slice(0, 10),
      topSkills: sortByCount(skillCounts).slice(0, 5),
      topInterests: sortByCount(interestCounts).slice(0, 5),
    };
  },
});
