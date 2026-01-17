/**
 * Badge - Minimal Amplitude Event Tracking
 * Optimized for 10K token limit (~400 interactions)
 */

import * as amplitude from "@amplitude/analytics-browser";

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

let initialized = false;

export function initAmplitude(userId?: string) {
  if (initialized || !AMPLITUDE_API_KEY) {
    if (!AMPLITUDE_API_KEY) {
      console.warn("[Amplitude] No API key - events logged to console only");
    }
    return;
  }

  amplitude.init(AMPLITUDE_API_KEY, {
    defaultTracking: false,
  });

  if (userId) {
    amplitude.setUserId(userId);
  }

  initialized = true;
  console.log("[Amplitude] Initialized");
}

export function setAmplitudeUserId(userId: string) {
  if (AMPLITUDE_API_KEY) {
    amplitude.setUserId(userId);
  }
}

// Event 1: interaction_started
export function trackInteractionStarted(props: {
  visitorId: string;
  boothId: string;
  boothName: string;
  mode: "voice" | "manual";
}) {
  const event = {
    event: "interaction_started",
    props: {
      visitorId: props.visitorId,
      visitorBoothId: props.boothId,
      booth: props.boothName.slice(0, 30),
      mode: props.mode,
      ts: Date.now(),
    },
  };

  if (AMPLITUDE_API_KEY && initialized) {
    amplitude.track(event.event, event.props);
  }
  console.log("[Track]", event);
}

// Event 2: recording_completed
export function trackRecordingCompleted(props: {
  visitorId: string;
  visitorBoothId: string;
  durationSec: number;
  willTranscribe: boolean;
}) {
  const event = {
    event: "recording_completed",
    props: {
      visitorId: props.visitorId,
      visitorBoothId: props.visitorBoothId,
      dur: props.durationSec,
      transcribe: props.willTranscribe,
    },
  };

  if (AMPLITUDE_API_KEY && initialized) {
    amplitude.track(event.event, event.props);
  }
  console.log("[Track]", event);
}

// Event 3: interaction_saved
export function trackInteractionSaved(props: {
  visitorId: string;
  visitorBoothId: string;
  hasAudio: boolean;
  transcriptLen: number;
  tagCount: number;
  summaryLen: number;
}) {
  const event = {
    event: "interaction_saved",
    props: {
      visitorId: props.visitorId,
      visitorBoothId: props.visitorBoothId,
      audio: props.hasAudio,
      tLen: props.transcriptLen,
      tags: props.tagCount,
      sLen: props.summaryLen,
    },
  };

  if (AMPLITUDE_API_KEY && initialized) {
    amplitude.track(event.event, event.props);
  }
  console.log("[Track]", event);
}

// Event 4: identity_evolved
export function trackIdentityEvolved(props: {
  visitorId: string;
  trigger: "audio" | "manual" | "threshold";
  totalInteractions: number;
  newTagCount: number;
  version: number;
}) {
  const event = {
    event: "identity_evolved",
    props: {
      visitorId: props.visitorId,
      trigger: props.trigger,
      intCount: props.totalInteractions,
      newTags: props.newTagCount,
      ver: props.version,
    },
  };

  if (AMPLITUDE_API_KEY && initialized) {
    amplitude.track(event.event, event.props);
  }
  console.log("[Track]", event);
}

// Event 5: recommendation_clicked
export function trackRecommendationClicked(props: {
  visitorId: string;
  visitorBoothId: string;
  position: number;
  score: number;
}) {
  const event = {
    event: "recommendation_clicked",
    props: {
      visitorId: props.visitorId,
      visitorBoothId: props.visitorBoothId,
      pos: props.position,
      score: Math.round(props.score),
    },
  };

  if (AMPLITUDE_API_KEY && initialized) {
    amplitude.track(event.event, event.props);
  }
  console.log("[Track]", event);
}

export function flushAmplitude() {
  if (AMPLITUDE_API_KEY && initialized) {
    amplitude.flush();
  }
}

export { amplitude };