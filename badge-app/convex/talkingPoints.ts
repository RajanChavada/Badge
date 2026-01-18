/**
 * talkingPoints.ts
 *
 * Backend-only helper module to:
 * - Fetch a user's profile + parsed resume from Convex (read-only)
 * - Extract structured user signals using Gemini 1.5 Flash
 * - Generate exactly 3 personalized talking points using GPT-4.1-mini via OpenRouter
 *
 * ABSOLUTE: Do NOT modify other files. This module has no side effects and exports functions only.
 *
 * Required environment variables (backend runtime):
 * - CONVEX_FETCH_URL (string) - OPTIONAL: Convex read endpoint URL (if available in your infra)
 * - CONVEX_API_KEY (string) - OPTIONAL: Convex read key for accessing the Convex HTTP endpoint
 *   NOTE: If your project uses the Convex Node SDK, replace `fetchUserFromConvex` implementation
 *         with the appropriate SDK calls. A TODO is left where assumptions would be required.
 *
 * - GEMINI_API_URL (string) - REQUIRED: URL endpoint for Gemini 1.5 Flash (or a proxy to it)
 * - GEMINI_API_KEY (string) - REQUIRED: API key or bearer token for the Gemini endpoint
 *   NOTE: Depending on how you host/access Gemini (Vertex AI vs. Google GenAI vs. proxy),
 *         you may need to change headers/auth; adjust the TODO in `extractSignalsWithGemini`.
 *
 * - OPENROUTER_API_KEY (string) - REQUIRED: API key for OpenRouter
 * - OPENROUTER_API_URL (string) - OPTIONAL: override for OpenRouter endpoint (defaults to
 *   "https://api.openrouter.ai/v1/chat/completions")
 *
 * Implementation notes:
 * - All prompts are isolated in constants below.
 * - No DB writes are made. Only reads from Convex are attempted.
 * - If something about Convex or the LLM endpoints is ambiguous, a TODO comment is left.
 */

type UserProfile = {
    id: string;
    fullName?: string;
    headline?: string;
    email?: string;
    location?: string;
    // other fields may exist; keep structure minimal
    [key: string]: any;
};

type ParsedResume = {
    // Expect resume-parsed structure (skills, experiences, etc.) but keep flexible.
    rawText?: string;
    parsed?: any;
    [key: string]: any;
};

export type UserSignals = {
    skills: string[]; // short list of core skills
    experience: string; // summary of years / seniority
    industries: string[]; // industries or sectors
    currentEmploymentStatus: string; // e.g. "employed full-time", "actively seeking", etc.
    // keep extensible
    [key: string]: any;
};

/* ---------------------------
     PROMPTS (isolated constants)
     --------------------------- */

const GEMINI_PROMPT = `
You are an assistant that extracts structured professional signals from a user's profile and parsed resume.
Return a JSON object with the following keys:
- skills: an array of the user's top technical and domain skills (short strings, 3-8 items)
- experience: a short human-readable summary of years of experience and seniority (1-2 sentences)
- industries: an array of industries or sectors the user has worked in (short strings)
- currentEmploymentStatus: one short phrase describing current employment status (e.g., "employed full-time", "contractor", "open to opportunities")

Input data will be provided as a JSON object with keys "profile" and "parsedResume". Be conservative and extract only what is clear.
Respond ONLY with valid JSON.
`;

const OPENROUTER_PROMPT_TEMPLATE = (signals: UserSignals, companyDescription: string) => `
You are an assistant that composes exactly 3 concise, professional, personalized "talking points" that someone can use
to start a conversation with this candidate about a role at the company described.

Constraints:
- Output must be a JSON array of exactly 3 strings.
- Each talking point must be one or two short sentences (preferably < 30 words each).
- Make them actionable and specific to the candidate's background and the company description.
- Do not include any extra explanation or metadata; return only the JSON array.

Candidate signals:
${JSON.stringify(signals, null, 2)}

Company description:
${companyDescription}
`;

/* ---------------------------
     Helper: Convex fetch
     --------------------------- */

/**
 * Fetch user profile + parsed resume data from Convex (read-only).
 *
 * NOTE: Convex SDKs vary by project. This implementation attempts a generic HTTP fetch
 * if CONVEX_FETCH_URL is provided. If your project uses the Convex Node SDK, replace
 * this function with the appropriate SDK query (TODO left intentionally).
 *
 * Required envs for this generic implementation:
 * - CONVEX_FETCH_URL
 * - CONVEX_API_KEY
 *
 * Returns:
 *   { profile, parsedResume }
 *
 * Throws on missing configuration.
 */
export async function fetchUserFromConvex(userId: string): Promise<{ profile: UserProfile | null; parsedResume: ParsedResume | null }> {
    const url = process.env.CONVEX_FETCH_URL;
    const key = process.env.CONVEX_API_KEY;

    if (!url || !key) {
        // TODO: Replace this placeholder with the Convex SDK call if the SDK is available in the runtime.
        throw new Error(
            'Convex fetch not configured. Please set CONVEX_FETCH_URL and CONVEX_API_KEY, or replace fetchUserFromConvex with the Convex SDK call for your project.'
        );
    }

    // Generic fetch: expects a small backend endpoint or proxy that returns:
    // { profile: {...}, parsedResume: {...} }
    // The exact contract is intentionally small and generic because project setups vary.
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ action: 'getUserProfileAndResume', userId }),
    });

    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Convex fetch failed: ${resp.status} ${resp.statusText} ${text}`);
    }

    const body = (await resp.json()) || {};
    return {
        profile: body.profile ?? null,
        parsedResume: body.parsedResume ?? null,
    };
}

/* ---------------------------
     Helper: Gemini call to extract signals
     --------------------------- */

/**
 * Call Gemini 1.5 Flash (or your proxy) to extract structured signals.
 *
 * Required envs:
 * - GEMINI_API_URL
 * - GEMINI_API_KEY
 *
 * The implementation assumes a generic REST endpoint that accepts a JSON payload:
 * { prompt: string, input: {...} } and returns a JSON string in .text or .output.
 *
 * TODO: Replace the fetch logic with exact Vertex AI/GenAI client calls if desired.
 */
export async function extractSignalsWithGemini(profile: UserProfile | null, parsedResume: ParsedResume | null): Promise<UserSignals> {
    const geminiUrl = process.env.GEMINI_API_URL;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiUrl || !geminiKey) {
        throw new Error('Gemini request not configured. Set GEMINI_API_URL and GEMINI_API_KEY in the environment.');
    }

    const inputPayload = {
        profile,
        parsedResume,
    };

    const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Common patterns: Authorization: Bearer <KEY> OR x-api-key header; adjust as needed.
            Authorization: `Bearer ${geminiKey}`,
        },
        body: JSON.stringify({
            prompt: GEMINI_PROMPT,
            input: inputPayload,
            // Optional: model indicator; leave to endpoint if required.
            model: 'gemini-1.5-flash',
            maxTokens: 800,
            temperature: 0.0,
        }),
    });

    if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`Gemini request failed: ${resp.status} ${resp.statusText} ${t}`);
    }

    const data = await resp.json();

    // Try common response shapes:
    let textOutput: string | undefined;
    if (typeof data.text === 'string') {
        textOutput = data.text;
    } else if (typeof data.output === 'string') {
        textOutput = data.output;
    } else if (Array.isArray(data.choices) && data.choices[0]) {
        textOutput = (data.choices[0].message?.content ?? data.choices[0].text) as string;
    } else if (typeof data === 'string') {
        textOutput = data;
    }

    if (!textOutput) {
        // If the endpoint returned a parsed JSON structure already, try to map it directly:
        if (data?.json) {
            const j = data.json;
            return {
                skills: Array.isArray(j.skills) ? j.skills : [],
                experience: typeof j.experience === 'string' ? j.experience : '',
                industries: Array.isArray(j.industries) ? j.industries : [],
                currentEmploymentStatus: typeof j.currentEmploymentStatus === 'string' ? j.currentEmploymentStatus : '',
                ...j,
            };
        }
        throw new Error('Gemini response did not contain a recognized text or json payload.');
    }

    // The prompt asks Gemini to respond with JSON only. Parse it.
    let parsedJson: any;
    try {
        parsedJson = JSON.parse(textOutput);
    } catch (e) {
        // Attempt to extract the first JSON object from the text
        const match = textOutput.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsedJson = JSON.parse(match[0]);
            } catch {
                // fallthrough
            }
        }
    }

    if (!parsedJson) {
        throw new Error('Failed to parse Gemini JSON output.');
    }

    // Map fields defensively
    return {
        skills: Array.isArray(parsedJson.skills) ? parsedJson.skills.map(String) : [],
        experience: typeof parsedJson.experience === 'string' ? parsedJson.experience : '',
        industries: Array.isArray(parsedJson.industries) ? parsedJson.industries.map(String) : [],
        currentEmploymentStatus:
            typeof parsedJson.currentEmploymentStatus === 'string' ? parsedJson.currentEmploymentStatus : '',
        ...parsedJson,
    } as UserSignals;
}

/* ---------------------------
     Helper: OpenRouter call to generate talking points
     --------------------------- */

/**
 * Generate exactly 3 personalized talking points using GPT-4.1-mini via OpenRouter.
 *
 * Required env:
 * - OPENROUTER_API_KEY
 * - OPENROUTER_API_URL (optional; defaults to the common OpenRouter chat/completions endpoint)
 */
export async function generateTalkingPointsWithOpenRouter(signals: UserSignals, companyDescription: string): Promise<string[]> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl = process.env.OPENROUTER_API_URL ?? 'https://api.openrouter.ai/v1/chat/completions';

    if (!apiKey) {
        throw new Error('OpenRouter API key missing. Set OPENROUTER_API_KEY in the environment.');
    }

    const prompt = OPENROUTER_PROMPT_TEMPLATE(signals, companyDescription);

    const payload = {
        model: 'gpt-4.1-mini', // requested model name
        messages: [
            {
                role: 'system',
                content: 'You are a concise assistant that returns exactly what was requested in JSON.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        // Ensure deterministic-ish outputs:
        temperature: 0.2,
        max_tokens: 360,
        n: 1,
    };

    const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`OpenRouter request failed: ${resp.status} ${resp.statusText} ${txt}`);
    }

    const data = await resp.json();

    // Common OpenRouter shape: { id, choices: [{ message: { content: "..." } }] }
    let content: string | undefined;
    if (Array.isArray(data.choices) && data.choices[0]) {
        content = data.choices[0].message?.content ?? data.choices[0].text;
    } else if (typeof data.output === 'string') {
        content = data.output;
    } else if (typeof data === 'string') {
        content = data;
    }

    if (!content) {
        throw new Error('OpenRouter response did not contain expected content.');
    }

    // The prompt enforces the assistant to return a JSON array of exactly 3 strings.
    // Parse defensively.
    let parsed: any;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch {
                // continue
            }
        }
    }

    if (!Array.isArray(parsed)) {
        throw new Error('OpenRouter did not return a JSON array of talking points.');
    }

    // Ensure exactly 3 strings; if not, trim/pad with best-effort (but spec requires exactly 3).
    const points = parsed.map((p: any) => (typeof p === 'string' ? p.trim() : String(p))).slice(0, 3);
    if (points.length < 3) {
        // If fewer than 3, do not fabricate content. Throw to signal upstream to re-run or investigate.
        throw new Error(`OpenRouter returned ${points.length} talking points; expected exactly 3.`);
    }

    return points;
}

/* ---------------------------
     Top-level exported function
     --------------------------- */

/**
 * Main helper: given a userId and a companyDescription (string), returns exactly 3 personalized talking points.
 *
 * Flow:
 * 1) Fetch user profile + parsed resume from Convex (read-only)
 * 2) Extract structured user signals via Gemini 1.5 Flash
 * 3) Use OpenRouter + GPT-4.1-mini to generate exactly 3 talking points
 *
 * Returns Promise<string[]> (exactly 3 strings) or throws on unrecoverable errors.
 */
export async function generateTalkingPoints(userId: string, companyDescription: string): Promise<string[]> {
    if (!userId) throw new Error('userId is required');
    if (!companyDescription) throw new Error('companyDescription is required');

    // 1) Fetch read-only user data from Convex
    const { profile, parsedResume } = await fetchUserFromConvex(userId);

    // 2) Extract signals (Gemini)
    const signals = await extractSignalsWithGemini(profile, parsedResume);

    // 3) Generate talking points (OpenRouter)
    const talkingPoints = await generateTalkingPointsWithOpenRouter(signals, companyDescription);

    // Validate final shape
    if (!Array.isArray(talkingPoints) || talkingPoints.length !== 3) {
        throw new Error('Generated talking points did not return exactly 3 items.');
    }

    return talkingPoints;
}

/* ---------------------------
     Exported helpers (for testing or reuse)
     --------------------------- */
export default undefined; // ensure only named exports are used

// End of file