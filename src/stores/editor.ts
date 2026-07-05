import {
  NEUTRAL_VALUES,
  type AdjustmentOperation,
  type AdjustmentType,
  type CropOperation,
  type EditorProject,
  type Operation,
  type SourceImage,
} from '@/types/operations'

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = url
  })
}

export const useEditorStore = defineStore('editor', () => {
  const source = ref<SourceImage | null>(null)
  const operations = ref<Operation[]>([])
  const isEditPanelOpen = ref(false)
  const isCropping = ref(false)

  const hasImage = computed(() => source.value !== null)
  const hasEdits = computed(() => operations.value.length > 0)

  const cropOperation = computed(() =>
    operations.value.find((op): op is CropOperation => op.type === 'crop'),
  )

  async function loadImage(file: File): Promise<void> {
    const objectUrl = URL.createObjectURL(file)
    let element: HTMLImageElement
    try {
      element = await decodeImage(objectUrl)
    } catch (error) {
      URL.revokeObjectURL(objectUrl)
      throw error
    }

    if (source.value) {
      URL.revokeObjectURL(source.value.objectUrl)
    }

    source.value = {
      // markRaw prevents Vue from making the DOM element reactive (unnecessary and costly).
      element: markRaw(element),
      name: file.name,
      type: file.type || 'image/png',
      width: element.naturalWidth,
      height: element.naturalHeight,
      objectUrl,
    }
    operations.value = []
    isCropping.value = false
  }

  /** Current value of an adjustment, or its neutral value when not applied. */
  function getAdjustment(type: AdjustmentType): number {
    const op = operations.value.find((item): item is AdjustmentOperation => item.type === type)
    return op?.value ?? NEUTRAL_VALUES[type]
  }

  /**
   * Upserts an adjustment. Setting the neutral value removes it from the pipeline,
   * so `operations` only ever contains edits the user actually made. Order in the
   * array is the order operations were first applied (updates keep their position).
   */
  function setAdjustment(type: AdjustmentType, value: number): void {
    const index = operations.value.findIndex((op) => op.type === type)

    if (Math.abs(value - NEUTRAL_VALUES[type]) < 0.001) {
      if (index !== -1) operations.value.splice(index, 1)
      return
    }

    if (index !== -1) {
      operations.value[index] = { type, value }
    } else {
      operations.value.push({ type, value })
    }
  }

  function setCrop(rect: { x: number; y: number; width: number; height: number }): void {
    const op: CropOperation = { type: 'crop', ...rect }
    const index = operations.value.findIndex((item) => item.type === 'crop')
    if (index !== -1) {
      operations.value[index] = op
    } else {
      operations.value.push(op)
    }
  }

  function removeCrop(): void {
    const index = operations.value.findIndex((op) => op.type === 'crop')
    if (index !== -1) operations.value.splice(index, 1)
  }

  function reset(): void {
    operations.value = []
    isCropping.value = false
  }

  function toggleEditPanel(): void {
    isEditPanelOpen.value = !isEditPanelOpen.value
    if (!isEditPanelOpen.value) isCropping.value = false
  }

  /** Used by the navigation drawer's v-model to close cleanly (resets isCropping). */
  function setEditPanelOpen(value: boolean): void {
    isEditPanelOpen.value = value
    if (!value) isCropping.value = false
  }

  function startCrop(): void {
    isCropping.value = true
  }

  function cancelCrop(): void {
    isCropping.value = false
  }

  function toProject(): EditorProject {
    if (!source.value) throw new Error('toProject() called without a loaded image')
    return {
      version: 1,
      source: {
        name: source.value.name,
        type: source.value.type,
        width: source.value.width,
        height: source.value.height,
      },
      operations: operations.value.map((op) => ({ ...op })),
    }
  }

  return {
    // Readonly computed prevents direct assignment from components; mutations go through actions.
    source: computed(() => source.value),
    operations: readonly(operations),
    // Readonly computed refs prevent direct assignment from components.
    isEditPanelOpen: computed(() => isEditPanelOpen.value),
    isCropping: computed(() => isCropping.value),
    hasImage,
    hasEdits,
    cropOperation,
    loadImage,
    getAdjustment,
    setAdjustment,
    setCrop,
    removeCrop,
    reset,
    toggleEditPanel,
    setEditPanelOpen,
    startCrop,
    cancelCrop,
    toProject,
  }
})
