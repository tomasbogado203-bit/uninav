/**
 * UniNav Sound & Notification Effects (Web Audio API Synthesizer)
 * Cero dependencias externas: Genera sonidos armónicos puros y nítidos en tiempo real
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private playToneSeries(
    notes: { freq: number; time: number; decay: number; type?: OscillatorType }[],
    volume = 0.35
  ) {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime

    notes.forEach(({ freq, time, decay, type = 'sine' }) => {
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = type
        osc.frequency.setValueAtTime(freq, now + time)

        // Envolvente de volumen segura sin valores 0 antes de rampas exponenciales
        gain.gain.setValueAtTime(0.001, now + time)
        gain.gain.linearRampToValueAtTime(volume, now + time + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + decay)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + time)
        osc.stop(now + time + decay)
      } catch {
        // Fallback silencioso si el navegador restringe audio
      }
    })
  }

  /**
   * Campana Zen / Chime de Descanso (Acorde Armónico Mayor: C5, E5, G5, C6)
   * Se dispara cuando termina el bloque de concentración y comienza el descanso libre 🟢
   */
  playBreakChime(volume = 0.45) {
    this.playToneSeries(
      [
        { freq: 523.25, time: 0, decay: 2.5 },    // C5
        { freq: 659.25, time: 0.12, decay: 2.8 },  // E5
        { freq: 783.99, time: 0.24, decay: 3.2 },  // G5
        { freq: 1046.5, time: 0.36, decay: 3.6 },  // C6 (campana brillante)
      ],
      volume
    )
  }

  /**
   * Tono de Foco Activo (Gong / Chime Suave: A4, E5, A5)
   * Se dispara cuando inicia un bloque de concentración 🔴
   */
  playStudyChime(volume = 0.4) {
    this.playToneSeries(
      [
        { freq: 440.0, time: 0, decay: 1.8 },     // A4
        { freq: 659.25, time: 0.12, decay: 2.2 },  // E5
        { freq: 880.0, time: 0.24, decay: 2.5 },   // A5
      ],
      volume
    )
  }

  /**
   * Tono de Advertencia (Últimos 2 minutos de foco 🟡)
   */
  playWarningChime(volume = 0.35) {
    this.playToneSeries(
      [
        { freq: 587.33, time: 0, decay: 1.0, type: 'triangle' },   // D5
        { freq: 440.0, time: 0.15, decay: 1.3, type: 'triangle' }, // A4
      ],
      volume
    )
  }

  /**
   * Tono de Pausa (Dos notas descendentes claras: G5 ➔ D5 ➔ C5)
   * Da feedback auditivo táctil de que la sesión se pausó ⏸️
   */
  playPauseChime(volume = 0.35) {
    this.playToneSeries(
      [
        { freq: 783.99, time: 0, decay: 0.3 },     // G5
        { freq: 587.33, time: 0.08, decay: 0.35 }, // D5
        { freq: 523.25, time: 0.16, decay: 0.45 }, // C5
      ],
      volume
    )
  }

  /**
   * Tono de Reanudación (Dos notas ascendentes nítidas: C5 ➔ E5 ➔ G5)
   * Da feedback auditivo de que la sesión continuó ▶️
   */
  playResumeChime(volume = 0.35) {
    this.playToneSeries(
      [
        { freq: 523.25, time: 0, decay: 0.25 },    // C5
        { freq: 659.25, time: 0.08, decay: 0.3 },  // E5
        { freq: 783.99, time: 0.16, decay: 0.4 },  // G5
      ],
      volume
    )
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
