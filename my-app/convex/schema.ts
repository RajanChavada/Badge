import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
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
});
