/**
 * UniNav Sound & Notification Effects (Web Audio API Synthesizer)
 * Cero dependencias externas: Genera sonidos armónicos puros en tiempo real
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /**
   * Campana Zen / Chime de Descanso (Armónico Mayor: C5, E5, G5, C6)
   * Se dispara cuando termina el bloque de concentración y comienza el descanso libre 🟢
   */
  playBreakChime(volume = 0.4) {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 523.25, time: 0, decay: 2.5 },   // C5
      { freq: 659.25, time: 0.12, decay: 2.8 }, // E5
      { freq: 783.99, time: 0.24, decay: 3.2 }, // G5
      { freq: 1046.5, time: 0.36, decay: 3.6 }, // C6 (campana brillante)
    ]

    notes.forEach(({ freq, time, decay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + time)

      // Envolvente de campana: ataque rápido y decaimiento exponencial natural
      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(volume, now + time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + decay)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + decay)
    })
  }

  /**
   * Tono de Foco Activo (Gong Suave: A4, E5)
   * Se dispara cuando inicia un bloque de concentración 🔴
   */
  playStudyChime(volume = 0.35) {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 440.0, time: 0, decay: 2.0 },    // A4
      { freq: 659.25, time: 0.15, decay: 2.4 }, // E5
    ]

    notes.forEach(({ freq, time, decay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + time)

      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(volume, now + time + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + decay)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + decay)
    })
  }

  /**
   * Tono de Advertencia (Últimos 2 minutos de foco 🟡)
   */
  playWarningChime(volume = 0.25) {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 587.33, time: 0, decay: 1.2 },    // D5
      { freq: 440.0, time: 0.18, decay: 1.5 },  // A4
    ]

    notes.forEach(({ freq, time, decay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + time)

      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(volume, now + time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + decay)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + decay)
    })
  }

  /**
   * Tono de Pausa (Dos notas descendentes suaves: E5 -> C5)
   * Da feedback auditivo táctil de que la sesión se pausó ⏸️
   */
  playPauseChime(volume = 0.2) {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 659.25, time: 0, decay: 0.25 },   // E5
      { freq: 523.25, time: 0.08, decay: 0.35 }, // C5
    ]

    notes.forEach(({ freq, time, decay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + time)

      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(volume, now + time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + decay)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + decay)
    })
  }

  /**
   * Tono de Reanudación (Dos notas ascendentes suaves: C5 -> E5)
   * Da feedback auditivo de que la sesión continuó ▶️
   */
  playResumeChime(volume = 0.2) {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 523.25, time: 0, decay: 0.2 },    // C5
      { freq: 659.25, time: 0.08, decay: 0.3 }, // E5
    ]

    notes.forEach(({ freq, time, decay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + time)

      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(volume, now + time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + decay)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + decay)
    })
  }
}

export const soundEffects = new SoundSynthesizer()

/**
 * Notificación Nativa del Navegador
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

export function sendStudyNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      })
    } catch {
      // Ignorar en navegadores restrictivos
    }
  }
}
