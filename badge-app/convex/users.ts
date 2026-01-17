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

export const generateResumeUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveResumeFileId = mutation({
  args: {
    clerkId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (existing) {
      // Delete old file if it exists
      if (existing.resumeFileId) {
        try {
          await ctx.storage.delete(existing.resumeFileId);
        } catch (e) {
          // File may have already been deleted
        }
      }
      
      await ctx.db.patch(existing._id, {
        resumeFileId: args.storageId,
      });
      return existing._id;
    } else {
      const now = Date.now();
      const id = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: "",
        name: "",
        resumeFileId: args.storageId,
        createdAt: now,
      });
      return id;
    }
  },
});

export const getResumeDownloadUrl = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user || !user.resumeFileId) {
      return null;
    }
    
    const downloadUrl = await ctx.storage.getUrl(user.resumeFileId);
    return downloadUrl;
  },
});

export const upsertProfile = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    resumeText: v.optional(v.string()),
    identity: v.optional(
      v.object({
        headline: v.string(),
        skills: v.array(v.string()),
        interests: v.array(v.string()),
        goals: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: args.identity
          ? {
              ...args.identity,
              lastUpdated: now,
            }
          : existing.identity,
        identityVersion: (existing.identityVersion ?? 0) + 1,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: args.identity
          ? {
              ...args.identity,
              lastUpdated: now,
            }
          : undefined,
        createdAt: now,
        identityVersion: 1,
      });
      return id;
    }
  },
});
