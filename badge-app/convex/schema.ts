import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Demo numbers table
  numbers: defineTable({
    value: v.number(),
  }),

  // Geolocation tracking table
  userLocations: defineTable({
    userId: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
    floor: v.string(),
    timestamp: v.string(),
  }).index("by_user_id", ["userId"]),

  // Booth visit tracking table
  boothVisits: defineTable({
    userId: v.string(),
    boothId: v.string(),
    boothName: v.string(),
    companyName: v.string(),
    visitedAt: v.string(),
    endedAt: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    userLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.number(),
    })),
  }).index("by_user_id", ["userId"]).index("by_booth_id", ["boothId"]),

  // Geolocation events log (for analytics)
  geolocationEvents: defineTable({
    userId: v.optional(v.string()),
    eventName: v.string(),
    eventData: v.object({
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      accuracy: v.optional(v.number()),
      booth_id: v.optional(v.string()),
      booth_name: v.optional(v.string()),
      error_message: v.optional(v.string()),
    }),
    timestamp: v.string(),
  }).index("by_event_name", ["eventName"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    resumeText: v.optional(v.string()),
    resumeFileId: v.optional(v.string()),
    identity: v.optional(v.any()),
    identityVersion: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Visitor profiles (evolving identity)
  visitors: defineTable({
    odentifier: v.string(), // visitorId from localStorage or clerkId
    name: v.optional(v.string()),
    email: v.optional(v.string()),

    // Self-declared identity (from resume/profile)
    declaredSkills: v.optional(v.array(v.string())),
    declaredInterests: v.optional(v.array(v.string())),

    // AI-perceived identity (from conversations)
    perceivedSkills: v.optional(v.array(v.string())),
    perceivedInterests: v.optional(v.array(v.string())),
    perceivedStrengths: v.optional(v.array(v.string())),

    // Aggregated metrics for recommendations
    totalInteractions: v.number(),
    positiveInteractionRate: v.number(), // 0-1
    topTags: v.optional(v.array(v.string())), // Most frequent tags
    identityVersion: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_identifier", ["odentifier"]),

  interactions: defineTable({
    userId: v.string(),
    boothId: v.string(),
    boothName: v.string(),

    // Raw content
    transcript: v.optional(v.string()),
    notes: v.optional(v.string()),

    // LLM-processed fields
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    sentiment: v.optional(v.string()),
    confidence: v.optional(v.number()),
    keyTopics: v.optional(v.array(v.string())),
    actionItems: v.optional(v.array(v.string())),

    // Profile-aware fields
    mentionedSkills: v.optional(v.array(v.string())),
    mentionedInterests: v.optional(v.array(v.string())),
    connectionPotential: v.optional(v.string()),
    suggestedFollowUp: v.optional(v.string()),
    profileAlignmentScore: v.optional(v.number()),
    careerRelevance: v.optional(v.array(v.string())),

    // Metadata
    hasAudio: v.boolean(),
    transcriptSource: v.string(),
    recordingDurationSec: v.number(),
    processingStatus: v.string(),
    llmModel: v.optional(v.string()),

    createdAt: v.number(),

    // OLD FIELDS (for backwards compatibility) - TEMPORARY
    visitorId: v.optional(v.string()), // OLD - will migrate to userId
    visitorBoothId: v.optional(v.string()), // OLD - will migrate to boothId
  })
    .index("by_user", ["userId"])
    .index("by_booth", ["boothId"])
    .index("by_user_time", ["userId", "createdAt"]),

  booths: defineTable({
    name: v.string(),
    company: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    lookingFor: v.optional(v.array(v.string())),
    representatives: v.optional(v.array(v.object({
      name: v.string(),
      role: v.string(),
      bio: v.optional(v.string()),
    }))),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_company", ["company"]),

  recommendations: defineTable({
    userId: v.string(),
    boothId: v.string(),
    score: v.number(),
    reasoning: v.array(v.string()),
    basedOn: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user_fresh", ["userId", "expiresAt"])
    .index("by_user_score", ["userId", "score"]),

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
