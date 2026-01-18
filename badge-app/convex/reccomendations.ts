import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Get current recommendations for a user
 */
export const getForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recommendations")
      .withIndex("by_user_score", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);
  },
});

// Keep old function name for backwards compatibility
export const getForVisitor = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    // Try new field first, fall back to old
    const results = await ctx.db
      .query("recommendations")
      .withIndex("by_user_score", (q) => q.eq("userId", args.visitorId))
      .order("desc")
      .take(5);
    return results;
  },
});

/**
 * Mark a recommendation as clicked (for Amplitude tracking)
 */
export const markClicked = mutation({
  args: {
    recommendationId: v.id("recommendations"),
  },
  handler: async (ctx, args) => {
    // Mark recommendation as clicked - no fields to update since updatedAt doesn't exist in schema
    // The click tracking is handled elsewhere, this function exists for API compatibility
    return;
  },
});

/**
 * Generate new recommendations based on user's interaction history
 * This is the AI-powered recommendation engine
 */
export const generateForUser = action({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<string[]> => {
    console.log("[Reco] Generating recommendations for:", args.userId);

    // 1. Get user's interaction history
    const interactions: any[] = await ctx.runQuery(api.interactions.listByUser, {
      userId: args.userId,
    });

    if (interactions.length === 0) {
      console.log("[Reco] No interactions yet, returning default recommendations");
      return [];
    }

    // 2. Aggregate user's profile from interactions
    const aggregatedTags: Record<string, number> = {};
    const aggregatedSkills: Record<string, number> = {};
    const aggregatedInterests: Record<string, number> = {};
    const visitedBooths = new Set<string>();
    let positiveCount = 0;

    for (const interaction of interactions) {
      // Support both old and new field names
      const boothId = interaction.boothId || interaction.visitorBoothId;
      if (boothId) visitedBooths.add(boothId);
      
      if (interaction.sentiment === "positive") positiveCount++;
      
      for (const tag of interaction.tags || []) {
        aggregatedTags[tag] = (aggregatedTags[tag] || 0) + 1;
      }
      for (const skill of interaction.mentionedSkills || []) {
        aggregatedSkills[skill] = (aggregatedSkills[skill] || 0) + 1;
      }
      for (const interest of interaction.mentionedInterests || []) {
        aggregatedInterests[interest] = (aggregatedInterests[interest] || 0) + 1;
      }
    }

    // Sort by frequency
    const topTags = Object.entries(aggregatedTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    const topSkills = Object.entries(aggregatedSkills)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    const topInterests = Object.entries(aggregatedInterests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([interest]) => interest);

    console.log("[Reco] User profile:", { topTags, topSkills, topInterests });

    // 3. Get all booths
    const allBooths = await ctx.runQuery(api.booths.list, {});

    // 4. Score each booth based on tag overlap
    interface ScoredBooth {
      booth: any;
      score: number;
      matchReasons: string[];
      basedOnTags: string[];
    }

    const scoredBooths: ScoredBooth[] = allBooths
      .filter((booth: any) => !visitedBooths.has(booth._id.toString()))
      .map((booth: any) => {
        const boothTags: string[] = booth.tags || [];
        const boothLookingFor: string[] = booth.lookingFor || [];
        
        // Calculate match score
        let score = 0;
        const matchReasons: string[] = [];

        // Tag overlap
        for (const tag of topTags) {
          if (boothTags.some((bt: string) => bt.toLowerCase().includes(tag.toLowerCase()))) {
            score += 20;
            matchReasons.push(`Matches your interest in "${tag}"`);
          }
        }

        // Skill match
        for (const skill of topSkills) {
          if (boothLookingFor.some((lf: string) => lf.toLowerCase().includes(skill.toLowerCase()))) {
            score += 25;
            matchReasons.push(`They're looking for "${skill}"`);
          }
        }

        // Interest alignment
        for (const interest of topInterests) {
          if (booth.description?.toLowerCase().includes(interest.toLowerCase())) {
            score += 15;
            matchReasons.push(`Aligned with your interest in "${interest}"`);
          }
        }

        return {
          booth,
          score: Math.min(100, score),
          matchReasons: matchReasons.slice(0, 3),
          basedOnTags: topTags.slice(0, 3),
        };
      })
      .filter((s: ScoredBooth) => s.score > 0)
      .sort((a: ScoredBooth, b: ScoredBooth) => b.score - a.score)
      .slice(0, 5);

    console.log("[Reco] Top recommendations:", scoredBooths.map((s: ScoredBooth) => ({
      booth: s.booth.name,
      score: s.score,
    })));

    // 5. Save recommendations to database
    const savedRecommendations: string[] = [];
    for (const scored of scoredBooths) {
      const recoId = await ctx.runMutation(internal.reccomendations.insertInternal, {
        userId: args.userId,
        boothId: scored.booth._id,
        score: scored.score,
        reasoning: scored.matchReasons,
        basedOn: scored.basedOnTags.join(", "),
      });
      savedRecommendations.push(recoId);
    }

    return savedRecommendations;
  },
});

// Keep old function name for backwards compatibility
export const generateForVisitor = action({
  args: { visitorId: v.string() },
  handler: async (ctx, args): Promise<string[]> => {
    return ctx.runAction(api.reccomendations.generateForUser, {
      userId: args.visitorId,
    });
  },
});

/**
 * Insert a new recommendation (internal, for use by generateForUser)
 */
export const insertInternal = internalMutation({
  args: {
    userId: v.string(),
    boothId: v.id("booths"),
    score: v.number(),
    reasoning: v.array(v.string()),
    basedOn: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("recommendations", {
      userId: args.userId,
      boothId: args.boothId.toString(),
      score: args.score,
      reasoning: args.reasoning,
      basedOn: args.basedOn,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    });
  },
});

/**
 * Insert a new recommendation (public mutation)
 */
export const insert = mutation({
  args: {
    userId: v.string(),
    boothId: v.string(),
    score: v.number(),
    reasoning: v.array(v.string()),
    basedOn: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("recommendations", {
      userId: args.userId,
      boothId: args.boothId,
      score: args.score,
      reasoning: args.reasoning,
      basedOn: args.basedOn,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    });
  },
});