# react-sketch

[![CI][ci-image]][ci-url]
[![NPM release][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

A sketch field component for React applications, built on [fabric.js](https://www.fabricjs.com/).
Draw with a pencil, lines, arrows, rectangles and circles, select and move objects, add images and
text, undo and redo, and export the drawing as JSON or as an image. The package includes TypeScript
declarations.

## Installation

```sh
yarn add react-sketch
```

or

```sh
npm install react-sketch
```

`react` (`^17.0.0 || ^18.0.0 || ^19.0.0`) is a peer dependency: install it in your application.
`fabric` is a dependency of `react-sketch` and is installed with it.

## Usage

`SketchField` is a class component. The methods of the component (`undo`, `toJSON`, ...) are available
through a `ref`, from the moment the component is mounted until it is unmounted.

### TypeScript

```tsx
import { useRef, useState } from "react";
import { SketchField, Tools } from "react-sketch";

export const Drawing = () => {
  const sketch = useRef<SketchField>(null);
  const [canUndo, setCanUndo] = useState(false);

  return (
    <>
      <SketchField
        ref={sketch}
        width={1024}
        height={768}
        tool={Tools.Pencil}
        lineColor="black"
        lineWidth={3}
        onChange={() => setCanUndo(sketch.current?.canUndo() ?? false)}
      />
      <button disabled={!canUndo} onClick={() => sketch.current?.undo()}>
        Undo
      </button>
    </>
  );
};
```

All types are available in the `Types` namespace, for example `Types.SketchProperties`,
`Types.SketchEvent` and the `Types.Tool` enumeration:

```tsx
import { SketchField, Types } from "react-sketch";

const onObjectAdded = (event: Types.SketchEvent) => {
  console.log("added a", event.target?.type);
};

export const Highlight = () => (
  <SketchField
    tool={Types.Tool.HIGHLIGHTER}
    lineColor="#ffcc00"
    onObjectAdded={onObjectAdded}
  />
);
```

### JavaScript

```jsx
import { useRef } from "react";
import { SketchField, Tools } from "react-sketch";

export const Drawing = () => {
  const sketch = useRef(null);

  return (
    <div>
      <SketchField
        ref={sketch}
        width={1024}
        height={768}
        tool={Tools.Pencil}
        lineColor="black"
        lineWidth={3}
      />
      <button onClick={() => sketch.current.clear()}>Clear</button>
    </div>
  );
};
```

The default export of 0.5.x keeps working. It is the component, which also carries `SketchField` and
`Tools`:

```jsx
import Sketch from "react-sketch";

export const Drawing = () => <Sketch tool={Sketch.Tools.Pencil} lineWidth={3} />;
```

### Initial, loaded and saved drawings

`toJSON()` returns the drawing as an object. `defaultValue` and `value` accept that object, or the same
object as a JSON string. The object has the format of fabric 7 (object types such as `"Rect"` and
`"IText"`). Drawings saved with `react-sketch` 0.5.x load as well, drawings saved with 1.0.0 do not load
in 0.5.x.

- `defaultValue` is loaded when the component mounts, unless `value` is set.
- `value` is loaded when it changes (a different object, compared by identity). Pass a new object, for
  example `{ ...saved }`, to load the same drawing again, or set `forceValue` to load `value` on every
  update of the component.
- The drawing is loaded 100 ms later, and `onChange` is called when the load is done. The undo history starts
  again with the loaded objects, so each of them can be undone, and `onObjectAdded` is called for each.
- A value which cannot be loaded (not valid JSON, or an object type which is not known) leaves the canvas and
  its undo history as they were, and the error is thrown as an uncaught error: it is not hidden. A newer value
  cancels the load of an older one which is still running, so the last value is the one shown.
- `value` is not updated while the user draws. Read the drawing with `toJSON()`. Do not store the result
  of `toJSON()` in `value` from `onChange`: loading a value calls `onChange`, so the value would be
  loaded again and again.
- Images added with `addImg` and the background image are part of the JSON, so one `value` or
  `defaultValue` holds shapes and images. Loading replaces everything, the background image included:
  add images after `onChange` reports the load.

```tsx
import { useRef, useState } from "react";
import { SketchField, Tools, Types } from "react-sketch";

export const SaveAndLoad = ({ initial }: { initial: Types.SketchValue }) => {
  const sketch = useRef<SketchField>(null);
  const [saved, setSaved] = useState<Types.SketchData>();
  const [value, setValue] = useState<Types.SketchValue>();

  return (
    <>
      <SketchField
        ref={sketch}
        tool={Tools.Pencil}
        defaultValue={initial}
        value={value}
      />
      <button onClick={() => setSaved(sketch.current?.toJSON())}>Save</button>
      <button disabled={!saved} onClick={() => setValue(saved && { ...saved })}>
        Load
      </button>
    </>
  );
};
```

### Images, text and export

```tsx
import { useRef } from "react";
import { SketchField, Tools } from "react-sketch";

export const Editor = ({ imageUrl }: { imageUrl: string }) => {
  const sketch = useRef<SketchField>(null);

  const download = () => {
    const link = document.createElement("a");
    link.href = sketch.current?.toDataURL({ format: "png", multiplier: 2 }) ?? "";
    link.download = "sketch.png";
    link.click();
  };

  return (
    <>
      <SketchField ref={sketch} tool={Tools.Select} backgroundColor="white" />
      <button onClick={() => sketch.current?.addImg(imageUrl, { scale: 0.25 })}>
        Add image
      </button>
      <button onClick={() => sketch.current?.addText("Hello", { fontSize: 24 })}>
        Add text
      </button>
      <button
        onClick={() =>
          sketch.current?.setBackgroundFromDataUrl(imageUrl, { stretched: true })
        }>
        Background
      </button>
      <button onClick={download}>Download</button>
    </>
  );
};
```

### Background and overlay images

- The background image is drawn under the objects. Set it with the `backgroundImage` property (and `backgroundImageOptions`), or with `setBackgroundFromDataUrl` and `removeBackgroundImage`. The property takes the place of the background image of a `value`.
- The overlay image is drawn above the objects, for example an outline to draw within. Set it with `setOverlayFromDataUrl` and remove it with `removeOverlayImage`. It takes no mouse events, so the objects below can still be selected, and `toJSON` and `toDataURL` include it. `clear()` removes it, and so does loading a `value` that has none.
- The background and the overlay images are requested with CORS (`crossOrigin: "anonymous"`), so the canvas can be exported. A server without CORS headers cannot be used that way: pass `crossOrigin: null` to show the image anyway, knowing that a cross-origin image taints the canvas and `toDataURL` throws a SecurityError. `addImg` requests the image without CORS, as before, unless you pass `crossOrigin`.

```tsx
sketch.current?.setOverlayFromDataUrl(outlineUrl, { stretched: true });
sketch.current?.addImg(photoUrl, { crossOrigin: "anonymous" }); // the canvas can still be exported
```

## Properties

All properties are optional.

| Property                 | Type                                 | Default         | Description                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tool`                   | `Types.Tool` or `string`             | `"select"`      | The tool to use, see [Tools](#tools). `null` is treated as `"select"`, an unknown name selects `"pencil"`.                                                                                                                                                               |
| `lineColor`              | `string`                             | `"black"`       | Color of the line.                                                                                                                                                                                                                                                       |
| `lineWidth`              | `number`                             | `10`            | Width of the line.                                                                                                                                                                                                                                                       |
| `fillColor`              | `string`                             | `"transparent"` | Fill color of the shapes, where applicable (rectangle, rectangle-label, circle).                                                                                                                                                                                         |
| `backgroundColor`        | `string`                             | `"transparent"` | Background color of the sketch, in hex or rgba format.                                                                                                                                                                                                                   |
| `backgroundImage`        | `string`                             |                 | URL or data URL of the background image. It is set when the component mounts and when it changes, and removed when it is gone. It takes the place of the background image of `value` and `defaultValue`.                                                                 |
| `backgroundImageOptions` | `Types.BackgroundOptions`            |                 | Options of `backgroundImage`, those of `setBackgroundFromDataUrl`. Options written inline in a render do not load the image again when their content is the same.                                                                                                        |
| `opacity`                | `number`                             | `1.0`           | Accepted and not applied: it has no effect. It had no effect in 0.5.x either.                                                                                                                                                                                            |
| `undoSteps`              | `number`                             | `25`            | Number of undo/redo steps to keep. Read when the component mounts, a later change has no effect.                                                                                                                                                                         |
| `imageFormat`            | `string`                             |                 | Default format of `toDataURL`, `png` or `jpeg`, used when the options of the call have no `format`. Without it, `png`.                                                                                                                                                   |
| `value`                  | `object` or `string`                 |                 | Drawing to load, loaded again when it changes. See [Initial, loaded and saved drawings](#initial-loaded-and-saved-drawings).                                                                                                                                             |
| `forceValue`             | `boolean`                            | `false`         | Load `value` on every update of the component, even when it did not change.                                                                                                                                                                                              |
| `defaultValue`           | `object` or `string`                 |                 | Drawing loaded when the component mounts, unless `value` is set.                                                                                                                                                                                                         |
| `widthCorrection`        | `number`                             | `0`             | Pixels subtracted from the width of the container when the canvas is resized. Compensates a border or padding of the container.                                                                                                                                          |
| `heightCorrection`       | `number`                             | `0`             | Pixels subtracted from the height of the container when the canvas is resized.                                                                                                                                                                                           |
| `autoresize`             | `boolean`                            | `true`          | Resize the canvas, and scale its objects, when the window is resized. The canvas is always fitted to its container on mount and when `width` or `height` change.                                                                                                         |
| `width`                  | `number`                             | undefined       | Width of the sketch in pixels. When not set, the sketch takes the width of its parent element.                                                                                                                                                                           |
| `height`                 | `number`                             | `512`           | Height of the sketch in pixels.                                                                                                                                                                                                                                          |
| `className`              | `string`                             |                 | Class name of the container element of the canvas.                                                                                                                                                                                                                       |
| `style`                  | `CSS.Properties`                     |                 | Style of the container element of the canvas.                                                                                                                                                                                                                            |
| `onChange`               | `(event?: Event) => void`            |                 | Called 10 ms after every mouse up and mouse out on the canvas, whether or not the drawing changed (see [Known limitations](#known-limitations)), and after `undo`, `redo` and the load of a value. The argument is the DOM event after a mouse event, nothing otherwise. |
| `onObjectAdded`          | `(event: Types.SketchEvent) => void` | no-op           | An object was added: drawn, pasted, or loaded with a value. Not called when `undo` or `redo` add an object back.                                                                                                                                                         |
| `onObjectModified`       | `(event: Types.SketchEvent) => void` | no-op           | An object was modified by the user (moved, scaled, rotated).                                                                                                                                                                                                             |
| `onObjectRemoved`        | `(event: Types.SketchEvent) => void` | no-op           | An object was removed from the sketch.                                                                                                                                                                                                                                   |
| `onObjectMoving`         | `(event: Types.SketchEvent) => void` | no-op           | An object is being moved.                                                                                                                                                                                                                                                |
| `onObjectScaling`        | `(event: Types.SketchEvent) => void` | no-op           | An object is being scaled.                                                                                                                                                                                                                                               |
| `onObjectRotating`       | `(event: Types.SketchEvent) => void` | no-op           | An object is being rotated.                                                                                                                                                                                                                                              |
| `onMouseDown`            | `(event: Types.SketchEvent) => void` | no-op           | Mouse down on the canvas.                                                                                                                                                                                                                                                |
| `onMouseMove`            | `(event: Types.SketchEvent) => void` | no-op           | Mouse move on the canvas.                                                                                                                                                                                                                                                |
| `onMouseUp`              | `(event: Types.SketchEvent) => void` | no-op           | Mouse up on the canvas.                                                                                                                                                                                                                                                  |
| `onMouseOut`             | `(event: Types.SketchEvent) => void` | no-op           | The mouse left the canvas.                                                                                                                                                                                                                                               |

`Types.SketchEvent` is `{ e?: Event; target?: Types.SketchObject; [key: string]: unknown }`: `e` is the
DOM event, `target` is the object the event is about (object events only). `Types.SketchObject` is
`{ type?: string; [key: string]: unknown }`, for example with the type `"path"`, `"line"` or `"rect"`.

## Methods

The methods are properties of the component instance, access them through a `ref`. They are valid from
the moment the component is mounted until it is unmounted. Calling one before the component is mounted
throws.

| Method                                        | Returns            | Description                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `undo()`                                      | `void`             | Undo the last action. Does nothing when there is nothing to undo. Calls `onChange` when it undid something.                                                                                                                     |
| `redo()`                                      | `void`             | Redo the last undone action. Does nothing when there is nothing to redo. Calls `onChange` when it redid something.                                                                                                              |
| `canUndo()`                                   | `boolean`          | Whether `undo()` has something to undo.                                                                                                                                                                                         |
| `canRedo()`                                   | `boolean`          | Whether `redo()` has something to redo.                                                                                                                                                                                         |
| `toDataURL(options?)`                         | `string`           | The sketch as a data URL. Options: `format` (`"png"` or `"jpeg"`, default `imageFormat`, then `"png"`), `quality` (0 to 1, jpeg only, default 1), `multiplier` (default 1), and the crop area `left`, `top`, `width`, `height`. |
| `toJSON(propertiesToInclude?)`                | `Types.SketchData` | The sketch as an object. `propertiesToInclude` lists additional properties of the objects to include.                                                                                                                           |
| `fromJSON(json?)`                             | `void`             | Load a drawing (object or JSON string). Loads after 100 ms, starts the undo history again with the loaded objects, applies the tool configuration again and calls `onChange`. Does nothing for an empty argument.               |
| `clear(propertiesToInclude?)`                 | `Types.SketchData` | Remove all objects, the background image and the overlay image, and reset the undo history. Returns the discarded content as JSON. The `backgroundColor` property is kept.                                                      |
| `addImg(dataUrl, options?)`                   | `void`             | Add an image, given as URL or data URL, as an object. It is added when it has loaded. Options: `left`, `top` (default: random position), `scale` (default `0.5`), `crossOrigin` (see Background and overlay images).            |
| `addText(text, options?)`                     | `void`             | Add an editable text. It is centered unless `left` or `top` are given. `options` are the options of a fabric text object, for example `fontSize`, `fill`.                                                                       |
| `setBackgroundFromDataUrl(dataUrl, options?)` | `void`             | Use an image as background. Options: `stretched` (fill the canvas, the proportions change), `stretchedX` (fit the width), `stretchedY` (fit the height), both are `stretched`; `crossOrigin`; the others are image options.     |
| `removeBackgroundImage()`                     | `void`             | Remove the background image, also one that is still loading. The objects, the overlay image and the `backgroundColor` are kept. Like `setBackgroundFromDataUrl`, it is not part of the undo history.                            |
| `setOverlayFromDataUrl(dataUrl, options?)`    | `void`             | Use an image as overlay, above the objects. It takes no mouse events, `toJSON` and `toDataURL` include it, and it is not part of the undo history. The options are those of `setBackgroundFromDataUrl`.                         |
| `removeOverlayImage()`                        | `void`             | Remove the overlay image, also one that is still loading. The objects, the background image and the `backgroundColor` are kept.                                                                                                 |
| `zoom(factor)`                                | `void`             | Scale the objects, the background image and the overlay image by a factor: 2 doubles their size, 0.5 halves it.                                                                                                                 |
| `hasSelection()`                              | `boolean`          | Whether an object is selected.                                                                                                                                                                                                  |
| `clearSelection()`                            | `void`             | Deselect the selected object or objects.                                                                                                                                                                                        |
| `removeSelected()`                            | `void`             | Remove the selected object or objects. It can be undone.                                                                                                                                                                        |
| `copy()`                                      | `void`             | Copy the selected object. Does nothing without a selection.                                                                                                                                                                     |
| `paste()`                                     | `void`             | Paste the copied object, 10 pixels further down and to the right of the previous one. Does nothing when nothing was copied.                                                                                                     |
| `enableTouchScroll()`                         | `void`             | Allow the page to scroll on touch devices when touching the canvas.                                                                                                                                                             |
| `disableTouchScroll()`                        | `void`             | Do not scroll the page when touching the canvas.                                                                                                                                                                                |

## Tools

Use the tools by name (`"pencil"`), with `Tools` (`Tools.Pencil`) or with the enumeration
`Types.Tool` (`Types.Tool.PENCIL`).

| Tool            | `Tools`                | Value             | Description                                                                                                                                                                              |
| --------------- | ---------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select          | `Tools.Select`         | `select`          | Disables drawing. Objects can be selected, moved, scaled and rotated.                                                                                                                    |
| Pencil          | `Tools.Pencil`         | `pencil`          | Free drawing.                                                                                                                                                                            |
| Line            | `Tools.Line`           | `line`            | Straight lines.                                                                                                                                                                          |
| Arrow           | `Tools.Arrow`          | `arrow`           | Lines with an arrow head.                                                                                                                                                                |
| Rectangle       | `Tools.Rectangle`      | `rectangle`       | Rectangles, filled with `fillColor`.                                                                                                                                                     |
| Rectangle label | `Tools.RectangleLabel` | `rectangle-label` | Rectangles with a text box above them. The text box follows the rectangle when it is moved or scaled.                                                                                    |
| Circle          | `Tools.Circle`         | `circle`          | Circles, filled with `fillColor`. The drag from the first to the second point is the diameter.                                                                                           |
| Pan             | `Tools.Pan`            | `pan`             | Disables drawing. Dragging moves the whole canvas, useful after zooming (contributed by [wmaillard](https://github.com/wmaillard)).                                                      |
| Highlighter     | `Tools.Highlighter`    | `highlighter`     | Free drawing in a semi-transparent color. `lineColor` must be a hex code or a color name; any other value falls back to the default color.                                               |
| Eraser          | `Tools.Eraser`         | `eraser`          | Erases parts of the objects, with the width of `lineWidth`. The cursor shows the size of the brush. The background color and the background image are not erased. See [Eraser](#eraser). |
| Default tool    | `Tools.DefaultTool`    | `default-tool`    | Disables drawing and selection. Use it to show a drawing that is not edited.                                                                                                             |

### Eraser

The eraser cuts the strokes it draws out of the objects it crosses: a line, a shape, an image or a text.
A stroke is one undo step. The erased parts are kept on the objects, so `toJSON()` saves them and `value`,
`defaultValue` and `fromJSON()` load them. An object is only cut where the eraser crosses it, the rest of
the sketch stays, and the background color and the background image are not erased.

## Exports

| Export         | Description                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SketchField`  | The component (named export). Also usable as a type, for the `ref`.                                                                                                                                          |
| `Tools`        | The tools by name: `Select`, `Pencil`, `Line`, `Arrow`, `Rectangle`, `RectangleLabel`, `Circle`, `Pan`, `DefaultTool`, `Highlighter`, `Eraser`.                                                              |
| `Types`        | Namespace of the types: `Tool` (enumeration), `Tools`, `SketchProperties`, `SketchEvent`, `SketchObject`, `SketchValue`, `SketchData`, `DataUrlOptions`, `ImageOptions`, `BackgroundOptions`, `TextOptions`. |
| default export | The component, which also carries `SketchField` and `Tools` (as in 0.5.x).                                                                                                                                   |

## Known limitations

- `opacity` is accepted and not applied.
- `onChange` is called after every mouse up and mouse out, whether or not the drawing changed (issue [#80](https://github.com/tbolis/react-sketch/issues/80)).
- `undoSteps` keeps one step more than its value: `undoSteps + 1` actions can be undone.
- Drawing an arrow records undo steps which have no visible effect.
- With `forceValue`, every update of the component (for example each re-render of the parent with new properties) loads `value` again.

## Support

- React: `^17.0.0 || ^18.0.0 || ^19.0.0` (peer dependency). The test suite runs on React 19.
- Browsers: browsers with HTML5 canvas support. No polyfills are included and Internet Explorer 11 is not supported.
- Server-side rendering has not been tested. Render the component in the browser only.
- Node.js: the package has no runtime requirement for Node.js. Developing in this repository requires Node.js 22.22.1 or later (`.nvmrc` has 24) and Yarn 1.

## Repository layout

This is a Yarn 1 workspaces monorepo.

| Path                    | Description                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/react-sketch` | The library, published to npm as `react-sketch`. The build output is `dist/index.js` (UMD bundle, `react` and `fabric` are external) and `dist/index.d.ts` (type declarations). |
| `packages/showcase`     | Demo application (not published): a tools panel and the `defaultValue`, `value` and `addImg` scenarios.                                                                         |
| `.github/workflows`     | Continuous integration ([ci.yml](.github/workflows/ci.yml)).                                                                                                                    |

## Development

Requirements: Node.js 22.22.1 or later, Yarn 1.

```sh
git clone https://github.com/tbolis/react-sketch.git
cd react-sketch
yarn install
yarn start
```

`yarn start` serves the showcase at <http://localhost:23000>. It uses the sources of the library, so the
library does not have to be built first.

| Command          | Description                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `yarn start`     | Serve the showcase on port 23000.                                                                   |
| `yarn build`     | Build the library (`packages/react-sketch/dist`) and the showcase (`packages/showcase/build`).      |
| `yarn test`      | Run the tests of the library (Jest). `yarn test:watch` and `yarn test:coverage` are also available. |
| `yarn typecheck` | Type-check both packages.                                                                           |
| `yarn lint`      | Lint the TypeScript sources with ESLint. `yarn lint:fix` fixes what it can.                         |
| `yarn format`    | Format the repository with Prettier. `yarn format:check` only checks.                               |
| `yarn clean`     | Remove the build output.                                                                            |

The tests run on React 19. `REACT=18 yarn test` runs them on React 18, and CI does both.

## Upgrading from 0.5.x

1.0.0 is a rewrite in TypeScript which keeps the component API of 0.5.x: the properties, the methods,
the named exports `SketchField` and `Tools`, and the default export. It requires React 17 or later and
does not support Internet Explorer 11. A few behaviors differ deliberately and several bugs are fixed,
the [changelog](CHANGELOG.md) lists them.

## Release notes

See [CHANGELOG.md](CHANGELOG.md).

## Contributing

Issues and pull requests are welcome at <https://github.com/tbolis/react-sketch/issues>. Before opening a
pull request run `yarn lint`, `yarn typecheck`, `yarn test` and `yarn format:check`. A pre-commit hook
(husky and lint-staged) runs ESLint and Prettier on the staged files. Participation in this project is
subject to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT. See [LICENSE](LICENSE).

[ci-image]: https://github.com/tbolis/react-sketch/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/tbolis/react-sketch/actions/workflows/ci.yml
[npm-image]: https://img.shields.io/npm/v/react-sketch.svg
[npm-url]: https://www.npmjs.com/package/react-sketch
[downloads-image]: https://img.shields.io/npm/dm/react-sketch.svg
[downloads-url]: https://www.npmjs.com/package/react-sketch
