/**
 * The edit model is fully non-destructive: the original image is never mutated.
 * Every edit is expressed as an `Operation`. The preview, the exported image and
 * the exported JSON are all derived from `original + Operation[]`.
 */

export type AdjustmentType = 'brightness' | 'contrast' | 'saturation' | 'greyscale' | 'sepia'

/** Crop is stored as a rectangle in the ORIGINAL image's natural pixels. */
export interface CropOperation {
  type: 'crop'
  x: number
  y: number
  width: number
  height: number
}

/**
 * Colour adjustments and filters. `value` is the exact argument passed to the
 * matching CSS/canvas filter function, so replay is a direct mapping:
 *   brightness -> brightness(value)   (neutral 1)
 *   contrast   -> contrast(value)     (neutral 1)
 *   saturation -> saturate(value)     (neutral 1)
 *   greyscale  -> grayscale(value)    (neutral 0, range 0..1)
 *   sepia      -> sepia(value)        (neutral 0, range 0..1)
 */
export interface AdjustmentOperation {
  type: AdjustmentType
  value: number
}

export type Operation = CropOperation | AdjustmentOperation

export interface SourceImage {
  /** Decoded, immutable original. Never drawn to; only read from. */
  element: HTMLImageElement
  name: string
  type: string
  width: number
  height: number
  objectUrl: string
}

/**
 * Serialisable description of the edit. Replaying `operations` on the original
 * image (in array order) reproduces the exported result.
 */
export interface EditorProject {
  version: 1
  source: {
    name: string
    type: string
    width: number
    height: number
  }
  operations: Operation[]
}

export const NEUTRAL_VALUES: Record<AdjustmentType, number> = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  greyscale: 0,
  sepia: 0,
}
