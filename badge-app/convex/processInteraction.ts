import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const process = action({
  args: {
    userId: v.string(), // Changed from visitorId to userId (Clerk ID)
    boothId: v.string(),
    boothName: v.string(),
    transcript: v.string(),
    hasAudio: v.boolean(),
    recordingDurationSec: v.number(),
  },
  handler: async (ctx, args): Promise<any> => {
    console.log("[Process] Processing with user profile context...");

    // 1. Get user's previous interactions
    const previousInteractions: any[] = await ctx.runQuery(api.interactions.listByUser, {
      userId: args.userId,
    });

    const previousTags: string[] = previousInteractions.flatMap((i: { tags?: string[] }) => i.tags || []);
    const uniquePreviousTags = [...new Set(previousTags)];

    // 2. Enrich with profile-aware LLM analysis
    let enriched: any;
    try {
      enriched = await ctx.runAction(api.llm.enrichTranscript, {
        transcript: args.transcript,
        boothName: args.boothName,
        visitorContext: {
          previousTags: uniquePreviousTags.slice(0, 10),
          interactionCount: previousInteractions.length,
        },
      });
      console.log("[Process] Profile-aware enrichment complete:", enriched);
    } catch (err) {
      console.error("[Process] LLM failed:", err);

      // If it's a missing API key, we want to fail fast so the user knows
      if (err instanceof Error && err.message.includes("Configuration Error")) {
        throw err;
      }

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
        profileAlignmentScore: 50,
        careerRelevance: [],
      };
    }

    // 3. Save to database
    const interactionId: Id<"interactions"> = await ctx.runMutation(api.interactions.insert, {
      userId: args.userId,
      boothId: args.boothId,
      boothName: args.boothName,
      transcript: args.transcript,
      hasAudio: args.hasAudio,
      transcriptSource: "elevenlabs",
      recordingDurationSec: args.recordingDurationSec,
      ...enriched,
      processingStatus: "complete",
      llmModel: "gemini-2.0-flash-profile-aware",
    });

    console.log("[Process] Saved:", interactionId);

    // 4. Evolve User Identity (Feedback Loop)
    if (enriched.mentionedSkills?.length > 0 || enriched.mentionedInterests?.length > 0) {
      await ctx.runMutation(api.users.evolveUserIdentity, {
        clerkId: args.userId,
        newSkills: enriched.mentionedSkills || [],
        newInterests: enriched.mentionedInterests || [],
      });
    }

    // 5. Generate profile-aware recommendations
    const newInteractionCount = previousInteractions.length + 1;

    if (newInteractionCount === 1 || newInteractionCount % 2 === 0) {
      console.log("[Process] Generating profile-aware recommendations...");
      try {
        await ctx.runAction(api.reccomendations.generateForVisitor, {
          visitorId: args.userId,
        });
      } catch (err) {
        console.error("[Process] Recommendation generation failed:", err);
      }
    }

    return {
      interactionId: interactionId.toString(),
      ...enriched,
      interactionNumber: newInteractionCount,
    };
  },
});