import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

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

export const generateResumeUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveResumeFileId = mutation({
  args: {
    clerkId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (existing) {
      // Delete old file if it exists
      if (existing.resumeFileId) {
        try {
          await ctx.storage.delete(existing.resumeFileId);
        } catch (e) {
          // File may have already been deleted
        }
      }
      
      await ctx.db.patch(existing._id, {
        resumeFileId: args.storageId,
      });
      return existing._id;
    } else {
      const now = Date.now();
      const id = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: "",
        name: "",
        resumeFileId: args.storageId,
        createdAt: now,
      });
      return id;
    }
  },
});

export const getResumeDownloadUrl = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user || !user.resumeFileId) {
      return null;
    }
    
    const downloadUrl = await ctx.storage.getUrl(user.resumeFileId);
    return downloadUrl;
  },
});

export const getProfileVectors = action({
  handler: async (ctx) => {
    const account = process.env.SNOWFLAKE_ACCOUNT
    const user = process.env.SNOWFLAKE_USER
    const bearerToken = process.env.SNOWFLAKE_BEARER_TOKEN
    const database = process.env.SNOWFLAKE_DATABASE || 'badge_app'
    const warehouse = process.env.SNOWFLAKE_WAREHOUSE || 'badge_wh'

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
      }> = []
      
      if (result.data && result.data.length > 0) {
        result.data.forEach((row: any) => {
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
          
          profiles.push({
            clerkId,
            name,
            vector: vectorArray,
            coords3d,
          })
        })
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
    identity: v.optional(
      v.object({
        headline: v.string(),
        skills: v.array(v.string()),
        interests: v.array(v.string()),
        goals: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: args.identity
          ? {
              ...args.identity,
              lastUpdated: now,
            }
          : existing.identity,
        identityVersion: (existing.identityVersion ?? 0) + 1,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        resumeText: args.resumeText,
        identity: args.identity
          ? {
              ...args.identity,
              lastUpdated: now,
            }
          : undefined,
        createdAt: now,
        identityVersion: 1,
      });
      return id;
    }
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
  handler: async (ctx, args) => {
    const account = process.env.SNOWFLAKE_ACCOUNT
    const user = process.env.SNOWFLAKE_USER
    const password = process.env.SNOWFLAKE_PASSWORD
    const bearerToken = process.env.SNOWFLAKE_BEARER_TOKEN
    const database = process.env.SNOWFLAKE_DATABASE || 'badge_app'
    const warehouse = process.env.SNOWFLAKE_WAREHOUSE || 'badge_wh'

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
