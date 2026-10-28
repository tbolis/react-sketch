# Changelog

## 1.1.0 (unreleased)

The eraser, laser pointer and polygon tools, pinch zoom, and features that forks of react-sketch had, written again for the TypeScript code and fabric 7.

### Added

- The eraser tool (#82): `tool="eraser"`, `Tools.Eraser` and `Types.Tool.ERASER`. It erases parts of the
  objects (lines, shapes, images, text) with the width of `lineWidth`, and its cursor is a circle of the
  size of the brush (the crosshair for a brush over 124 pixels, the most a browser shows). One stroke is
  one undo step. The erased parts are kept on the objects, so `toJSON()` saves them and `value`,
  `defaultValue` and `fromJSON()` load them. The background color and the background image are not
  erased. The brush is the code of `@erase2d/fabric` by @ShaMan123 (MIT).
- The showcase has an Eraser button in the tool selector.
- The overlay image: `setOverlayFromDataUrl()` and `removeOverlayImage()` (#73). The image is drawn above
  the objects and takes no mouse events, so it can be an outline to draw within. It is saved by
  `toJSON()`, drawn by `toDataURL()`, scaled when the canvas is resized, and removed by `clear()`. It
  takes the options of `setBackgroundFromDataUrl()`. From `addOverlayImg` of @yerffejytnac.
- The `backgroundImage` and `backgroundImageOptions` properties (#51): the background image from a
  property, set when the component mounts and when it changes. It takes the place of the background image
  of `value` and `defaultValue`. From the `backgroundImage` property of @subforce-solutions.
- The `crossOrigin` option of `addImg()`, `setBackgroundFromDataUrl()` and `setOverlayFromDataUrl()` (#33,
  #95). `addImg()` requests the image without CORS as before, unless it is given, so a canvas with a
  cross-origin image can be exported. The background and the overlay images are requested with
  `"anonymous"` as before, and `null` shows an image of a server without CORS headers, at the cost of a
  tainted canvas. From `react-sketch2` of @x5engine.
- The showcase has an Overlay section (a sample outline, an image of your own, remove), a
  `backgroundImage` tab that uses the property, and a CORS switch for "Load Image from URL". The fit
  switches of the Background section also apply to the background image that is already set.
- The laser pointer tool: `tool="laser-pointer"`, `Tools.LaserPointer` and `Types.Tool.LASER_POINTER`. A
  line follows the pointer, gets thinner towards its start and disappears about a second after it was drawn,
  with the color and the weight of the line (`lineColor`, `lineWidth`) and a glow. It is only drawn on the
  top canvas of fabric, so it is not an object of the sketch: it is not in `toJSON()` or `toDataURL()`, it
  is not an undo step, and neither `onObjectAdded` nor `onChange` is called for it. Another tool clears what
  is left of the line.
- The showcase has a Laser pointer button in the tool selector. The laser pointer keeps its own line color
  and weight (red, 8px to start with), apart from the other tools.
- The polygon tool (#96): `tool="polygon"`, `Tools.Polygon` and `Types.Tool.POLYGON`. Each click or tap
  places a vertex, where the pointer is released, and a line follows the pointer from the last one (on
  touch, while the finger is down). The polygon is closed by a click or tap on the first vertex (within 10
  pixels, 20 on touch), by a double click or double tap, or by the Enter key, and the Escape key cancels
  it. It needs three vertices. It takes `lineColor`, `lineWidth` and `fillColor` as the rectangle does. The
  polygon in progress is only drawn on the top canvas: when it is closed it is one `fabric.Polygon` and one
  undo step, `onObjectAdded` is called once with it, and `onChange` is called once, not for each vertex. Its
  vertices are in `points` of the object. Switching to another tool keeps a polygon with three vertices and
  drops one with fewer, and `zoom()` and the resize of the canvas scale the polygon in progress with the
  objects.
- The showcase has a Polygon button in the tool selector, with a hint of how to close the polygon.
- The `lineStyle` property and the `Types.LineStyle` type: `"solid"` (the default), `"dashed"`, `"dotted"` or
  `"dash-dot"`, with the dashes and the dots following `lineWidth`. The pencil, line, arrow (its shaft),
  rectangle, rectangle label, circle and polygon draw it, and the polygon in progress is shown in it. A
  change is for the next drawing. It is saved by `toJSON()` and loaded by `fromJSON()` with the object.
  The highlighter, the eraser and the laser pointer do not draw it.
- The showcase has the line styles in the Line section.
- Pinch zoom (#84): two fingers on the canvas zoom and pan its view, about the point between the fingers. The
  `pinchZoom` (default `true`), `minZoom` (0.5) and `maxZoom` (8) properties, the `onViewChange` callback and
  the `resetView()` method. The view is the viewport of the canvas, the objects stay where they are: it is not
  in `toJSON()`, not an undo step, and `onChange` is not called for it. The canvas cannot be taken out of sight.
  When the second finger comes, what the first one started (a line, a shape, a free stroke, the eraser, a vertex
  of a polygon) is dropped and leaves no object nor undo step, so a polygon in progress is not disturbed.

### Changed

- Each tool starts from the default cursor of free drawing (the crosshair), so the cursor of the pencil or
  of the eraser is not kept by the highlighter.
- `toDataURL()` draws the whole drawing, whatever the zoom and pan of the view of the canvas (pinch zoom, and
  the pan tool, which moved what the image showed).
- `clear()` also removes the overlay image.
- When several images are asked for the overlay (or the background), only the last request is set.

### Fixed

- The arrow tool: an arrow which is drawn is not selectable, as the other shapes are. A press on an earlier
  arrow selected it and a drag moved it, instead of drawing the new arrow, so an arrow could not be drawn
  over or across another one.
- The arrow tool: an arrow is one undo step, and `onObjectAdded` is called once with it, and
  `onObjectRemoved` is not called. The line and the head which are shown while the arrow is drawn were
  recorded and announced too, so an arrow took three undos, and `onObjectAdded` was called three times.

### Packaging and tooling

- The code of `@erase2d/fabric` 1.2.2 is in the private package `packages/eraser`
  (`@react-sketch/eraser`), with its license, and `react-sketch` bundles it. Nothing new is installed for
  the users of the library, and the externals of the bundle are still `react` and `fabric`. The license is
  in `dist/index.js.LICENSE.txt`. `yarn typecheck`, `yarn build` and `yarn test` build the package first.
- The laser pointer brush is in the private package `packages/laserpointer` (`@react-sketch/laserpointer`),
  which `react-sketch` bundles too. `yarn build:packages` builds both private packages, and
  `yarn typecheck`, `yarn build` and `yarn test` run it first.
- CI also runs on Node.js 26, with 22 and 24 (`engines` already allowed it).

## 1.0.1 (unreleased)

### Fixed

- A value which cannot be loaded (`value`, `defaultValue`, `fromJSON()`) no longer breaks the canvas. Its
  undo history is kept, and the canvas draws the objects added afterwards again: fabric turned that off
  while it loaded and on again only when the load worked. The error is not hidden: it is thrown as an
  uncaught error, as it was.
- A value which loads slowly (an image) can no longer replace a newer value which loaded faster. A newer
  value cancels the load of the older one.
- Server rendering no longer warns about a mismatch when the page hydrates: the canvas element has no random
  `id` any more, which nothing used.
- The background image follows the canvas when it is resized, and `zoom()` scales it too, so the drawing stays
  on it. Before, the resize changed its width and height, which does not stretch an image.
- The README and the CHANGELOG say what loading a value does to the undo history: it starts again with the
  loaded objects, so each of them can be undone, as in 0.5.x.

### Removed

- The unused helpers `pointerPosition` and `uuid4`. They were not exported by the package.

### Packaging and tooling

- CI also runs the tests on React 18 (`REACT=18 yarn test`; React 18 is installed as `react-18` and
  `react-dom-18` for it), as the peer range says React 17 to 19. React 17 is not tested, Testing Library 16
  does not support it.
- The showcase loads no font or script from another site, it uses the system font, and it tells the user when
  the canvas cannot be exported because an image of another site does not allow it (CORS).

## 1.0.0 (2026-10-23)

Rewrite in TypeScript. The component API of 0.5.x is kept (properties, methods, the named exports
`SketchField` and `Tools`, and the default export). The differences in behavior are listed below.

### Packaging and tooling

- The repository is a Yarn 1 workspaces monorepo: `packages/react-sketch` (the library) and
  `packages/showcase` (the demo application, private). The legacy JavaScript sources in `src/`, the
  `examples/` folder and the `webpack/` configurations of 0.5.x are removed.
- The library is written in TypeScript and ships its type declarations (`dist/index.d.ts`, #94). The
  hand-written `types/index.d.ts` of 0.5.x is removed.
- React 17, 18 and 19 are supported. `react` is a peer dependency (`^17.0.0 || ^18.0.0 || ^19.0.0`).
  `react-dom` and `prop-types` are no longer dependencies of the library.
- fabric 7.4 (`fabric` `^7.4.0`) is a dependency of the library. 0.5.x bundled fabric into the build
  (fabric 3.5 at 0.5.6), now it is installed next to the library and is external in the bundle. fabric
  7.4 fixes the stored XSS advisories of fabric versions before 7.2 and 7.4 that have no patch in fabric
  4 to 6. fabric types are not part of the public declarations of the package.
- Developing requires Node.js 22.22.1 or later (`engines` in the root `package.json`, `.nvmrc` has 24). The
  package itself has no Node.js requirement. The `node >= 8` engine of 0.5.x and the Node.js 6, 7 and 8
  notes are removed.
- New build output in `packages/react-sketch/dist`: `index.js`, a UMD bundle (global `ReactSketch`)
  with `react`, `react/jsx-runtime` and `fabric` as externals, with a source map, and `index.d.ts`.
  Built with webpack 5, ts-loader and `tsc`. `main`, `types` and `files` of the package point to it.
- The showcase replaces `examples/`: React 19, `@mui/material` 9 and MobX 7, with a tools panel, an
  actions toolbar and the scenarios `defaultValue`, `value` with `forceValue`, and `addImg`. It runs
  with `yarn start` on port 23000 and uses the sources of the library, no build needed first (#163).
  Text is added in the line color (#78).
- Toolchain: TypeScript 6, ESLint 10 (flat config) with typescript-eslint and @eslint-react, Prettier 3, Jest 30 with
  ts-jest and Testing Library (replacing karma, enzyme and the Jest 23 setup of 0.5.x), husky 9 with
  lint-staged. GitHub Actions (`.github/workflows/ci.yml`, Node.js 22 and 24) replaces Travis CI.
- Documentation: README rewritten (#108), with every property, method and callback (#120, #130),
  examples of saving and loading drawings (#158, #165), of images, text and export (#71, #155), and the
  note that the JSON includes the added images and the background image (#58). Code of conduct updated to
  Contributor Covenant 2.1, README files added for the package and the showcase.

### Removed

- Support for Internet Explorer 11: the `Object.assign` polyfill (`src/polyfill.js`) is not ported and
  the pointer helpers no longer have IE specific code.

### Exports

- Named exports: `SketchField`, `Tools` and `Types`. The default export is the component, which also
  carries `SketchField` and `Tools`, so `import Sketch from "react-sketch"` with `<Sketch />`,
  `Sketch.SketchField` and `Sketch.Tools.Pencil` work as in 0.5.x.
- `Tools` has the keys and values of 0.5.x: `Select`, `Pencil`, `Line`, `Arrow` (#166), `Rectangle`,
  `RectangleLabel`, `Circle`, `Pan`, `DefaultTool` and `Highlighter`.
- `Types` is new: the `Tool` enumeration (the values of `Tools`, including `"rectangle-label"` and
  `"default-tool"`), `Tools`, and the types `SketchProperties`, `SketchEvent`, `SketchObject`,
  `SketchValue`, `SketchData`, `DataUrlOptions`, `ImageOptions`, `BackgroundOptions` and `TextOptions`.

### Added

- The `autoresize` property (default `true`). It switches the resize of the canvas on window resize on
  and off. In 0.5.x the canvas always followed the window.
- The `Types` namespace, see Exports.
- The `removeBackgroundImage()` method. In 0.5.x the background image set with `setBackgroundFromDataUrl`
  could only be removed with `clear()`, which also removes the objects. When several background images
  are asked for, or one is removed while it is loading, only the last request is set.

### Changed

- The default `tool` is `"select"`. In the published 0.5.1 it was `"pencil"`, so a click started a stroke
  and objects present at start could not be selected or dragged (#100). In the unreleased 0.5.2 to 0.5.6
  it was `null`, which meant no tool: objects could be moved and nothing was drawn. `null` is still
  accepted and is treated as `"select"`. An unknown tool name selects `"pencil"`, as before (#14).
- The Highlighter tool no longer throws for a `lineColor` it cannot convert (for example `rgb(0, 0, 0)`
  or `"transparent"`): it uses the default color.
- `imageFormat` is the default format of `toDataURL`, used when the options of the call have no `format`
  (it was not used in 0.5.x, #39).
- `fromJSON()` starts the undo history again with the loaded objects and applies the tool configuration to
  them, so for example they cannot be selected while a drawing tool is active.
- `toJSON()` is typed as an object. The declaration file of 0.5.x said string, the value was always an
  object.
- Every tool falls back to line width 1, color black and fill `"transparent"` when the properties are
  not set.
- Because of fabric 7, the JSON returned by `toJSON()` and `clear()` has the fabric 7 format: the
  `type` of each object is PascalCase (`"Rect"`, `"IText"`), there is a `version` field, and numbers are
  rounded to 4 decimals. JSON saved by 0.5.x still loads with `fromJSON()`, `value` and `defaultValue`
  (the showcase sample data is JSON saved by 0.5.x). JSON saved by 1.0.0 does not load in 0.5.x. The
  `type` of live objects, as seen in the event callbacks, is unchanged, except `ActiveSelection`, which
  is now `activeselection`.
- Undoing a modification restores the values to a precision of 1e-4.
- The Pencil and Highlighter paths have a center origin, so their `left` and `top` are the center of the
  path. They are drawn the same, and a stroke now includes its last point.
- `addImg()` with a URL that cannot be loaded adds nothing and does not call `onObjectAdded`. In 0.5.x it
  added an empty image object.
- Objects added by `copy()`, `paste()`, and by loading a value appear a few microtasks after the call or
  the 100 ms timer. Tests that use fake timers need to flush promises.

### Fixed

- The package no longer requires `jsdom` at runtime. The 0.5.1 bundle did, and through it `fs`,
  `acorn`, `parse5`, `whatwg-url` and `tough-cookie`, which broke builds and production bundles with
  errors such as `Can't resolve 'jsdom'` and `Cannot find module 'fs'` (#56, #61, #66, #88, #118, #119,
  #129, #172).
- `lineColor`, `lineWidth` and `fillColor` changes apply right away. In 0.5.x they were applied only
  after the tool changed (#114).
- `backgroundColor` is applied when the component mounts and when the property changes (#87).
- Undo, then modify an object, then undo again, restores the right state.
- Redo of `removeSelected()` removes the objects again.
- `removeSelected()` leaves the selection first, so the objects keep their own position.
- `copy()` without a selection and `paste()` without a copied object do nothing.
- `addText()` uses the `left` and `top` options when they are given. The text is centered otherwise.
- `clear()` and `fromJSON()` keep the `backgroundColor` property (clearing a canvas dropped the background).
- The canvas is not resized when its container has no size (hidden, or no layout), which collapsed the
  objects.
- Unmounting clears the pending timers (`fromJSON`, `onChange`) and disposes the canvas, so no callback
  runs on a disposed canvas.
- `undo()` does nothing when there is nothing to undo. In 0.5.x it threw an error.
- `enableTouchScroll()` and `disableTouchScroll()` also set the `touch-action` style of the canvas, as
  fabric reads the flag only when it creates the canvas. In 0.5.x the flag changed and the browser
  kept blocking the scroll.
- The Rectangle and RectangleLabel tools follow the pointer when dragging in every direction.
- The Arrow tool no longer adds the previous arrow again on a mouse up that follows a finished arrow.
- The Pencil tool uses the default cursor, not the crosshair of fabric (#181).
- `setBackgroundFromDataUrl()` with `stretched`, or with `stretchedX` and `stretchedY` together, fills the
  canvas on both axes. They kept the proportions of the image, so the height fit undid the width fit
  (#173).
- Three wrong entries of the color name table used by the Highlighter are corrected.

### Known limitations

These behaviors of 0.5.x are kept.

- `opacity` is accepted and not applied. It had no effect in 0.5.x either.
- `onChange` is called 10 ms after every mouse up and mouse out, whether or not the drawing changed
  (#80). It is also called after `undo()`, `redo()` and when a value is loaded.
- `undoSteps` keeps one step more than its value: `undoSteps + 1` actions can be undone. It is read when
  the component mounts.
- Drawing an arrow records undo steps that have no visible effect.
- Undoing the move of a line puts the line at 0,0, and redo leaves it there. Undoing the move of the
  rectangle of a RectangleLabel restores a width and a height of 0. Both happen in 0.5.x too.
- `forceValue` loads `value` on every update of the component, so a parent that re-renders often loads
  it often.
- Calling a method of the component before it is mounted throws.

## 0.5.x

The `0.5.2` to `0.5.6` versions were set in `package.json` on the master branch and have no git tags.
They are not on npm under the name `react-sketch`, whose latest version is 0.5.1. From December 2019 to
November 2020 the package name in `package.json` was `@tarik.djurdjevic/react-sketch`, it is
`react-sketch` again since 2020-11-14.

- **0.5.2 to 0.5.6** (January 2019 to April 2021, unreleased)
  - New features
    - TypeScript declarations (`types/index.d.ts`), with the `Tools` types (thanks @karlvr)
    - `hasSelection()` and `clearSelection()` (thanks @karlvr)
    - `setBackgroundFromDataUrl` options `stretched`, `stretchedX` and `stretchedY`, and a fix for the
      stretching of the background image (thanks @maxaggedon)
    - Arrow tool (thanks @clavierpaul)
    - Highlighter tool
    - Rectangle with label tool and default tool, which disables any change of the objects (thanks
      @tarik-djurdjevic)
    - Callbacks `onObjectAdded`, `onObjectModified`, `onObjectRemoved`, `onObjectMoving`,
      `onObjectScaling`, `onObjectRotating`, `onMouseDown`, `onMouseMove`, `onMouseUp` and `onMouseOut`
    - The `tool` property accepts `null`, and it is the default
    - Images are loaded with CORS support (`crossOrigin`)
    - Polyfill for `Object.assign`, for Internet Explorer 11
  - Fixes
    - The webpack externals configuration of the library build is removed (#56)
    - The default of `widthCorrection` is 0, it was 2
  - Other
    - Upgraded to fabric 3.5
    - The tools are organized in one folder per tool, the code is formatted with Prettier
    - Code of conduct added
- **0.5.1** (2018-12-13) Fixes
  - `NODE_ENV` is set properly for the library build, react-hot-loader is no longer bundled (#49)
- **0.5.0** (2018-11-29) New features and fixes
  - New features
    - `addText` to add a text to the canvas
    - `removeSelected` to remove the selected objects
    - `copy` and `paste` of the selected objects
  - Fixes
    - `backgroundColor` when the initial value was not set
  - Other
    - Upgraded to React 16.6, fabric 2.4, webpack 4 and Babel 7, Jest for the tests

## 0.4.x

- **0.4.4** (2018-02-06) and **0.4.2** (2018-02-02) Maintenance releases
  - Upgraded libraries (#26), fix for issue #29

- **0.4.0** New Features and fixes
  - Fixes
    - Upgraded to latest packages (thanks @fjogeleit)
    - Fix for undo/redo (thanks @pomelyu)
    - Issue #9 fixed
    - Issue #10 and #15 you can no longer give dataUrl as value only as background image and/or by adding
      the image as an object
  - Breaking Changes
    - `data` and `dataType` properties have been replaced with `value` and `defaultValue` to be able to
      use the component as controlled component
    - node support of 6, 7 and 8
  - New Features
    - ability to add an image as object

## Older versions

- **0.3.0** New Features and fixes
  - HOT Deploy fixed
  - Added selection of background Color
  - Added selection of a background image
  - Fixing canUndo button
- **0.2.13** Maintenance release
  - Upgrading packages
  - performing required changes for webpack v2.x
- **0.2.7** New Functionality and bug fixes
  - Zoom In/Out functionality of drawing
  - Upgrading to latest package versions
- **0.2.6** Bug fixes and performance improvements
- **0.2.5** Upgrading to latest libraries and bug fixes
  - Major
    - React 15.1.0
    - Fabric 1.6.2
  - Bug fixes and performance improvements
  - exposing disable/enable Scroll for tablets and touch devices
- **0.2.4** Maintenance Release
- **0.2.3** Upgrading to latest libraries
  - Major
    - React 15.0.1
    - Fabric 1.6.0
  - Other
    - babel
    - react-color
    - etc.
- **0.2.2** Minor bug fixes and improvements release
- **0.2.1** Bundling fabric to the library, to avoid complexity by adding it as external dependency
- **0.2.0** Adding FabricJS as the core of the sketch field
- **0.1.1** Adding support for touch events
- **0.1.0** Initial release
