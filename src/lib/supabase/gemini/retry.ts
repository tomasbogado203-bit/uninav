export async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = 4,
  delayMs = 1500
): Promise<T> {
  let attempt = 0
  while (attempt < retries) {
    try {
      return await fn()
    } catch (err: any) {
      attempt++

      const errString = JSON.stringify(err) + ' ' + (err?.message || '') + ' ' + (err?.status || '') + ' ' + (err?.code || '')

      const isTransient =
        err?.status === 503 ||
        err?.status === 500 ||
        err?.status === 429 ||
        err?.code === 500 ||
        err?.code === 503 ||
        errString.includes('500') ||
        errString.includes('503') ||
        errString.includes('429') ||
        errString.includes('502') ||
        errString.includes('504') ||
        errString.includes('INTERNAL') ||
        errString.includes('Internal error') ||
        errString.includes('high demand') ||
        errString.includes('UNAVAILABLE') ||
        errString.includes('fetch failed')

      if (isTransient && attempt < retries) {
        console.warn(
          `Gemini API reconexión por error temporal (${err?.status || err?.code || '500'}). Reintentando (${attempt}/${retries}) en ${
            delayMs * attempt
          }ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      } else {
        if (isTransient) {
          throw new Error(
            'El servidor de IA de Google experimentó un micro-corte o alta demanda temporal. Por favor, volvé a presionar el botón en unos segundos.'
          )
        }
        throw err
      }
    }
  }
  throw new Error(
    'El servicio de IA está temporalmente sobrecargado. Por favor, reintentá en unos segundos.'
  )
}
