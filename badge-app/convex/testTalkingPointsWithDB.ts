/**
 * testTalkingPointsWithDB.ts
 *
 * Integration test file that:
 * - Uses the real generateTalkingPoints() function from talkingPoints.ts
 * - Calls dummy company descriptions
 * - Fetches actual user data from the running Convex database using Clerk ID (clerkId)
 * - Generates talking points using Gemini + OpenRouter
 *
 * To run via Convex action (recommended):
 *   npx convex run convex/testTalkingPointsAction:generateTalkingPointsTest --args '{"clerkId":"<your_clerk_id>"}'
 *
 * Or via HTTP fetch test:
 *   npx ts-node convex/testTalkingPointsWithDB.ts
 *
 * Requirements:
 * - Convex dev server running
 * - App dev server running
 * - .env.local configured with:
 *   - CONVEX_FETCH_URL
 *   - CONVEX_API_KEY (optional for local dev)
 *   - GEMINI_API_URL
 *   - GEMINI_API_KEY
 *   - OPENROUTER_API_KEY
 */

import { generateTalkingPoints } from './talkingPoints.ts';

// Dummy company descriptions for testing
const DUMMY_COMPANIES = [
    {
        id: 'google',
        name: 'Google',
        description: `
            Google is a global technology company specializing in AI, cloud computing, and web services.
            We're hiring software engineers, ML engineers, and cloud architects.
            We work on products like Google Cloud, TensorFlow, Firebase, and AI research.
            Focus areas: AI/ML, Search, Ads, Cloud Infrastructure, Data Science.
        `,
    },
    {
        id: 'shopify',
        name: 'Shopify',
        description: `
            Shopify is an e-commerce platform enabling millions of merchants worldwide.
            We're looking for full-stack developers, platform engineers, and DevOps engineers.
            Our tech stack includes JavaScript, TypeScript, React, Node.js, and modern web technologies.
            Focus areas: E-Commerce, Web Development, Payments, APIs, Scalability.
        `,
    },
    {
        id: 'amplitude',
        name: 'Amplitude',
        description: `
            Amplitude is a leading analytics and product intelligence platform.
            We help companies understand user behavior and optimize product decisions.
            We're hiring data engineers, analytics engineers, and full-stack developers.
            Focus areas: Analytics, Data Science, Product Management, Data Engineering.
        `,
    },
    {
        id: 'foresters',
        name: 'Foresters Financial',
        description: `
            Foresters Financial is a financial services and insurance company.
            We're building modern digital solutions for our members and stakeholders.
            We're hiring actuarial analysts, data scientists, and full-stack developers.
            Focus areas: Finance, Insurance, Risk Management, Actuarial Science, Digital Transformation.
        `,
    },
];

/**
 * Compatibility wrapper for generateTalkingPoints
 *
 * The function signature of generateTalkingPoints has changed in recent updates.
 * This wrapper tries several reasonable call signatures in order:
 *  1. generateTalkingPoints(userId, companyDescription)
 *  2. generateTalkingPoints(userId, companyObject)
 *  3. generateTalkingPoints({ userId, company })
 *  4. generateTalkingPoints({ userId, companyDescription })
 *
 * Only this test file is modified so the integration remains robust against signature changes.
 */
async function callGenerateTalkingPoints(clerkId: string, company: { id: string; name: string; description: string }) {
    const fn: any = generateTalkingPoints as any;

    // Call generateTalkingPoints with clerkId (Clerk user ID) and company description
    // Without Convex SDK context, it will use HTTP fetch via Convex HTTP API
    const result = await fn(clerkId, company.description);
    return result;
}

/**
 * Main test function
 * Generates talking points for each company by fetching real user data from Convex
 */
async function runTalkingPointsTest() {
    console.log('🎯 TALKING POINTS INTEGRATION TEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // NOTE: Use the actual Clerk ID from your database.
    // This test uses HTTP fetch (without Convex SDK context).
    const TEST_CLERK_ID = 'user_2abc3def';  // Replace with your actual Clerk ID

    console.log(`📋 Testing with Clerk ID: ${TEST_CLERK_ID}\n`);
    console.log('Companies to process:');
    DUMMY_COMPANIES.forEach((c) => console.log(`  • ${c.name}`));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Process each company
    for (const company of DUMMY_COMPANIES) {
        try {
            console.log(`🏢 Processing: ${company.name}`);
            console.log(`   ID: ${company.id}`);

            // Call the generateTalkingPoints with clerkId
            const talkingPoints = await callGenerateTalkingPoints(TEST_CLERK_ID, company);

            // Ensure we have an array of strings to print
            if (!Array.isArray(talkingPoints)) {
                console.log('   ⚠️ Unexpected response format from generateTalkingPoints:');
                console.log('   →', talkingPoints);
            } else {
                console.log(`   ✨ Generated Talking Points:\n`);
                talkingPoints.forEach((point: any, index: number) => {
                    console.log(`      ${index + 1}. "${String(point)}"`);
                });
            }

            console.log('\n');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`   ❌ Error: ${errorMessage}\n`);

            // Common issues:
            if (errorMessage.includes('Convex fetch not configured')) {
                console.error(
                    '   💡 Tip: Make sure CONVEX_FETCH_URL and CONVEX_API_KEY are set in .env.local\n'
                );
            } else if (errorMessage.includes('Gemini')) {
                console.error('   💡 Tip: Check GEMINI_API_URL and GEMINI_API_KEY in .env.local\n');
            } else if (errorMessage.includes('OpenRouter')) {
                console.error('   💡 Tip: Check OPENROUTER_API_KEY in .env.local\n');
            }
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test completed!');
    console.log('\nNext steps:');
    console.log('  1. Replace TEST_CLERK_ID with an actual Clerk ID from your Convex database');
    console.log('  2. Run: npx ts-node convex/testTalkingPointsWithDB.ts');
    console.log('  3. Or use the Convex action: npx convex run convex/testTalkingPointsAction:generateTalkingPointsTest --args \'{"clerkId":"<your_clerk_id>"}\'\n');
}

// Run the test
runTalkingPointsTest().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
