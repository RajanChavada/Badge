import { v } from "convex/values";
import { action } from "./_generated/server";

// ElevenLabs Scribe response type
interface ScribeResponse {
  text: string;
  language_code?: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    type: string;
  }>;
}

// Helper to decode base64 to Uint8Array (works in V8 runtime)
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Simple speech-to-text action using ElevenLabs
export const transcribeAudio = action({
  args: {
    audioBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, args): Promise<{
    success: boolean;
    text?: string;
    language?: string;
    words?: Array<{ word: string; start: number; end: number }>;
    error?: string;
  }> => {
    const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenlabsKey) {
      console.error("❌ ELEVENLABS_API_KEY is missing. Please set it in the Convex Dashboard.");
      return {
        success: false,
        error: "Configuration Error: ELEVENLABS_API_KEY is missing. Check backend logs.",
      };
    }

    try {
      // Convert base64 to Uint8Array
      const audioBytes = base64ToUint8Array(args.audioBase64);

      // Determine file extension from mime type
      let extension = "webm";
      if (args.mimeType.includes("mp4")) extension = "mp4";
      else if (args.mimeType.includes("wav")) extension = "wav";
      else if (args.mimeType.includes("mp3")) extension = "mp3";

      // Create FormData for ElevenLabs API
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([audioBytes.buffer as ArrayBuffer], { type: args.mimeType }),
        `audio.${extension}`
      );
      // Use the speech-to-text model
      formData.append("model_id", "scribe_v1");
      formData.append("tag_audio_events", "false");

      console.log("Sending audio to ElevenLabs...", {
        size: audioBytes.length,
        mimeType: args.mimeType,
      });

      const response = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenlabsKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", response.status, errorText);
        return {
          success: false,
          error: `ElevenLabs API error (${response.status}): ${errorText}`,
        };
      }

      const result: ScribeResponse = await response.json();

      console.log("Transcription result:", {
        textLength: result.text?.length,
        language: result.language_code,
        wordCount: result.words?.length,
      });

      return {
        success: true,
        text: result.text,
        language: result.language_code,
        words: result.words?.map((w) => ({
          word: w.word,
          start: w.start,
          end: w.end,
        })),
      };
    } catch (error) {
      console.error("Transcription error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});
