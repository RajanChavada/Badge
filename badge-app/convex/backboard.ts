import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Send a message using Gemini for the networking coach chat
 * Includes user profile from Convex for personalized feedback
 */
export const sendChatMessage = action({
    args: {
        message: v.string(),
        clerkId: v.optional(v.string()),
        conversationHistory: v.array(v.object({
            role: v.string(),
            content: v.string(),
        })),
        context: v.object({
            summary: v.string(),
            nextBestAction: v.string(),
            mentionedSkills: v.array(v.string()),
            mentionedInterests: v.array(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            console.error("❌ GEMINI_API_KEY is missing");
            throw new Error("Gemini API key not configured");
        }

        // Fetch user profile if clerkId is provided
        let userProfile = null;
        if (args.clerkId) {
            try {
                userProfile = await ctx.runQuery(api.users.getProfile, { clerkId: args.clerkId });
            } catch (err) {
                console.log("[Chat] Could not fetch user profile:", err);
            }
        }

        // Build user identity section
        let userIdentitySection = "";
        if (userProfile && userProfile.identity) {
            const identity = userProfile.identity;
            userIdentitySection = `
USER'S IDENTITY (use this to personalize advice):
- Name: ${userProfile.name || "Not specified"}
- Headline: ${identity.headline || "Not specified"}
- Skills: ${identity.skills?.join(", ") || "Not specified"}
- Interests: ${identity.interests?.join(", ") || "Not specified"}
- Goals: ${identity.goals?.join(", ") || "Not specified"}
- Target Roles: ${identity.targetRoles?.join(", ") || "Not specified"}
${identity.coreTraits?.length ? `- Personality Traits: ${identity.coreTraits.join(", ")}` : ""}
${identity.workStyle ? `- Work Style: ${identity.workStyle}` : ""}
`;
        }

        // Build the system prompt with context and user identity
        const systemPrompt = `You are a friendly networking coach helping someone at a hackathon/career fair.
${userIdentitySection}
CURRENT CONVERSATION CONTEXT:
- Recent conversation summary: ${args.context.summary}
- Suggested next action: ${args.context.nextBestAction}
- Skills mentioned: ${args.context.mentionedSkills.join(", ") || "Not specified"}
- Interests mentioned: ${args.context.mentionedInterests.join(", ") || "Not specified"}

RESPONSE GUIDELINES:
- Be concise and direct (2-3 short paragraphs max)
- Personalize advice based on the user's identity and goals
- Give specific, actionable advice that connects their skills/interests to the next action
- Focus on the user's actual question
- Don't repeat the context back to them`;

        // Build conversation for Gemini
        const historyText = args.conversationHistory.length > 0
            ? args.conversationHistory.map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join("\n\n") + "\n\n"
            : "";

        const prompt = `${systemPrompt}\n\n---\nConversation:\n${historyText}User: ${args.message}\n\nCoach:`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 500,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.text();
                console.error("[Chat] Gemini API error:", response.status, error);
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help you network effectively!";

            return {
                success: true,
                content,
            };
        } catch (error) {
            console.error("[Chat] Error:", error);
            throw error;
        }
    },
});
