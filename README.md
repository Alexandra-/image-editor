# Image Editor

A small, non-destructive browser image editor built for a printing-industry style
workflow: load an image, crop it, adjust brightness / contrast / saturation with a
live preview, apply greyscale / sepia filters, reset to the original, and export both
the rendered image and a JSON description of the operations.

## Stack

- Vue 3 (`<script setup>` + Composition API)
- Vuetify 3
- Pinia
- TypeScript
- Vite
- [Cropper.js v2](https://fengyuanchen.github.io/cropperjs/) for the crop UI

## Getting started

```bash
npm i
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

Other scripts:

```bash
npm run build        # type-check (vue-tsc) + production build
npm run preview      # preview the production build
npm run lint         # ESLint (flat config)
npm run lint:fix     # ESLint with autofix
npm run format       # Prettier write
npm run format:check # Prettier check only
```

## Core idea: edits are data, not pixels

The whole editor is built around one decision:

> The original image is never mutated. Every edit is stored as an `Operation`.
> The preview, the exported image, and the exported JSON are all **derived** from
> `original + Operation[]`.

This makes non-destructive editing, "reset to original", and the bonus JSON export
three views of the same model rather than separate features.

```
preview / export / json  =  f(originalImage, operations[])
```

### The operation model

See [`src/types/operations.ts`](src/types/operations.ts).

```ts
type Operation =
  | { type: 'crop'; x: number; y: number; width: number; height: number } // natural px
  | { type: 'brightness'; value: number } // -> brightness(value), neutral 1
  | { type: 'contrast'; value: number } // -> contrast(value),   neutral 1
  | { type: 'saturation'; value: number } // -> saturate(value),   neutral 1
  | { type: 'greyscale'; value: number } // -> grayscale(value),  0..1, neutral 0
  | { type: 'sepia'; value: number } // -> sepia(value),      0..1, neutral 0
```

Rules enforced by the Pinia store ([`src/stores/editor.ts`](src/stores/editor.ts)):

- **One entry per operation type.** Adjusting a slider updates the operation in place.
- **Order = order of first application.** This is the "implicit" ordering model: the
  user chooses which operations to apply and in which order simply by using them; there
  is no separate drag-to-reorder UI.
- **Neutral removes the operation.** Returning a slider to its neutral value deletes it
  from the array, so `operations` only ever contains edits the user actually made.
- **Order matters and is preserved.** Colour operations are concatenated into a single
  CSS/canvas filter string in array order, so replaying reproduces the exact result.

### Rendering pipeline

See [`src/composables/useImageRenderer.ts`](src/composables/useImageRenderer.ts).

Rendering is done entirely on `<canvas>` for both preview and export, so the two are
pixel-consistent:

1. `getCropRect(operations)` resolves the source rectangle (full image if no crop).
2. `buildFilterString(operations)` maps colour operations to `ctx.filter`.
3. `ctx.drawImage(original, sx, sy, sw, sh, ...)` draws the cropped, filtered result.

- **Preview** renders into a downscaled canvas (capped long edge) and is throttled with
  `requestAnimationFrame`, so dragging a slider stays smooth even on large images.
- **Export** renders at full crop resolution and encodes with `canvas.toBlob`.

### Crop coordinate mapping

Cropper.js reports the selection in canvas coordinates. We convert it back to the
original image's natural pixels using the image transform matrix
(`cropperImage.$getTransform()`), so the stored crop is resolution-independent and
reproducible. See [`src/components/CropTool.vue`](src/components/CropTool.vue).

The cropper is only used to obtain coordinates; the actual crop is performed by our own
canvas pipeline together with the colour operations.

## Export

Two independent actions (as requested):

- **Download image** — renders the full-resolution result and downloads it in the
  original file's format (falls back to PNG for formats a canvas cannot encode).
- **Export operations** — downloads a JSON file describing the edit.

### JSON shape and replay

```json
{
  "version": 1,
  "source": { "name": "photo.jpg", "type": "image/jpeg", "width": 4000, "height": 3000 },
  "operations": [
    { "type": "crop", "x": 100, "y": 50, "width": 800, "height": 600 },
    { "type": "brightness", "value": 1.2 },
    { "type": "saturation", "value": 1.4 },
    { "type": "sepia", "value": 0.3 }
  ]
}
```

Replay semantics: apply `operations` to the original image in array order. `crop`
selects the source rectangle; colour operations map 1:1 to the corresponding CSS/canvas
filter function. `source` metadata is included so crop pixels can be validated against
the image they were authored for. This is exactly what the app itself does to build the
preview and the export, so the JSON is guaranteed to reproduce the rendered result.

## Bonus

Both bonus items are implemented:

- **Filters:** greyscale and sepia, each with a 0–100% intensity slider.
- **Operations JSON export:** the model above, downloaded alongside the image.

## Layout / UX notes

- App bar with the toolbar: Upload, Edit (toggles the sidebar), Reset, Download image,
  Export operations.
- `Download image` is enabled as soon as an image is loaded; `Reset` and
  `Export operations` are enabled only after at least one edit exists.
- Re-uploading while an image is loaded asks for confirmation (edits would be lost).
- Desktop-first, full-viewport-height layout; the sidebar fits within the viewport.

## Tooling notes

### Auto-imports

The Vue and Pinia composition APIs (`ref`, `computed`, `watch`, `defineStore`, ...) are
auto-imported via [`unplugin-auto-import`](https://github.com/unplugin/unplugin-auto-import),
configured in [`vite.config.ts`](vite.config.ts).

Scope is intentional:

- **Enabled only for `vue` and `pinia`.** These names are canonical and instantly
  recognisable, so removing their repetitive imports is pure signal-to-noise win.
- **Components are still imported explicitly** (no `unplugin-vue-components`). In a real
  codebase, hiding where a component comes from hurts readability more than it helps, so
  that dependency stays visible.
- Generated types live in [`auto-imports.d.ts`](auto-imports.d.ts), which is **committed
  to git** so the project type-checks and builds immediately after `npm i`, with no hidden
  generation step.

Note: Vuetify components are also auto-imported, but by `vite-plugin-vuetify` (tree-shaken
on demand), which is independent of the above.

### Linting & formatting

- **ESLint** (flat config, [`eslint.config.js`](eslint.config.js)) using the official Vue
  presets: `eslint-plugin-vue` (`flat/essential`) + `@vue/eslint-config-typescript`
  (`recommended`), with `@vue/eslint-config-prettier` last to defer all formatting to
  Prettier.
- **Prettier** ([`.prettierrc.json`](.prettierrc.json)) owns formatting (no semicolons,
  single quotes, 100-char width).
- The auto-import globals are fed to ESLint via a generated `.eslintrc-auto-import.json`
  (committed), so linting does not report `ref`/`computed` as undefined.

## Trade-offs & known limitations

- **Colour math uses the browser's CSS/canvas filters** (sRGB). This is the pragmatic,
  fast choice for an in-browser editor with standard RGB images; it does not preserve
  CMYK/ICC profiles (a canvas cannot anyway).
- **Single image at a time** and **no undo/redo / persistence** — out of scope for this
  task; the operation-array model would make undo/redo straightforward to add later.
- **Desktop only** for now. Vuetify's grid is mobile-first, so a responsive pass (e.g. a
  bottom sheet for the edit panel) is a natural next step.
- **Reorder UI:** ordering is implicit (order of application). A drag-to-reorder list
  could be layered on top of the same model without changing it.

## Project structure

```
src/
  components/
    EditorToolbar.vue     # top actions + replace-image dialog wiring
    EditSidebar.vue       # crop entry + adjustment/filter sliders
    EditorCanvas.vue      # real-time canvas preview (rAF throttled)
    CropTool.vue          # Cropper.js v2 wrapper -> natural-pixel crop rect
    ImageUploader.vue     # empty-state upload (drag & drop + file picker)
    ReplaceImageDialog.vue
  composables/
    useImageRenderer.ts   # filter string, crop rect, render, exportBlob
  stores/
    editor.ts             # source (immutable) + operations[] + getters/actions
  types/
    operations.ts         # Operation union + EditorProject JSON shape
  utils/
    download.ts           # blob/json download helpers
  plugins/
    vuetify.ts
```
