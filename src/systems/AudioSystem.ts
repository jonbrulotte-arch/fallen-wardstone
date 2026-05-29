export type AudioCue = "town" | "wilds" | "dungeon" | "combat" | "victory" | "ui" | "boss";

const cueFrequency: Record<AudioCue, number> = {
  town: 220,
  wilds: 174,
  dungeon: 130,
  combat: 196,
  victory: 330,
  ui: 440,
  boss: 110
};

export class AudioSystem {
  private context?: AudioContext;

  play(cue: AudioCue, volume = 0.08): void {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    this.context ??= new AudioContextCtor();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = cue === "boss" || cue === "dungeon" ? "sawtooth" : "triangle";
    oscillator.frequency.value = cueFrequency[cue];
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.24);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
