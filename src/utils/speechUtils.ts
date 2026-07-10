// Speech Web API Wrapper

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export function getSpeechRecognition(): any {
  if (typeof window !== "undefined") {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      return new SpeechRecognition();
    }
  }
  return null;
}

let lastUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, voiceName?: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  // Clean text of markdown characters, asterisks, and tags for clean TTS
  const cleanText = text
    .replace(/\*+/g, "")
    .replace(/#+/g, "")
    .replace(/@\w+\s\w+/g, (match) => match.replace("@", "")) // Remove @ for tagging names
    .replace(/\[.*?\]/g, "")
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  lastUtterance = utterance;

  // Find a suitable premium high-quality english voice
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find((v) => v.name.includes("Google US English") || v.name.includes("Google UK English Female"));
  if (!selectedVoice) {
    selectedVoice = voices.find((v) => v.lang.startsWith("en"));
  }
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = 1.05; // Slightly faster for strategic feel
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (err) => {
    console.warn("SpeechSynthesis playback status:", err);
    if (onEnd) onEnd();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("SpeechSynthesis.speak failed synchronously:", error);
    if (onEnd) onEnd();
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
