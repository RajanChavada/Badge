import { mutation } from "./_generated/server";

// DELETE THIS FILE AFTER RUNNING ONCE
export const clearAllInteractions = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("interactions").collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: all.length };
  },
});