// Backboard.io API client for frontend
const BACKBOARD_BASE_URL = 'https://api.backboard.io/v1';

class BackboardClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.assistantId = null;
        this.threadId = null;
    }

    async createAssistant(name, systemPrompt) {
        const response = await fetch(`${BACKBOARD_BASE_URL}/assistants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
            },
            body: JSON.stringify({
                name,
                system_prompt: systemPrompt,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create assistant: ${response.status}`);
        }

        const data = await response.json();
        this.assistantId = data.assistant_id;
        return data;
    }

    async createThread() {
        if (!this.assistantId) {
            throw new Error('Assistant not created yet');
        }

        const response = await fetch(`${BACKBOARD_BASE_URL}/threads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
            },
            body: JSON.stringify({
                assistant_id: this.assistantId,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create thread: ${response.status}`);
        }

        const data = await response.json();
        this.threadId = data.thread_id;
        return data;
    }

    async sendMessage(message, options = {}) {
        if (!this.threadId) {
            throw new Error('Thread not created yet');
        }

        const response = await fetch(`${BACKBOARD_BASE_URL}/threads/${this.threadId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
            },
            body: JSON.stringify({
                content: message,
                llm_provider: options.provider || 'openai',
                model_name: options.model || 'gpt-4o',
                memory: options.memory || 'Auto',
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status}`);
        }

        return await response.json();
    }
}

export async function createBackboardSession(context) {
    const apiKey = import.meta.env.VITE_BACKBOARD_API_KEY;

    if (!apiKey) {
        console.warn('VITE_BACKBOARD_API_KEY not set, falling back to basic chat');
        return null;
    }

    try {
        const client = new BackboardClient(apiKey);

        const systemPrompt = `You are an AI networking coach at a hackathon/career fair event.

CONTEXT FROM RECENT CONVERSATION:
Summary: ${context.summary}

Next Best Action: ${context.nextBestAction}

Skills discussed: ${context.mentionedSkills?.join(', ') || 'None'}
Interests mentioned: ${context.mentionedInterests?.join(', ') || 'None'}

Your role is to help the user:
1. Understand why this next action is valuable
2. Give them conversation starters for their next connection
3. Help them prepare talking points
4. Answer questions about networking strategy

Be concise, friendly, and action-oriented. Focus on practical advice.
Use bullet points and clear formatting.`;

        await client.createAssistant('Networking Coach', systemPrompt);
        await client.createThread();

        return client;
    } catch (error) {
        console.error('Backboard initialization failed:', error);
        return null;
    }
}

export async function sendBackboardMessage(client, message) {
    if (!client) {
        throw new Error('Backboard client not initialized');
    }

    const response = await client.sendMessage(message, { memory: 'Auto' });
    return response.content || "I'm here to help you network effectively!";
}
