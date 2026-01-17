import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save user geolocation data to backend
 */
export const saveUserLocation = mutation({
  args: {
    userId: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
    floor: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const locationId = await ctx.db.insert("userLocations", {
      userId: args.userId,
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,
      floor: args.floor,
      timestamp: args.timestamp,
    });
    
    return locationId;
  },
});

/**
 * Save booth visit data
 */
export const saveBoothVisit = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const visitId = await ctx.db.insert("boothVisits", {
      userId: args.userId,
      boothId: args.boothId,
      boothName: args.boothName,
      companyName: args.companyName,
      visitedAt: args.visitedAt,
      endedAt: args.endedAt,
      durationSeconds: args.durationSeconds,
      userLocation: args.userLocation,
    });
    
    return visitId;
  },
});

/**
 * Log geolocation event for analytics
 */
export const logGeolocationEvent = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("geolocationEvents", {
      userId: args.userId,
      eventName: args.eventName,
      eventData: args.eventData,
      timestamp: args.timestamp,
    });
    
    return eventId;
  },
});

/**
 * Get all locations for a user
 */
export const getUserLocations = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const locations = await ctx.db
      .query("userLocations")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return locations;
  },
});

/**
 * Get all booth visits for a user
 */
export const getUserBoothVisits = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const visits = await ctx.db
      .query("boothVisits")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    return visits;
  },
});

/**
 * Get all visits for a specific booth
 */
export const getBoothVisits = query({
  args: {
    boothId: v.string(),
  },
  handler: async (ctx, args) => {
    const visits = await ctx.db
      .query("boothVisits")
      .withIndex("by_booth_id", (q) => q.eq("boothId", args.boothId))
      .collect();
    
    return visits;
  },
});

/**
 * Get events by type for analytics
 */
export const getEventsByType = query({
  args: {
    eventName: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("geolocationEvents")
      .withIndex("by_event_name", (q) => q.eq("eventName", args.eventName))
      .collect();
    
    return events;
  },
});
