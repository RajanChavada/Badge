import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const insert = mutation({
  args: {
    userId: v.string(),
    boothId: v.string(),
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
    profileAlignmentScore: v.optional(v.number()),
    careerRelevance: v.optional(v.array(v.string())),
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

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interactions")
      .withIndex("by_user_time", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});