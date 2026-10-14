# showcase

Demo application for [react-sketch](../react-sketch). It is private and is not published to npm.

It shows a `SketchField` with a tools panel for the properties of the component, an actions toolbar for
its methods (undo, redo, clear, download, copy, paste, zoom), and the usage scenarios `defaultValue`,
`value` with `forceValue`, and `addImg`.

## Run

From the root of the repository:

```sh
yarn install
yarn start
```

The application is served at <http://localhost:23000>. It imports `react-sketch` from the sources of
`packages/react-sketch` (webpack alias), so the library does not have to be built first.

## Scripts

Run them from the root of the repository, or with `yarn workspace showcase <script>`.

| Script           | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `yarn start`     | Development server on port 23000 (root script).              |
| `yarn build`     | Production build to `packages/showcase/build` (root script). |
| `yarn typecheck` | Type-check the showcase (root script, runs both packages).   |

## Stack

React 19, TypeScript, MUI (`@mui/material`), MobX, webpack 5.
