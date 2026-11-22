# @react-sketch/bucket

The bucket fill of react-sketch: it finds the area which is closed around a point of a canvas, by what is
drawn on it, and makes the fill of that area.

The package is private. `react-sketch` bundles it, so nothing is installed for it by the users of the
library. It needs `fabric` 7.4 or later.

```ts
import { bucketFill } from "@react-sketch/bucket";

const filled = bucketFill(canvas, canvas.getViewportPoint(event), {
  color: "#2f9e44",
});
if (filled) canvas.insertAt(filled.index, filled.fill);
```

`bucketFill(canvas, point, options)` returns the fill and where it goes among the objects of the canvas, or
`null` when there is nothing to fill. It does not change the canvas: the caller adds the fill, so that it is an
action of its own (the tool of `react-sketch` does it, and the history of the sketch records it).

- `point` is a pixel of the canvas as it is seen, with the zoom and the position of its view
  (`canvas.getViewportPoint(event)`).
- The options are `color` (any color the canvas knows, and not a transparent one), `tolerance` (how different
  a pixel can be from the one pressed, 0 to 255, 32 by default), `overlap` (how many pixels the fill goes under
  the lines around it, 1 by default) and `simplify` (how far, in pixels, the outline of the fill can be from
  the pixels it is taken from, 0.5 by default).

## How it works

1. The objects of the canvas are drawn on a canvas of their own, one pixel for each pixel of the canvas (not of
   the screen). The background color and the background image are not drawn, the overlay image is, and the
   fills are not: what closes an area is what is drawn, whatever its color.
2. The area is the one of the pixels of the color of the pixel pressed which are connected to it (up, down, left
   or right, so a line of pixels which touch at their corners closes it). A color has its alpha applied before
   it is compared, so a faint pixel of a red line is as near to a transparent one as a faint pixel of a black one.
3. When the area reaches the edge of the canvas, it is not closed, and there is no fill.
4. The area grows by `overlap` pixels, over the pixels which an object above the fill draws, and no further. The
   edge of a line is smooth, so an area which stops at the line leaves a thin seam: the fill goes under the line.
5. The outline of the area is followed pixel edge by pixel edge (one loop for the outer edge and one for each
   hole, so a circle in a rectangle is a ring), and the steps of a diagonal or a curve are made a line.
6. The fill is a `FillPath` (a fabric `Path`, of the type `BucketFill`) in the coordinates of the objects, so
   it scales with the canvas and is saved by `toJSON()`. Importing the package registers the type, which is
   what loads it.

It goes over the topmost object which is drawn at the point pressed (an older fill of the area, or a filled
rectangle the area is in) and under the objects which are above that one: the lines which close the area.

## Limits

- The area has to be closed within the canvas as it is shown. When the view is zoomed in so that a rectangle is
  partly out of it, the inside reaches the edge and there is no fill.
- The pixels of a canvas which is tainted (an image of a server without CORS headers) cannot be read. The
  images are left out then, and the area is closed by the other objects.
- A line with a gap lets the color out, however small the gap: a dashed line does not close an area.

## Pieces

`floodFill`, `grow`, `traceOutline`, `simplify` and `outlinePath` are exported too. They work on the pixels of
an image (`{ data, width, height }`, as `getImageData` returns them) and do not need a canvas.
