import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProfile = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return existing ?? null;
  },
});

// Rich identity object validator - accepts null from Gemini
const identityValidator = v.object({
  headline: v.string(),
  summary: v.optional(v.union(v.string(), v.null())),

  education: v.optional(v.array(v.object({
    institution: v.string(),
    degree: v.optional(v.union(v.string(), v.null())),
    field: v.optional(v.union(v.string(), v.null())),
    graduationYear: v.optional(v.union(v.string(), v.null())),
    gpa: v.optional(v.union(v.string(), v.null())),
  }))),

  experience: v.optional(v.array(v.object({
    company: v.string(),
    role: v.string(),
    duration: v.optional(v.union(v.string(), v.null())),
    highlights: v.optional(v.union(v.array(v.string()), v.null())),
  }))),

  projects: v.optional(v.array(v.object({
    name: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    technologies: v.optional(v.union(v.array(v.string()), v.null())),
    url: v.optional(v.union(v.string(), v.null())),
  }))),

  skills: v.array(v.string()),
  technicalSkills: v.optional(v.union(v.array(v.string()), v.null())),
  softSkills: v.optional(v.union(v.array(v.string()), v.null())),
  languages: v.optional(v.union(v.array(v.string()), v.null())),

  interests: v.array(v.string()),
  goals: v.array(v.string()),
  targetRoles: v.optional(v.union(v.array(v.string()), v.null())),
  targetCompanyTypes: v.optional(v.union(v.array(v.string()), v.null())),

  lookingFor: v.optional(v.union(v.array(v.string()), v.null())),
  availableFor: v.optional(v.union(v.array(v.string()), v.null())),
});

export const upsertProfile = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    resumeText: v.optional(v.string()),
    identity: v.optional(identityValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // Build identity with lastUpdated
    const identityToSave = args.identity
      ? {
        headline: args.identity.headline,
        summary: args.identity.summary ?? undefined,
        education: args.identity.education,
        experience: args.identity.experience,
        projects: args.identity.projects,
        skills: args.identity.skills,
        technicalSkills: args.identity.technicalSkills ?? undefined,
        softSkills: args.identity.softSkills ?? undefined,
        languages: args.identity.languages ?? undefined,
        interests: args.identity.interests,
        goals: args.identity.goals,
        targetRoles: args.identity.targetRoles ?? undefined,
        targetCompanyTypes: args.identity.targetCompanyTypes ?? undefined,
        lookingFor: args.identity.lookingFor ?? undefined,
        availableFor: args.identity.availableFor ?? undefined,
        lastUpdated: now,
      }
      : undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: identityToSave ?? existing.identity,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: identityToSave,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Quick update for specific identity fields (for manual edits)
export const updateIdentityFields = mutation({
  args: {
    clerkId: v.string(),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    goals: v.optional(v.array(v.string())),
    targetRoles: v.optional(v.array(v.string())),
    lookingFor: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existing) {
      throw new Error("User not found");
    }

    const currentIdentity = (existing.identity as Record<string, unknown>) || {
      headline: "Hackathon Attendee",
      skills: [],
      interests: [],
      goals: [],
      lastUpdated: Date.now(),
    };

    await ctx.db.patch(existing._id, {
      identity: {
        ...currentIdentity,
        skills: args.skills ?? currentIdentity.skills,
        interests: args.interests ?? currentIdentity.interests,
        goals: args.goals ?? currentIdentity.goals,
        targetRoles: args.targetRoles ?? currentIdentity.targetRoles,
        lookingFor: args.lookingFor ?? currentIdentity.lookingFor,
        lastUpdated: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

// Evolve identity based on interaction insights (append-only)
export const evolveUserIdentity = mutation({
  args: {
    clerkId: v.string(),
    newSkills: v.array(v.string()),
    newInterests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existing) return null;

    const currentIdentity = (existing.identity as any) || {
      skills: [],
      interests: [],
    };

    const updatedSkills = Array.from(new Set([
      ...(currentIdentity.skills || []),
      ...args.newSkills
    ]));

    const updatedInterests = Array.from(new Set([
      ...(currentIdentity.interests || []),
      ...args.newInterests
    ]));

    // Only patch if there are changes
    if (updatedSkills.length !== (currentIdentity.skills?.length || 0) ||
      updatedInterests.length !== (currentIdentity.interests?.length || 0)) {

      await ctx.db.patch(existing._id, {
        identity: {
          ...currentIdentity,
          skills: updatedSkills,
          interests: updatedInterests,
          lastUpdated: Date.now(),
        },
        updatedAt: Date.now(),
      });
      console.log(`[Evolve] Updated user ${args.clerkId}: +${args.newSkills.length} skills, +${args.newInterests.length} interests`);
    }

    return existing._id;
  },
});