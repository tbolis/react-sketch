# @react-sketch/laserpointer

The laser pointer brush of react-sketch: a line that follows the pointer, fades out after a moment and
disappears, as the laser pointer of a whiteboard does.

The line is drawn on the top canvas of fabric (`canvas.contextTop`) and never added to the canvas, so it
is not an object of the drawing: it is not in `toJSON()`, not in `toDataURL()` and not in the undo
history.

The package is private. `react-sketch` bundles it, so nothing is installed for it by the users of the
library.

```ts
import { LaserBrush } from "@react-sketch/laserpointer";

const brush = new LaserBrush(canvas);
brush.color = "red";
brush.width = 6;
brush.duration = 1000; // milliseconds a part of the line takes to fade out
canvas.freeDrawingBrush = brush;
canvas.isDrawingMode = true;
```

The line is thickest at the pointer and gets thinner towards its start, until it is gone. Set `shadow`
(a `fabric.Shadow`, as for any brush) to make it glow. Call `dispose()` when the brush is not used any
more: it stops the animation and clears what is left of the line.
