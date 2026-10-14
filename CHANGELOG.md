# Changelog

## 1.0.0 (unreleased)

Rewrite in TypeScript. The component API of 0.5.x is kept (properties, methods, the named exports
`SketchField` and `Tools`, and the default export). The differences in behavior are listed below.

### Packaging and tooling

- The repository is a Yarn 1 workspaces monorepo: `packages/react-sketch` (the library) and
  `packages/showcase` (the demo application, private). The legacy JavaScript sources in `src/`, the
  `examples/` folder and the `webpack/` configurations of 0.5.x are removed.
- The library is written in TypeScript and ships its type declarations (`dist/index.d.ts`). The
  hand-written `types/index.d.ts` of 0.5.x is removed.
- React 17, 18 and 19 are supported. `react` is a peer dependency (`^17.0.0 || ^18.0.0 || ^19.0.0`).
  `react-dom` and `prop-types` are no longer dependencies of the library.
- fabric 7.4 (`fabric` `^7.4.0`) is a dependency of the library. 0.5.x bundled fabric into the build
  (fabric 3.5 at 0.5.6), now it is installed next to the library and is external in the bundle. fabric
  7.4 fixes the stored XSS advisories of fabric versions before 7.2 and 7.4 that have no patch in fabric
  4 to 6. fabric types are not part of the public declarations of the package.
- Developing requires Node.js 22 or later (`engines` in the root `package.json`, `.nvmrc` has 24). The
  package itself has no Node.js requirement. The `node >= 8` engine of 0.5.x and the Node.js 6, 7 and 8
  notes are removed.
- New build output in `packages/react-sketch/dist`: `index.js`, a UMD bundle (global `ReactSketch`)
  with `react`, `react/jsx-runtime` and `fabric` as externals, with a source map, and `index.d.ts`.
  Built with webpack 5, ts-loader and `tsc`. `main`, `types` and `files` of the package point to it.
- The showcase replaces `examples/`: React 19, `@mui/material` 9 and MobX 7, with a tools panel, an
  actions toolbar and the scenarios `defaultValue`, `value` with `forceValue`, and `addImg`. It runs
  with `yarn start` on port 23000 and uses the sources of the library, no build needed first.
- Toolchain: TypeScript 6, ESLint 9 (flat config) with typescript-eslint, Prettier 3, Jest 30 with
  ts-jest and Testing Library (replacing karma, enzyme and the Jest 23 setup of 0.5.x), husky 9 with
  lint-staged. GitHub Actions (`.github/workflows/ci.yml`, Node.js 22 and 24) replaces Travis CI.
- Documentation: README rewritten, code of conduct updated to Contributor Covenant 2.1, README files
  added for the package and the showcase.

### Removed

- Support for Internet Explorer 11: the `Object.assign` polyfill (`src/polyfill.js`) is not ported and
  the pointer helpers no longer have IE specific code.

### Exports

- Named exports: `SketchField`, `Tools` and `Types`. The default export is the component, which also
  carries `SketchField` and `Tools`, so `import Sketch from "react-sketch"` with `<Sketch />`,
  `Sketch.SketchField` and `Sketch.Tools.Pencil` work as in 0.5.x.
- `Tools` has the keys and values of 0.5.x: `Select`, `Pencil`, `Line`, `Arrow`, `Rectangle`,
  `RectangleLabel`, `Circle`, `Pan`, `DefaultTool` and `Highlighter`.
- `Types` is new: the `Tool` enumeration (the values of `Tools`, including `"rectangle-label"` and
  `"default-tool"`), `Tools`, and the types `SketchProperties`, `SketchEvent`, `SketchObject`,
  `SketchValue`, `SketchData`, `DataUrlOptions`, `ImageOptions`, `BackgroundOptions` and `TextOptions`.

### Added

- The `autoresize` property (default `true`). It switches the resize of the canvas on window resize on
  and off. In 0.5.x the canvas always followed the window.
- The `Types` namespace, see Exports.

### Changed

- The default `tool` is `"select"`. In 0.5.x it was `null`, which meant no tool: objects could be moved
  and nothing was drawn. `null` is still accepted and is treated as `"select"`. An unknown tool name
  selects `"pencil"`, as before.
- The Highlighter tool no longer throws for a `lineColor` it cannot convert (for example `rgb(0, 0, 0)`
  or `"transparent"`): it uses the default color.
- `imageFormat` is the default format of `toDataURL`, used when the options of the call have no `format`
  (it was not used in 0.5.x).
- `fromJSON()` resets the undo history and applies the tool configuration to the loaded objects again, so
  for example they cannot be selected while a drawing tool is active.
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

- `lineColor`, `lineWidth` and `fillColor` changes apply right away. In 0.5.x they were applied only
  after the tool changed.
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
- The Rectangle and RectangleLabel tools follow the pointer when dragging in every direction.
- The Arrow tool no longer adds the previous arrow again on a mouse up that follows a finished arrow.
- The Pencil tool uses the default cursor, not the crosshair of fabric (#181).
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
