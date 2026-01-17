import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("booths").collect();
  },
});

export const getById = query({
  args: { boothId: v.id("booths") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.boothId);
  },
});

// Seed some demo booths
export const seedDemoBooths = mutation({
  args: {},
  handler: async (ctx) => {
    const existingBooths = await ctx.db.query("booths").collect();
    if (existingBooths.length > 0) {
      console.log("Booths already seeded");
      return existingBooths.length;
    }

    const demoBooths = [
      {
        name: "TechCorp AI",
        company: "TechCorp",
        description: "Building next-gen AI products. Looking for ML engineers and full-stack developers.",
        tags: ["machine-learning", "ai", "python", "full-stack"],
        lookingFor: ["machine-learning", "python", "tensorflow", "react"],
        offering: ["internships", "full-time", "mentorship"],
      },
      {
        name: "StartupXYZ",
        company: "StartupXYZ",
        description: "Fast-growing fintech startup. Great for entrepreneurial engineers.",
        tags: ["fintech", "startup", "fast-paced", "equity"],
        lookingFor: ["backend", "nodejs", "typescript", "leadership"],
        offering: ["equity", "fast-growth", "mentorship"],
      },
      {
        name: "DesignLab",
        company: "DesignLab",
        description: "Design-focused product studio. UI/UX and frontend specialists.",
        tags: ["design", "ui-ux", "frontend", "figma"],
        lookingFor: ["ui-ux", "figma", "react", "css", "design-systems"],
        offering: ["portfolio-projects", "mentorship", "freelance"],
      },
      {
        name: "CloudScale",
        company: "CloudScale",
        description: "Enterprise cloud infrastructure. DevOps and platform engineering.",
        tags: ["cloud", "devops", "kubernetes", "aws"],
        lookingFor: ["devops", "kubernetes", "aws", "terraform", "golang"],
        offering: ["full-time", "remote", "certification-sponsorship"],
      },
      {
        name: "GameDev Studios",
        company: "GameDev Studios",
        description: "AAA game development. Graphics programmers and game designers.",
        tags: ["gaming", "graphics", "unity", "unreal"],
        lookingFor: ["c++", "unity", "unreal", "graphics", "game-design"],
        offering: ["creative-projects", "full-time", "game-credits"],
      },
      {
        name: "HealthTech Inc",
        company: "HealthTech Inc",
        description: "Healthcare technology improving patient outcomes.",
        tags: ["healthcare", "impact", "data-science", "mobile"],
        lookingFor: ["data-science", "mobile", "hipaa", "empathy"],
        offering: ["impact-work", "full-time", "benefits"],
      },
    ];

    for (const booth of demoBooths) {
      await ctx.db.insert("booths", {
        ...booth,
        createdAt: Date.now(),
      });
    }

    return demoBooths.length;
  },
});