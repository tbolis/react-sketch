import * as fabric from "fabric";

/**
 * Scale the content of the canvas, the objects and the background and overlay
 * images, and move it by the same factors.
 *
 * The images are scaled and not resized: a bigger width of an image does not
 * stretch it.
 */
export const scaleContent = (
  canvas: fabric.Canvas,
  xFactor: number,
  yFactor: number
): void => {
  [canvas.backgroundImage, canvas.overlayImage, ...canvas.getObjects()].forEach(
    (obj) => {
      if (!obj) return;
      obj.scaleX = (obj.scaleX ?? 1) * xFactor;
      obj.scaleY = (obj.scaleY ?? 1) * yFactor;
      obj.left = (obj.left ?? 0) * xFactor;
      obj.top = (obj.top ?? 0) * yFactor;
      obj.setCoords();
    }
  );
};

/**
 * Fit the canvas to the size of its container, and scale the objects of the
 * canvas by the same factors, so the drawing keeps its proportions.
 *
 * Nothing happens when the container has no size to fit to (it is hidden, or
 * there is no layout), because the objects would collapse.
 *
 * @param canvas the fabric Canvas Instance
 * @param container the HTMLElement we want to follow the size of
 * @param widthCorrection pixels subtracted from the width of the container
 * @param heightCorrection pixels subtracted from the height of the container
 */
export const autoresize = (
  canvas: fabric.Canvas,
  container: HTMLElement,
  widthCorrection = 0,
  heightCorrection = 0
): void => {
  const width = container.offsetWidth - widthCorrection;
  const height = container.clientHeight - heightCorrection;
  const prevWidth = canvas.getWidth();
  const prevHeight = canvas.getHeight();
  if (width <= 0 || height <= 0 || !prevWidth || !prevHeight) return;

  const wfactor = parseFloat((width / prevWidth).toFixed(2));
  const hfactor = parseFloat((height / prevHeight).toFixed(2));
  canvas.setDimensions({ width, height });

  scaleContent(canvas, wfactor, hfactor);
  canvas.renderAll();
  canvas.calcOffset();
};
