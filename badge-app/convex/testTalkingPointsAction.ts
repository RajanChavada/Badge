/**
 * testTalkingPointsAction.ts
 *
 * Convex action function to test talkingPoints.ts within the Convex environment.
 * This runs the talking points generation for each dummy company using actual
 * user data fetched from the Convex database by the user's Clerk ID.
 *
 * To run:
 *   npx convex run convex/testTalkingPointsAction:generateTalkingPointsTest --args '{"clerkId":"<clerk_user_id>"}'
 *
 * Example:
 *   npx convex run convex/testTalkingPointsAction:generateTalkingPointsTest --args '{"clerkId":"user_2abc3def..."}'
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { generateTalkingPoints } from "./talkingPoints";

// Dummy company descriptions for testing
const DUMMY_COMPANIES = [
    {
        id: "google",
        name: "Google",
        description: `
            Google is a global technology company specializing in AI, cloud computing, and web services.
            We're hiring software engineers, ML engineers, and cloud architects.
            We work on products like Google Cloud, TensorFlow, Firebase, and AI research.
            Focus areas: AI/ML, Search, Ads, Cloud Infrastructure, Data Science.
        `,
    },
    {
        id: "shopify",
        name: "Shopify",
        description: `
            Shopify is an e-commerce platform enabling millions of merchants worldwide.
            We're looking for full-stack developers, platform engineers, and DevOps engineers.
            Our tech stack includes JavaScript, TypeScript, React, Node.js, and modern web technologies.
            Focus areas: E-Commerce, Web Development, Payments, APIs, Scalability.
        `,
    },
    {
        id: "amplitude",
        name: "Amplitude",
        description: `
            Amplitude is a leading analytics and product intelligence platform.
            We help companies understand user behavior and optimize product decisions.
            We're hiring data engineers, analytics engineers, and full-stack developers.
            Focus areas: Analytics, Data Science, Product Management, Data Engineering.
        `,
    },
    {
        id: "foresters",
        name: "Foresters Financial",
        description: `
            Foresters Financial is a financial services and insurance company.
            We're building modern digital solutions for our members and stakeholders.
            We're hiring actuarial analysts, data scientists, and full-stack developers.
            Focus areas: Finance, Insurance, Risk Management, Actuarial Science, Digital Transformation.
        `,
    },
];

/**
 * Main test action
 * Generates talking points for each company using user data from Convex
 */
export const generateTalkingPointsTest = action({
    args: {
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("🎯 TALKING POINTS TEST - Running in Convex Environment");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        const results: {
            company: string;
            success: boolean;
            talkingPoints?: string[];
            error?: string;
        }[] = [];

        console.log(`📋 Testing with Clerk user ID: ${args.clerkId}\n`);
        console.log("Companies to process:");
        DUMMY_COMPANIES.forEach((c) => console.log(`  • ${c.name}`));
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // Process each company
        for (const company of DUMMY_COMPANIES) {
            try {
                console.log(`🏢 Processing: ${company.name}`);
                console.log(`   ID: ${company.id}`);

                // Call the real generateTalkingPoints function with Convex context
                // This will:
                // 1. Fetch user profile from Convex using the clerkId and SDK context
                // 2. Extract signals with Gemini
                // 3. Generate 3 talking points with OpenRouter
                const talkingPoints = await generateTalkingPoints(args.clerkId, company.description, ctx);

                console.log(`   ✨ Generated Talking Points:\n`);
                talkingPoints.forEach((point, index) => {
                    console.log(`      ${index + 1}. "${point}"`);
                });

                results.push({
                    company: company.name,
                    success: true,
                    talkingPoints,
                });

                console.log("\n");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`   ❌ Error: ${errorMessage}\n`);

                results.push({
                    company: company.name,
                    success: false,
                    error: errorMessage,
                });

                // Common issues:
                if (errorMessage.includes("Convex fetch not configured")) {
                    console.error("   💡 Tip: Make sure CONVEX_FETCH_URL and CONVEX_API_KEY are set in .env.local\n");
                } else if (errorMessage.includes("Gemini")) {
                    console.error("   💡 Tip: Check GEMINI_API_URL and GEMINI_API_KEY in .env.local\n");
                } else if (errorMessage.includes("OpenRouter")) {
                    console.error("   💡 Tip: Check OPENROUTER_API_KEY in .env.local\n");
                }
            }
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅ Test completed!\n");

        // Summary
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        console.log(`📊 Summary:`);
        console.log(`   ✅ Successful: ${successful}/${DUMMY_COMPANIES.length}`);
        console.log(`   ❌ Failed: ${failed}/${DUMMY_COMPANIES.length}\n`);

        return {
            summary: {
                total: DUMMY_COMPANIES.length,
                successful,
                failed,
            },
            results,
        };
    },
});
