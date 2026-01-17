import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

function toList(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function ProfileForm() {
  const { user } = useUser();
  const clerkId = user?.id;

  const existing = useQuery(api.users.getProfile, clerkId ? { clerkId } : "skip");
  const upsert = useMutation(api.users.upsertProfile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [status, setStatus] = useState<null | string>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.fullName ?? user.firstName ?? "");
    setEmail(user.primaryEmailAddress?.emailAddress ?? "");
  }, [user]);

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? name);
      setEmail(existing.email ?? email);
      setResumeText(existing.resumeText ?? "");
      const id = existing.identity;
      if (id) {
        setHeadline(id.headline ?? "");
        setSkills(id.skills?.join(", ") ?? "");
        setInterests(id.interests?.join(", ") ?? "");
        setGoals(id.goals?.join(", ") ?? "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?._id]);

  const canSubmit = useMemo(() => {
    return Boolean(clerkId && email && name);
  }, [clerkId, email, name]);

  if (!clerkId) {
    return (
      <div className="max-w-xl mx-auto text-center text-gray-500">
        Please sign in to edit your profile.
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");
    try {
      await upsert({
        clerkId,
        email,
        name,
        resumeText: resumeText || undefined,
        identity: {
          headline: headline || "",
          skills: toList(skills),
          interests: toList(interests),
          goals: toList(goals),
        },
      });
      setStatus("Saved");
    } catch (err) {
      console.error(err);
      setStatus("Failed to save");
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Your Profile</h2>
      <p className="text-sm text-gray-500">
        Fields derived from schema: name, email, resumeText, and identity
        (headline, skills, interests, goals).
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Name</span>
        <input
          className="border rounded p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Email</span>
        <input
          className="border rounded p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Headline</span>
        <input
          className="border rounded p-2"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g., Frontend Engineer passionate about UX"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Skills (comma-separated)</span>
        <input
          className="border rounded p-2"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="React, TypeScript, Tailwind"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Interests (comma-separated)</span>
        <input
          className="border rounded p-2"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="AI, Design Systems"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Goals (comma-separated)</span>
        <input
          className="border rounded p-2"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="Lead team, speak at conference"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Resume Text</span>
        <textarea
          className="border rounded p-2 h-32"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste plain-text resume or summary"
        />
      </label>

      <div className="flex items-center gap-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          type="submit"
          disabled={!canSubmit}
        >
          Save Profile
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </form>
  );
}
