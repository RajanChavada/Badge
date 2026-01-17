import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Get current recommendations for a visitor
 */
export const getForVisitor = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recommendations")
      .withIndex("by_visitor_status", (q) =>
        q.eq("visitorId", args.visitorId).eq("status", "pending")
      )
      .order("desc")
      .take(5);
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
    await ctx.db.patch(args.recommendationId, {
      status: "clicked",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Generate new recommendations based on visitor's interaction history
 * This is the AI-powered recommendation engine
 */
export const generateForVisitor = action({
  args: { visitorId: v.string() },
  handler: async (ctx, args): Promise<string[]> => {
    console.log("[Reco] Generating recommendations for:", args.visitorId);

    // 1. Get visitor's interaction history
    const interactions = await ctx.runQuery(api.interactions.listByVisitor, {
      visitorId: args.visitorId,
    });

    if (interactions.length === 0) {
      console.log("[Reco] No interactions yet, returning default recommendations");
      return [];
    }

    // 2. Aggregate visitor's profile from interactions
    const aggregatedTags: Record<string, number> = {};
    const aggregatedSkills: Record<string, number> = {};
    const aggregatedInterests: Record<string, number> = {};
    const visitedBooths = new Set<string>();
    let positiveCount = 0;

    for (const interaction of interactions) {
      visitedBooths.add(interaction.visitorBoothId);
      
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

    console.log("[Reco] Visitor profile:", { topTags, topSkills, topInterests });

    // 3. Get all booths
    const allBooths = await ctx.runQuery(api.booths.list, {});

    // 4. Score each booth based on tag overlap
    const scoredBooths = allBooths
      .filter((booth) => !visitedBooths.has(booth._id.toString()))
      .map((booth) => {
        const boothTags = booth.tags || [];
        const boothLookingFor = booth.lookingFor || [];
        
        // Calculate match score
        let score = 0;
        const matchReasons: string[] = [];

        // Tag overlap
        for (const tag of topTags) {
          if (boothTags.some((bt) => bt.toLowerCase().includes(tag.toLowerCase()))) {
            score += 20;
            matchReasons.push(`Matches your interest in "${tag}"`);
          }
        }

        // Skill match
        for (const skill of topSkills) {
          if (boothLookingFor.some((lf) => lf.toLowerCase().includes(skill.toLowerCase()))) {
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
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log("[Reco] Top recommendations:", scoredBooths.map((s) => ({
      booth: s.booth.name,
      score: s.score,
    })));

    // 5. Save recommendations to database
    const savedRecommendations: string[] = [];
    for (const scored of scoredBooths) {
      const recoId = await ctx.runMutation(internal.reccomendations.insertInternal, {
        visitorId: args.visitorId,
        recommendedBoothId: scored.booth._id,
        recommendedBoothName: scored.booth.name,
        matchScore: scored.score,
        matchReasons: scored.matchReasons,
        basedOnTags: scored.basedOnTags,
        basedOnInteractions: interactions.slice(0, 3).map((i) => i._id),
      });
      savedRecommendations.push(recoId);
    }

    return savedRecommendations;
  },
});

/**
 * Insert a new recommendation (internal, for use by generateForVisitor)
 */
export const insertInternal = internalMutation({
  args: {
    visitorId: v.string(),
    recommendedBoothId: v.id("booths"),
    recommendedBoothName: v.string(),
    matchScore: v.number(),
    matchReasons: v.array(v.string()),
    basedOnTags: v.array(v.string()),
    basedOnInteractions: v.array(v.id("interactions")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recommendations", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/**
 * Insert a new recommendation (public mutation)
 */
export const insert = mutation({
  args: {
    visitorId: v.string(),
    recommendedBoothId: v.id("booths"),
    recommendedBoothName: v.string(),
    matchScore: v.number(),
    matchReasons: v.array(v.string()),
    basedOnTags: v.array(v.string()),
    basedOnInteractions: v.array(v.id("interactions")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recommendations", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});