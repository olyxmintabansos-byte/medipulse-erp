import { PoliType } from '@/types/medipulse';

// Web Audio API Hospital Chime (Ding-Dong: C5 then E5)
export const playHospitalChime = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();

      // First tone (Ding - C5 / 523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Second tone (Dong - E5 / 659.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);

      osc2.start(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 1.2);

      setTimeout(() => {
        ctx.close();
        resolve();
      }, 1300);
    } catch (e) {
      console.warn('Audio chime error:', e);
      resolve();
    }
  });
};

export const formatPoliNameIndonesian = (poli: PoliType): string => {
  switch (poli) {
    case 'POLI_UMUM':
      return 'Poli Umum';
    case 'POLI_GIGI':
      return 'Poli Gigi';
    case 'POLI_ANAK':
      return 'Poli Anak';
    default:
      return 'Poli';
  }
};

// Spell ticket number for natural voice (e.g., A-05 -> "A, nol, lima")
export const formatTicketForSpeech = (ticketNumber: string): string => {
  const parts = ticketNumber.split('-');
  if (parts.length !== 2) return ticketNumber;
  const prefix = parts[0];
  const digits = parts[1].split('').map(d => (d === '0' ? 'nol' : d)).join(', ');
  return `Nomor antrean ${prefix}, ${digits}`;
};

export const announceQueue = async (ticketNumber: string, poli: PoliType): Promise<void> => {
  await playHospitalChime();

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  window.speechSynthesis.cancel();

  const poliText = formatPoliNameIndonesian(poli);
  const ticketSpeech = formatTicketForSpeech(ticketNumber);
  const textToSpeak = `${ticketSpeech}... silakan menuju ke ${poliText}.`;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = 'id-ID';
  utterance.rate = 0.88;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
  if (idVoice) {
    utterance.voice = idVoice;
  }

  window.speechSynthesis.speak(utterance);
};
