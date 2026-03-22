import confetti from "canvas-confetti";

let activeSpeechTimeout: ReturnType<typeof setTimeout> | null = null;

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return null;

  return new AudioContextCtor();
}

export function speakText(text: string, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
    return;
  }

  const synth = window.speechSynthesis;

  if (activeSpeechTimeout) {
    clearTimeout(activeSpeechTimeout);
    activeSpeechTimeout = null;
  }

  synth.cancel();

  const doSpeak = () => {
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = synth.getVoices();
    const preferredVoice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase())) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) ??
      null;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    const startTime = Date.now();
    let retried = false;

    utterance.onend = () => {
      if (!retried && Date.now() - startTime < 50) {
        retried = true;
        synth.cancel();
        setTimeout(() => {
          synth.resume();
          const retry = new SpeechSynthesisUtterance(text);
          retry.lang = lang;
          retry.rate = 0.85;
          retry.pitch = 1;
          retry.volume = 1;
          if (preferredVoice) retry.voice = preferredVoice;
          synth.speak(retry);
        }, 100);
      }
    };

    synth.speak(utterance);
  };

  const voices = synth.getVoices();
  if (voices.length === 0) {
    const handleVoicesChanged = () => {
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      activeSpeechTimeout = setTimeout(doSpeak, 80);
    };
    synth.addEventListener("voiceschanged", handleVoicesChanged, { once: true });
    activeSpeechTimeout = setTimeout(doSpeak, 80);
    return;
  }

  activeSpeechTimeout = setTimeout(doSpeak, 80);
}

export function playFeedbackTone(isCorrect: boolean) {
  try {
    const ctx = createAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    void ctx.resume().catch(() => undefined);

    if (isCorrect) {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } else {
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    }

    setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 400);
  } catch {
    // Audio can be blocked before the first user interaction.
  }
}

export function launchSuccessConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
    colors: ["#58CC02", "#89E219", "#1CB0F6"],
  });
}

export function playCompletionCelebration() {
  try {
    const ctx = createAudioContext();
    if (ctx) {
      void ctx.resume().catch(() => undefined);

      const notes = [523.25, 659.25, 783.99];
      notes.forEach((frequency, noteIndex) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const startTime = ctx.currentTime + noteIndex * 0.12;

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      });

      setTimeout(() => {
        void ctx.close().catch(() => undefined);
      }, 900);
    }
  } catch {
    // Ignore devices that do not expose Web Audio.
  }

  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.78 },
    colors: ["#58CC02", "#89E219", "#1CB0F6", "#FFD900"],
  });

  setTimeout(() => {
    confetti({
      particleCount: 55,
      spread: 100,
      origin: { y: 0.72 },
      colors: ["#58CC02", "#FFD900", "#FF4B4B"],
    });
  }, 150);
}
