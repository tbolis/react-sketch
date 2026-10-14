# react-sketch

A sketch field component for React applications, built on [fabric.js](https://www.fabricjs.com/).
Pencil, line, arrow, rectangle, circle, highlighter, pan and select tools, images and text, undo and
redo, JSON and image export. Includes TypeScript declarations.

## Installation

```sh
yarn add react-sketch
```

or

```sh
npm install react-sketch
```

`react` (`^17.0.0 || ^18.0.0 || ^19.0.0`) is a peer dependency: install it in your application.
`fabric` is installed with `react-sketch`.

## Usage

```tsx
import { useRef } from "react";
import { SketchField, Tools } from "react-sketch";

export const Drawing = () => {
  const sketch = useRef<SketchField>(null);

  return (
    <>
      <SketchField
        ref={sketch}
        width={1024}
        height={768}
        tool={Tools.Pencil}
        lineColor="black"
        lineWidth={3}
      />
      <button onClick={() => sketch.current?.undo()}>Undo</button>
    </>
  );
};
```

Exports: `SketchField` (the component), `Tools` (`Select`, `Pencil`, `Line`, `Arrow`, `Rectangle`,
`RectangleLabel`, `Circle`, `Pan`, `DefaultTool`, `Highlighter`), `Types` (namespace with the types and
the `Tool` enumeration) and a default export, which is the component with `SketchField` and `Tools`
attached (as in 0.5.x).

## Documentation

The properties, the methods, the tools and the usage with a saved or controlled drawing are documented
in the [README of the repository](https://github.com/tbolis/react-sketch#readme). Release notes are in
the [changelog](https://github.com/tbolis/react-sketch/blob/master/CHANGELOG.md). Report problems at
<https://github.com/tbolis/react-sketch/issues>.

## License

MIT
