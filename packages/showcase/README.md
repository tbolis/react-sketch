# showcase

Demo application for [react-sketch](../react-sketch), live at <https://tbolis.github.io/react-sketch/>. It is private
and is not published to npm.

The canvas fills the window, and the panels float over it:

- **Toolbar** (top): select, pan, rectangle, rectangle label, circle, polygon, line, arrow, pencil, highlighter,
  eraser and laser pointer. The keys of the tools are on the buttons and in the shortcuts dialog.
- **Properties** (left): line color, fill color, line weight and line style of the tool, and copy, paste and delete
  of the selected objects.
- **Settings** (right, the gear): the **Scenario** tab (what the scenario shows and its actions), the **Canvas** tab
  (size, with a button for the original size of the background image, background color and image, pinch zoom,
  view, grid) and the **Insert** tab (text, image from a URL,
  overlay).
- **Top left**: the menu, and undo and redo, which fade out until the first change.
- **Bottom**: zoom (the percentage resets the view), and a hint for the tool in use. The **preview** is at the
  right, with the frame of the view when it is zoomed or panned.
- **Menu** (top left): save the drawing, download the PNG and the JSON, clear the canvas, the color scheme
  (light, dark, system), the keyboard shortcuts and the repository.
- **Scenarios** (top right): `Playground`, `defaultValue`, `value + forceValue`, `addImg` and `backgroundImage`.
  The saved drawings are next to it.

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

## Deployment

[`.github/workflows/pages.yml`](../../.github/workflows/pages.yml) builds the showcase and publishes
`packages/showcase/build` with GitHub Pages. It runs when the library, the `@react-sketch/*` packages or the showcase
change on `main`, and on demand (Actions > Deploy showcase to GitHub Pages > Run workflow). The build uses
relative URLs, so it works under `https://tbolis.github.io/react-sketch/`.

## Stack

React 19, TypeScript, Material UI 9.5 (`@mui/material`, CSS variables with light and dark color schemes), MobX,
webpack 5.

Components of Material UI used for the layout: `ToggleButtonGroup` (the tools, with the roving tabindex of 9.3),
`Tooltip` (also on disabled buttons, 9.4), `Menu`, `Popover`, `Drawer`, `Dialog`, `Tabs`, `Slider`, `Snackbar`,
`Badge`, `Chip` and `useMediaQuery`.

Newer components that were looked at and not used:

- **Menubar** and **Number Field**: they are in the documentation of Material UI as recipes on top of
  `@base-ui/react`, not exports of `@mui/material`. A menu of one button (`Menu`) and the `Slider` do the same job
  here without another dependency.
- **Speed Dial**: the toolbar has twelve tools, which a speed dial would hide.
