export interface ExtractedPage {
  page: number
  text: string
}

/**
 * Extrae el texto de un PDF, separado por página.
 * pdf-parse no expone esto directo — lo capturamos con el callback pagerender.
 */
export async function extractTextByPage(buffer: Buffer): Promise<ExtractedPage[]> {
  // Polyfill mínimo para entornos Node.js / Server Actions donde pdfjs-dist busca DOMMatrix
  if (typeof globalThis.DOMMatrix === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).DOMMatrix = class DOMMatrix {}
  }

  // Carga diferida en tiempo de ejecución para evitar fallos de análisis estático en Turbopack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfModule = eval('require')('pdf-parse')
  const pdf = typeof pdfModule === 'function' ? pdfModule : pdfModule.default || pdfModule

  if (typeof pdf !== 'function') {
    throw new Error('No se pudo inicializar la librería pdf-parse correctamente.')
  }

  const pages: ExtractedPage[] = []
  let pageNum = 0

  await pdf(buffer, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagerender: (pageData: any) => {
      pageNum += 1
      return pageData.getTextContent().then((textContent: { items: { str: string }[] }) => {
        const text = textContent.items.map((item) => item.str).join(' ')
        pages.push({ page: pageNum, text })
        return text
      })
    },
  })

  return pages
}
