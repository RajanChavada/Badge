import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Existing numbers table (used by myFunctions.ts demo)
  numbers: defineTable({
    value: v.number(),
  }),

  // Users table for identity
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    resumeText: v.optional(v.string()),
    identity: v.optional(
      v.object({
        skills: v.array(v.string()),
        interests: v.array(v.string()),
        goals: v.array(v.string()),
        headline: v.string(),
        lastUpdated: v.number(),
      })
    ),
    // Aggregated from recruiter feedback
    perceivedIdentity: v.optional(
      v.object({
        tags: v.array(v.string()),
        strengths: v.array(v.string()),
        lastUpdated: v.number(),
      })
    ),
    identityVersion: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Booths at the event
  booths: defineTable({
    name: v.string(),
    company: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_company", ["company"]),

  // Rich interactions with LLM-processed data
  interactions: defineTable({
    visitorId: v.string(),
    visitorBoothId: v.string(),
    boothName: v.string(),

    // Raw content
    transcript: v.optional(v.string()),
    notes: v.optional(v.string()),

    // LLM-processed fields (for feedback loop)
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    sentiment: v.optional(v.string()),
    confidence: v.optional(v.number()),
    keyTopics: v.optional(v.array(v.string())),
    actionItems: v.optional(v.array(v.string())),

    // Metadata
    hasAudio: v.boolean(),
    transcriptSource: v.string(),
    recordingDurationSec: v.number(),
    processingStatus: v.string(),
    llmModel: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_booth", ["visitorBoothId"])
    .index("by_visitor_time", ["visitorId", "createdAt"]),

  // Identity evolution snapshots (for "you arrived as X, leaving as Y")
  identitySnapshots: defineTable({
    visitorId: v.string(),
    timestamp: v.number(),
    trigger: v.string(),
    interactionId: v.optional(v.id("interactions")),

    // Snapshot of identity at this point
    skills: v.array(v.string()),
    interests: v.array(v.string()),
    perceivedTags: v.array(v.string()),
    interactionCount: v.number(),
    version: v.number(),
  }).index("by_visitor_time", ["visitorId", "timestamp"]),
});