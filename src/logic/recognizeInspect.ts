import { createWorker, type Worker } from 'tesseract.js'
import { parseInspectScreen } from './parseInspectScreen'
import type { ParsedExamine } from './parseExamineLog'

let workerPromise: Promise<Worker> | null = null
let progressListener: (progress: number) => void = () => {}

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      logger: (message) => {
        if (typeof message.progress === 'number') progressListener(message.progress)
      },
    })
  }
  return workerPromise
}

async function prepare(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  if (bitmap.width >= 900) {
    bitmap.close()
    return file
  }
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width * scale
  canvas.height = bitmap.height * scale
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob ?? file
}

export async function recognizeInspect(
  file: Blob,
  onProgress?: (progress: number) => void,
): Promise<ParsedExamine | null> {
  progressListener = onProgress ?? (() => {})
  try {
    const worker = await getWorker()
    const image = await prepare(file)
    const result = await worker.recognize(image)
    return parseInspectScreen(result.data.text)
  } catch (error) {
    const current = workerPromise
    workerPromise = null
    if (current) current.then((worker) => worker.terminate()).catch(() => {})
    throw error
  }
}
