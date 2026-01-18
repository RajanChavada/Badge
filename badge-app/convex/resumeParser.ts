import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Parse resume text using Gemini to extract structured identity
 */
export const parseResume = action({
  args: {
    resumeText: v.string(),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
  },
  handler: async (_, args): Promise<{
    success: boolean;
    identity?: {
      headline: string;
      summary?: string;
      education?: Array<{
        institution: string;
        degree?: string;
        field?: string;
        graduationYear?: string;
        gpa?: string;
      }>;
      experience?: Array<{
        company: string;
        role: string;
        duration?: string;
        highlights?: string[];
      }>;
      projects?: Array<{
        name: string;
        description?: string;
        technologies?: string[];
        url?: string;
      }>;
      skills: string[];
      technicalSkills?: string[];
      softSkills?: string[];
      languages?: string[];
      interests: string[];
      goals: string[];
      targetRoles?: string[];
      targetCompanyTypes?: string[];
      lookingFor?: string[];
      availableFor?: string[];
    };
    error?: string;
  }> => {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      console.error("[ResumeParser] No GEMINI_API_KEY configured");
      return {
        success: false,
        error: "GEMINI_API_KEY not configured. Add it in Convex Dashboard > Settings > Environment Variables",
      };
    }

    try {
      console.log("[ResumeParser] Parsing resume with Gemini...", {
        textLength: args.resumeText.length,
        userName: args.userName,
      });

      const prompt = buildPrompt(args.resumeText, args.userName, args.userEmail);
      const result = await callGemini(geminiKey, prompt);

      console.log("[ResumeParser] Successfully parsed resume");
      return {
        success: true,
        identity: result,
      };
    } catch (error) {
      console.error("[ResumeParser] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse resume",
      };
    }
  },
});

function buildPrompt(resumeText: string, userName?: string, userEmail?: string): string {
  return `You are an AI that extracts structured information from resumes for a hackathon/career fair networking app.

CONTEXT:
- User name: ${userName || "Unknown"}
- User email: ${userEmail || "Unknown"}

RESUME TEXT:
---
${resumeText.slice(0, 8000)}
---

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):

{
  "headline": "One-line professional headline (e.g., 'CS Student at UofT | Full-Stack Developer | AI Enthusiast')",
  "summary": "2-3 sentence professional summary",
  "education": [
    {
      "institution": "University name",
      "degree": "Degree type (BS, MS, etc.)",
      "field": "Major/field of study",
      "graduationYear": "Expected or actual graduation year",
      "gpa": "GPA if mentioned"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Time period (e.g., 'Jun 2024 - Present')",
      "highlights": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"],
      "url": "GitHub/demo URL if present"
    }
  ],
  "skills": ["All skills as lowercase tags"],
  "technicalSkills": ["Programming languages, frameworks, tools"],
  "softSkills": ["Leadership, communication, etc."],
  "languages": ["English", "French", etc."],
  "interests": ["Areas of interest for career/learning"],
  "goals": ["Career goals"],
  "targetRoles": ["Roles they're seeking: Software Engineer, PM, etc."],
  "targetCompanyTypes": ["startup", "big-tech", "finance", etc.],
  "lookingFor": ["internship", "full-time", "co-op", "mentorship"],
  "availableFor": ["collaboration", "hackathon-team", "networking"]
}

IMPORTANT:
- Extract REAL data from the resume, don't make things up
- If information is not present, omit that field or use empty array
- Skills should be lowercase, normalized tags (e.g., "react", "python", "machine-learning")
- Be generous in extracting interests and goals even if implicit
- For a hackathon attendee, assume they're open to networking and collaboration`;
}

async function callGemini(apiKey: string, prompt: string): Promise<{
  headline: string;
  summary?: string;
  education?: Array<{
    institution: string;
    degree?: string;
    field?: string;
    graduationYear?: string;
    gpa?: string;
  }>;
  experience?: Array<{
    company: string;
    role: string;
    duration?: string;
    highlights?: string[];
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  skills: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  languages?: string[];
  interests: string[];
  goals: string[];
  targetRoles?: string[];
  targetCompanyTypes?: string[];
  lookingFor?: string[];
  availableFor?: string[];
}> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 10000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[ResumeParser] Gemini API error:", error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  console.log("[ResumeParser] Raw Gemini response:", content.slice(0, 500));

  // Clean up response (extract JSON from markdown code blocks or raw text)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  let cleaned = jsonMatch ? jsonMatch[0] : content;

  // Remove markdown code fences if they got included in the match (unlikely with greedy match but safe)
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Ensure required fields have defaults
    return {
      headline: parsed.headline || "Hackathon Attendee",
      summary: parsed.summary,
      education: parsed.education,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills || [],
      technicalSkills: parsed.technicalSkills,
      softSkills: parsed.softSkills,
      languages: parsed.languages,
      interests: parsed.interests || [],
      goals: parsed.goals || [],
      targetRoles: parsed.targetRoles,
      targetCompanyTypes: parsed.targetCompanyTypes,
      lookingFor: parsed.lookingFor || ["networking", "opportunities"],
      availableFor: parsed.availableFor || ["collaboration", "hackathon-team"],
    };
  } catch (parseError) {
    console.error("[ResumeParser] JSON parse error:", parseError);
    console.error("[ResumeParser] Content was:", cleaned.slice(0, 500));
    throw new Error("Failed to parse Gemini response as JSON");
  }
}
