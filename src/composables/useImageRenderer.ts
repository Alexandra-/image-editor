import type { CropOperation, Operation, SourceImage } from '@/types/operations'

const SUPPORTED_EXPORT_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])

/**
 * Cap the longest preview edge. Large enough for sharp Retina previews; small enough to
 * keep per-frame canvas work light during slider dragging. Exported images are full-res.
 */
export const PREVIEW_MAX_SIZE = 1600

/** Maps our adjustment operations to a CSS/canvas filter string, in array order. */
export function buildFilterString(operations: readonly Operation[]): string {
  const parts: string[] = []

  for (const op of operations) {
    switch (op.type) {
      case 'brightness':
        parts.push(`brightness(${op.value})`)
        break
      case 'contrast':
        parts.push(`contrast(${op.value})`)
        break
      case 'saturation':
        parts.push(`saturate(${op.value})`)
        break
      case 'greyscale':
        parts.push(`grayscale(${op.value})`)
        break
      case 'sepia':
        parts.push(`sepia(${op.value})`)
        break
      case 'crop':
        // crop is a geometry operation applied via drawImage, not a CSS filter.
        break
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'none'
}

interface CropRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

/** Resolves the source rectangle to draw from (full image if there is no crop). */
function getCropRect(operations: readonly Operation[], source: SourceImage): CropRect {
  const crop = operations.find((op): op is CropOperation => op.type === 'crop')
  if (!crop) {
    return { sx: 0, sy: 0, sw: source.width, sh: source.height }
  }
  return { sx: crop.x, sy: crop.y, sw: crop.width, sh: crop.height }
}

interface RenderOptions {
  /** Cap the longest output edge (used for a lightweight preview). */
  maxSize?: number
}

/**
 * Draws `source + operations` into `canvas`. The filter is applied identically
 * regardless of output scale, so a downscaled preview and a full-resolution
 * export are visually consistent.
 */
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  source: SourceImage,
  operations: readonly Operation[],
  options: RenderOptions = {},
): void {
  const { sx, sy, sw, sh } = getCropRect(operations, source)

  let dw = sw
  let dh = sh
  const { maxSize } = options
  if (maxSize && (sw > maxSize || sh > maxSize)) {
    const scale = Math.min(maxSize / sw, maxSize / sh)
    dw = Math.max(1, Math.round(sw * scale))
    dh = Math.max(1, Math.round(sh * scale))
  }

  canvas.width = dw
  canvas.height = dh

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.filter = buildFilterString(operations)
  ctx.drawImage(source.element, sx, sy, sw, sh, 0, 0, dw, dh)
}

/** Renders at full resolution and returns the encoded image blob. */
export function exportBlob(source: SourceImage, operations: readonly Operation[]): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderToCanvas(canvas, source, operations)

  const mime = SUPPORTED_EXPORT_MIME.has(source.type) ? source.type : 'image/png'

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to encode image'))
      },
      mime,
      0.95,
    )
  })
}
