// Chat client using Convex/Gemini with user identity

export function createChatSession(context, convexAction, clerkId) {
    // Return a session object with initialized conversation history
    return {
        context,
        convexAction,
        clerkId, // Store user ID for identity lookup
        conversationHistory: [], // Initialize as empty array
    };
}

export async function sendChatMessage(session, message) {
    if (!session || !session.convexAction) {
        throw new Error('Chat session not properly initialized');
    }

    // Clone history to avoid mutation issues
    const historyForRequest = [...session.conversationHistory];

    // Add user message to session history
    session.conversationHistory.push({ role: 'user', content: message });

    try {
        // Use Convex action to call Gemini with user identity
        const response = await session.convexAction({
            message,
            clerkId: session.clerkId, // Pass user ID for profile lookup
            conversationHistory: historyForRequest,
            context: session.context,
        });

        // Add assistant response to history
        session.conversationHistory.push({ role: 'assistant', content: response.content });

        return response.content;
    } catch (error) {
        // Remove the user message if the call failed
        session.conversationHistory.pop();
        console.error('Chat error:', error);
        throw error;
    }
}
