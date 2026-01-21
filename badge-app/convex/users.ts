import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

declare const process: any;

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

// Rich identity object validator - accepts null from Gemini
const identityValidator = v.object({
  headline: v.string(),
  summary: v.optional(v.union(v.string(), v.null())),

  education: v.optional(v.array(v.object({
    institution: v.string(),
    degree: v.optional(v.union(v.string(), v.null())),
    field: v.optional(v.union(v.string(), v.null())),
    graduationYear: v.optional(v.union(v.string(), v.null())),
    gpa: v.optional(v.union(v.string(), v.null())),
  }))),

  experience: v.optional(v.array(v.object({
    company: v.string(),
    role: v.optional(v.union(v.string(), v.null())),
    duration: v.optional(v.union(v.string(), v.null())),
    highlights: v.optional(v.union(v.array(v.string()), v.null())),
  }))),

  projects: v.optional(v.array(v.object({
    name: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    technologies: v.optional(v.union(v.array(v.string()), v.null())),
    url: v.optional(v.union(v.string(), v.null())),
  }))),

  skills: v.array(v.string()),
  technicalSkills: v.optional(v.union(v.array(v.string()), v.null())),
  softSkills: v.optional(v.union(v.array(v.string()), v.null())),
  languages: v.optional(v.union(v.array(v.string()), v.null())),

  interests: v.array(v.string()),
  goals: v.array(v.string()),
  targetRoles: v.optional(v.union(v.array(v.string()), v.null())),
  targetCompanyTypes: v.optional(v.union(v.array(v.string()), v.null())),

  lookingFor: v.optional(v.union(v.array(v.string()), v.null())),
  availableFor: v.optional(v.union(v.array(v.string()), v.null())),
});

export const getProfileVectors = action({
  handler: async (_ctx) => {
    const account = (process as any).env.SNOWFLAKE_ACCOUNT
    const user = (process as any).env.SNOWFLAKE_USER
    const bearerToken = (process as any).env.SNOWFLAKE_BEARER_TOKEN
    const database = (process as any).env.SNOWFLAKE_DATABASE || 'badge_app'
    const warehouse = (process as any).env.SNOWFLAKE_WAREHOUSE || 'badge_wh'

    if (!account || !user || !bearerToken) {
      console.error('[Snowflake] Missing credentials (need Bearer token)')
      return { success: false, data: [] }
    }

    try {
      const snowflakeUrl = `https://${account}.snowflakecomputing.com/api/v2/statements`
      
      // Use Bearer token (JWT)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
      }

      const sql = `
        SELECT clerk_id, name, profile_vector
        FROM ${database}.profiles.user_profiles
        WHERE profile_vector IS NOT NULL
        LIMIT 100;
      `

      console.log('[Snowflake] Using warehouse:', warehouse)
      
      const response = await fetch(snowflakeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          statement: sql,
          timeout: 60,
          database: database,
          schema: 'profiles',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Snowflake] Error fetching vectors:', errorText)
        return { success: false, data: [] }
      }

      const result = await response.json()
      console.log('[Snowflake] Data length:', result.data?.length)
      
      // Parse Snowflake response - data is the array of rows
      const profiles: Array<{
        clerkId: string
        name: string
        vector: number[]
        coords3d: number[]
        skills?: string[]
        interests?: string[]
        headline?: string
      }> = []
      
      if (result.data && result.data.length > 0) {
        for (const row of result.data) {
          const clerkId = row[0]
          const name = row[1]
          const vectorString = row[2]
          
          // Parse vector string to array
          let vectorArray: number[] = []
          try {
            vectorArray = JSON.parse(vectorString)
          } catch (e) {
            console.error('[Snowflake] Failed to parse vector:', e)
          }
          
          // Extract first 3 coords
          const coords3d = vectorArray && vectorArray.length >= 3 
            ? [vectorArray[0], vectorArray[1], vectorArray[2]]
            : [0, 0, 0]

          // Fetch user identity from Convex for additional info
          const userProfile = await _ctx.runQuery(api.users.getProfile, { clerkId })
          
          profiles.push({
            clerkId,
            name,
            vector: vectorArray,
            coords3d,
            skills: userProfile?.identity?.skills,
            interests: userProfile?.identity?.interests,
            headline: userProfile?.identity?.headline,
          })
        }
      }

      console.log('[Snowflake] Parsed profiles:', profiles.length)
      return { success: true, data: profiles }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Snowflake] Exception:', errorMessage)
      return { success: false, data: [] }
    }
  },
})

export const upsertProfile = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    resumeText: v.optional(v.string()),
    identity: v.optional(identityValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // Build identity with lastUpdated
    const identityToSave = args.identity
      ? {
        headline: args.identity.headline,
        summary: args.identity.summary ?? undefined,
        education: args.identity.education,
        experience: args.identity.experience,
        projects: args.identity.projects,
        skills: args.identity.skills,
        technicalSkills: args.identity.technicalSkills ?? undefined,
        softSkills: args.identity.softSkills ?? undefined,
        languages: args.identity.languages ?? undefined,
        interests: args.identity.interests,
        goals: args.identity.goals,
        targetRoles: args.identity.targetRoles ?? undefined,
        targetCompanyTypes: args.identity.targetCompanyTypes ?? undefined,
        lookingFor: args.identity.lookingFor ?? undefined,
        availableFor: args.identity.availableFor ?? undefined,
        lastUpdated: now,
      }
      : undefined;

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: identityToSave ?? existing.identity,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: identityToSave,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Quick update for specific identity fields (for manual edits)
export const updateIdentityFields = mutation({
  args: {
    clerkId: v.string(),
    skills: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    goals: v.optional(v.array(v.string())),
    targetRoles: v.optional(v.array(v.string())),
    lookingFor: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existing) {
      throw new Error("User not found");
    }

    const currentIdentity = (existing.identity as Record<string, unknown>) || {
      headline: "Hackathon Attendee",
      skills: [],
      interests: [],
      goals: [],
      lastUpdated: Date.now(),
    };

    await ctx.db.patch(existing._id, {
      identity: {
        ...currentIdentity,
        skills: args.skills ?? currentIdentity.skills,
        interests: args.interests ?? currentIdentity.interests,
        goals: args.goals ?? currentIdentity.goals,
        targetRoles: args.targetRoles ?? currentIdentity.targetRoles,
        lookingFor: args.lookingFor ?? currentIdentity.lookingFor,
        lastUpdated: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

// Evolve identity based on interaction insights (append-only)
export const evolveUserIdentity = mutation({
  args: {
    clerkId: v.string(),
    newSkills: v.array(v.string()),
    newInterests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existing) return null;

    const currentIdentity = (existing.identity as any) || {
      skills: [],
      interests: [],
    };

    const updatedSkills = Array.from(new Set([
      ...(currentIdentity.skills || []),
      ...args.newSkills
    ]));

    const updatedInterests = Array.from(new Set([
      ...(currentIdentity.interests || []),
      ...args.newInterests
    ]));

    // Only patch if there are changes
    if (updatedSkills.length !== (currentIdentity.skills?.length || 0) ||
      updatedInterests.length !== (currentIdentity.interests?.length || 0)) {

      await ctx.db.patch(existing._id, {
        identity: {
          ...currentIdentity,
          skills: updatedSkills,
          interests: updatedInterests,
          lastUpdated: Date.now(),
        },
        updatedAt: Date.now(),
      });
      console.log(`[Evolve] Updated user ${args.clerkId}: +${args.newSkills.length} skills, +${args.newInterests.length} interests`);
    }

    return existing._id;
  },

});

export const vectorizeProfileInSnowflake = action({
  args: {
    clerkId: v.string(),
    name: v.string(),
    education: v.string(),
    interests: v.array(v.string()),
    resumeText: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const account = (process as any).env.SNOWFLAKE_ACCOUNT
    const user = (process as any).env.SNOWFLAKE_USER
    const password = (process as any).env.SNOWFLAKE_PASSWORD
    const bearerToken = (process as any).env.SNOWFLAKE_BEARER_TOKEN
    const database = (process as any).env.SNOWFLAKE_DATABASE || 'badge_app'
    const warehouse = (process as any).env.SNOWFLAKE_WAREHOUSE || 'badge_wh'

    console.log('[Snowflake] Starting vectorization...')
    console.log('[Snowflake] Account:', account ? 'SET' : 'MISSING')
    console.log('[Snowflake] User:', user ? 'SET' : 'MISSING')
    console.log('[Snowflake] Password:', password ? 'SET' : 'MISSING')
    console.log('[Snowflake] Database:', database)
    console.log('[Snowflake] Warehouse:', warehouse)
    console.log('[Snowflake] Auth mode:', bearerToken ? 'Bearer token' : 'Basic user/password')

    if (!account || !user || (!password && !bearerToken)) {
      const reason = `Missing Snowflake credentials: ${!account ? 'ACCOUNT ' : ''}${!user ? 'USER ' : ''}${(!password && !bearerToken) ? 'PASSWORD_OR_BEARER' : ''}`
      console.error('[Snowflake]', reason)
      return { success: false, reason }
    }

    // Combine minimal text fields for vectorization
    const profileText = `
Name: ${args.name}
Education: ${args.education}
Interests: ${args.interests.join(', ')}
Resume: ${args.resumeText || ''}
    `.trim().replace(/'/g, "''") // Escape single quotes for SQL

    console.log('[Snowflake] Profile text length:', profileText.length)

    try {
      // Snowflake SQL REST API endpoint
      const snowflakeUrl = `https://${account}.snowflakecomputing.com/api/v2/statements`
      console.log('[Snowflake] API URL:', snowflakeUrl)

      // Choose auth header: Bearer (preferred if provided) else Basic
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`
        headers['X-Snowflake-Authorization-Token-Type'] = 'KEYPAIR_JWT'
      } else {
        const authToken = btoa(`${user}:${password}`)
        headers['Authorization'] = `Basic ${authToken}`
      }

      // SQL to vectorize and store profile
      const sql = `
        MERGE INTO ${database}.profiles.user_profiles AS target
        USING (
          SELECT 
            '${args.clerkId}' AS clerk_id,
            '${args.name}' AS name,
            SNOWFLAKE.CORTEX.EMBED_TEXT_768('snowflake-arctic-embed-m-v1.5', '${profileText}') AS profile_vector,
            CURRENT_TIMESTAMP() AS updated_at
        ) AS source
        ON target.clerk_id = source.clerk_id
        WHEN MATCHED THEN
          UPDATE SET 
            name = source.name,
            profile_vector = source.profile_vector,
            updated_at = source.updated_at
        WHEN NOT MATCHED THEN
          INSERT (clerk_id, name, profile_vector, created_at, updated_at)
          VALUES (source.clerk_id, source.name, source.profile_vector, CURRENT_TIMESTAMP(), source.updated_at);
      `

      console.log('[Snowflake] Executing SQL...')

      const response = await fetch(snowflakeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          statement: sql,
          timeout: 60,
          database: database
        }),
      })

      console.log('[Snowflake] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Snowflake] API Error:', errorText)
        return { success: false, reason: `HTTP ${response.status}: ${errorText}` }
      }

      const result = await response.json()
      console.log('[Snowflake] Vectorization success:', JSON.stringify(result))
      return { success: true, result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Snowflake] Exception:', errorMessage)
      console.error('[Snowflake] Stack:', error instanceof Error ? error.stack : 'N/A')
      return { success: false, reason: errorMessage }
    }
  },
});

export const generateConversationTalkingPoints = action({
  args: {
    myProfile: v.any(),
    theirProfile: v.any(),
  },
  handler: async (_, args) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const myIdentity = args.myProfile?.identity || {};
    const theirIdentity = args.theirProfile?.identity || {};

    const myEducation = myIdentity.education?.map((e: any) => `${e.degree} in ${e.field} from ${e.institution}`).join('; ') || 'N/A';
    const myExperience = myIdentity.experience?.map((e: any) => `${e.role} at ${e.company}`).join('; ') || 'N/A';
    const theirEducation = theirIdentity.education?.map((e: any) => `${e.degree} in ${e.field} from ${e.institution}`).join('; ') || 'N/A';
    const theirExperience = theirIdentity.experience?.map((e: any) => `${e.role} at ${e.company}`).join('; ') || 'N/A';

    const prompt = `You are a helpful conversation assistant. Given two people's profiles, generate talking points to help them start a meaningful conversation.

MY PROFILE:
- Name: ${args.myProfile?.name || 'Unknown'}
- Headline: ${myIdentity.headline || 'N/A'}
- Summary: ${myIdentity.summary || 'N/A'}
- Skills: ${myIdentity.skills?.join(', ') || 'N/A'}
- Interests: ${myIdentity.interests?.join(', ') || 'N/A'}
- Education: ${myEducation}
- Experience: ${myExperience}
- Goals: ${myIdentity.goals?.join(', ') || 'N/A'}

THEIR PROFILE:
- Name: ${args.theirProfile?.name || 'Unknown'}
- Headline: ${theirIdentity.headline || 'N/A'}
- Summary: ${theirIdentity.summary || 'N/A'}
- Skills: ${theirIdentity.skills?.join(', ') || 'N/A'}
- Interests: ${theirIdentity.interests?.join(', ') || 'N/A'}
- Education: ${theirEducation}
- Experience: ${theirExperience}
- Goals: ${theirIdentity.goals?.join(', ') || 'N/A'}

Generate a JSON response with the following structure:
{
  "commonInterests": ["list of shared interests or overlapping goals (MAX 3 things EACH THING MAX 5 WORDS)"],
  "complementarySkills": ["ways their skills complement mine(MAX 3 things  EACH THING MAX 20 WORDS)"],
  "questions": ["thoughtful questions to ask them(MAX 3 questions ATLEAST ONE SHOULD BE NON WORK RELATED about hobbies or something wierd  EACH THING QUICK and ALLOW FOR FOLLOW UPS)"],
  "suggestions": ["suggestions for collaboration or conversation starters(MAX 3 things EACH THING MAX 10 WORDS)"]
}

Make the suggestions specific, actionable, and genuine.`;

    try {
      const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', response.status, errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini response:', JSON.stringify(data, null, 2));
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!content) {
        console.error('No content in Gemini response. Full response:', JSON.stringify(data));
        return {
          commonInterests: ['Could not generate talking points. Please try again.'],
          complementarySkills: [],
          questions: [],
          suggestions: [],
        };
      }
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('Could not parse JSON from Gemini content:', content);
        // Try to return a default response structure
        return {
          commonInterests: [content],
          complementarySkills: [],
          questions: [],
          suggestions: [],
        };
      }

      const talkingPoints = JSON.parse(jsonMatch[0]);
      return talkingPoints;
    } catch (error) {
      console.error('Error generating talking points:', error);
      throw error;
    }
  },
});

export const generateBoothApproachStrategy = action({
  args: {
    userProfile: v.object({
      name: v.string(),
      headline: v.string(),
      skills: v.array(v.string()),
      interests: v.array(v.string()),
      education: v.array(v.object({
        institution: v.string(),
        degree: v.string(),
        field: v.string(),
        gpa: v.optional(v.string()),
        graduationYear: v.optional(v.string()),
      })),
      experience: v.array(v.object({
        company: v.string(),
        role: v.string(),
        duration: v.string(),
        highlights: v.optional(v.array(v.string())),
      })),
      goals: v.array(v.string()),
      targetRoles: v.array(v.string()),
    }),
    booth: v.object({
      id: v.string(),
      name: v.string(),
      companyName: v.string(),
      description: v.string(),
      tags: v.array(v.string()),
    }),
  },
  handler: async (_ctx, args) => {
    const { userProfile, booth } = args;
    const geminiKey = (process as any).env.GEMINI_API_KEY;
    
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Format user profile data for the prompt
    const userSkills = userProfile.skills.join(', ') || 'Not specified';
    const userInterests = userProfile.interests.join(', ') || 'Not specified';
    const userGoals = userProfile.goals.join(', ') || 'Not specified';
    const userTargetRoles = userProfile.targetRoles.join(', ') || 'Not specified';
    const boothTags = booth.tags.join(', ') || 'Not specified';
    
    const userEducation = userProfile.education
      .map(e => `${e.degree} in ${e.field} from ${e.institution}`)
      .join('; ') || 'Not specified';
    
    const userExperience = userProfile.experience
      .map(e => `${e.role} at ${e.company} (${e.duration})`)
      .join('; ') || 'Not specified';

    const prompt = `You are a career advisor helping ${userProfile.name} (${userProfile.headline}) prepare to approach the ${booth.companyName} booth at a career fair.

About the person:
- Skills: ${userSkills}
- Interests: ${userInterests}
- Career Goals: ${userGoals}
- Target Roles: ${userTargetRoles}
- Education: ${userEducation}
- Experience: ${userExperience}

About the ${booth.companyName} booth:
- Description: ${booth.description}
- Focus Areas: ${boothTags}

Generate a personalized strategy for how this person should approach this booth. Provide the response as a JSON object with these four arrays:
1. "keyStrategies" - 3-4 main strategies for approaching and talking to the booth representative each max a sentence
2. "whyGood" - 3-4 reasons why this person is a good fit for what ${booth.companyName} is looking for each max a sentence
3. "whatToAsk" - 3-4 specific, intelligent questions to ask the booth representative bonus points if it has something to do with the booth rep each max a sentence
4. "preparation" - 3-4 specific preparation steps before approaching the booth each max a sentence

Focus on making the recommendations specific to both the person's profile and the booth's expertise areas.

Respond ONLY with valid JSON object, no additional text.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText);
        return {
          keyStrategies: ['Unable to generate strategy. Please try again later.'],
          whyGood: [],
          whatToAsk: [],
          preparation: [],
        };
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error('No content in Gemini response. Full response:', JSON.stringify(data));
        return {
          keyStrategies: ['Could not generate booth approach strategy. Please try again.'],
          whyGood: [],
          whatToAsk: [],
          preparation: [],
        };
      }

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('Could not parse JSON from Gemini content:', content);
        return {
          keyStrategies: [content],
          whyGood: [],
          whatToAsk: [],
          preparation: [],
        };
      }

      const boothStrategy = JSON.parse(jsonMatch[0]);
      return boothStrategy;
    } catch (error) {
      console.error('Error generating booth approach strategy:', error);
      throw error;
    }
  },
});
