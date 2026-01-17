/**
 * Badge - Minimal Amplitude Event Tracking
 * Optimized for 10K token limit (~400 interactions)
 */

import * as amplitude from "@amplitude/analytics-browser";

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

let initialized = false;

export function initAmplitude(userId?: string) {
  if (initialized) return;

  if (!AMPLITUDE_API_KEY) {
    console.warn("[Amplitude] No API key - events logged to console only");
    initialized = true;
    return;
  }

  amplitude.init(AMPLITUDE_API_KEY, {
    defaultTracking: false,
  });

  if (userId) {
    amplitude.setUserId(userId);
  }

  initialized = true;
  console.log("[Amplitude] ✅ Initialized");
}

export function setAmplitudeUserId(userId: string) {
  amplitude.setUserId(userId);
}

// ============================================
// ENHANCED EVENTS (with feedback loop data)
// ============================================

export function trackInteractionStarted(props: {
  visitorId: string;
  boothId: string;
  boothName: string;
  mode: "voice" | "manual";
}) {
  const eventProps = {
    visitorId: props.visitorId,
    boothId: props.boothId,
    booth: props.boothName.slice(0, 30),
    mode: props.mode,
    ts: Date.now(),
  };

  amplitude.track("interaction_started", eventProps);
  console.log("[Amplitude] 📍 interaction_started", eventProps);
}

export function trackRecordingCompleted(props: {
  visitorId: string;
  boothId: string;
  durationSec: number;
  willTranscribe: boolean;
}) {
  const eventProps = {
    visitorId: props.visitorId,
    boothId: props.boothId,
    dur: props.durationSec,
    transcribe: props.willTranscribe,
  };

  amplitude.track("recording_completed", eventProps);
  console.log("[Amplitude] 🎙️ recording_completed", eventProps);
}

/**
 * ENHANCED: interaction_saved with LLM-processed data
 * This is the key event for the feedback loop
 */
export function trackInteractionSaved(props: {
  visitorId: string;
  boothId: string;
  boothName: string;
  hasAudio: boolean;
  transcriptLen: number;
  // LLM-enriched fields
  summary: string;
  tags: string[];
  sentiment: "positive" | "neutral" | "negative" | string;
  confidence: number;
  keyTopics: string[];
  llmModel: string;
}) {
  const eventProps = {
    visitorId: props.visitorId,
    boothId: props.boothId,
    booth: props.boothName.slice(0, 20),
    audio: props.hasAudio,
    tLen: props.transcriptLen,
    // Enriched data (compact)
    sumLen: props.summary.length,
    tagCount: props.tags.length,
    tags: props.tags.slice(0, 3).join(","), // Top 3 tags as string
    sent: props.sentiment,
    conf: Math.round(props.confidence * 100), // 0-100
    topics: props.keyTopics.slice(0, 2).join(","),
    model: props.llmModel,
  };

  amplitude.track("interaction_saved", eventProps);
  console.log("[Amplitude] 💾 interaction_saved", eventProps);
}

/**
 * Track when identity evolves based on accumulated feedback
 */
export function trackIdentityEvolved(props: {
  visitorId: string;
  trigger: "interaction" | "threshold" | "manual";
  totalInteractions: number;
  topTags: string[];
  positiveRatio: number;
  version: number;
}) {
  const eventProps = {
    visitorId: props.visitorId,
    trigger: props.trigger,
    intCount: props.totalInteractions,
    topTags: props.topTags.slice(0, 5).join(","),
    posRatio: Math.round(props.positiveRatio * 100),
    ver: props.version,
  };

  amplitude.track("identity_evolved", eventProps);
  console.log("[Amplitude] 🌱 identity_evolved", eventProps);
}

export function trackRecommendationClicked(props: {
  visitorId: string;
  boothId: string;
  position: number;
  score: number;
}) {
  const eventProps = {
    visitorId: props.visitorId,
    boothId: props.boothId,
    pos: props.position,
    score: Math.round(props.score),
  };

  amplitude.track("recommendation_clicked", eventProps);
  console.log("[Amplitude] 👆 recommendation_clicked", eventProps);
}

export function flushAmplitude() {
  amplitude.flush();
}

export { amplitude };