import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Create a chat session context (stored client-side, no external API needed for init)
 */
export const createChatSession = action({
    args: {
        summary: v.string(),
        nextBestAction: v.string(),
        mentionedSkills: v.array(v.string()),
        mentionedInterests: v.array(v.string()),
    },
    handler: async (_, args) => {
        // Generate a unique session ID (we'll manage context on the client)
        const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            success: true,
            sessionId,
            context: {
                summary: args.summary,
                nextBestAction: args.nextBestAction,
                mentionedSkills: args.mentionedSkills,
                mentionedInterests: args.mentionedInterests,
            }
        };
    },
});

/**
 * Send a message using Gemini for the networking coach chat
 */
export const sendChatMessage = action({
    args: {
        message: v.string(),
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
    handler: async (_, args) => {
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            console.error("❌ GEMINI_API_KEY is missing");
            throw new Error("Gemini API key not configured");
        }

        // Build the system prompt with context
        const systemPrompt = `You are an AI networking coach at a hackathon/career fair event.

CONTEXT FROM THE USER'S RECENT CONVERSATION:
Summary: ${args.context.summary}

RECOMMENDED NEXT ACTION: ${args.context.nextBestAction}

Skills mentioned: ${args.context.mentionedSkills.join(", ") || "None specified"}
Interests mentioned: ${args.context.mentionedInterests.join(", ") || "None specified"}

Your role is to help the user:
1. Understand why this next action is valuable for their networking goals
2. Provide specific conversation starters for their next connection
3. Give them talking points and ice-breakers
4. Answer questions about networking strategy at events

Be concise, friendly, and action-oriented. Use bullet points when helpful.
Focus on practical, immediately usable advice.`;

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
