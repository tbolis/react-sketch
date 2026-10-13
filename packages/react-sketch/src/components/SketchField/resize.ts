import { fabric } from "fabric";

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
  canvas.setWidth(width);
  canvas.setHeight(height);

  // Need to scale background images as well
  const bi = canvas.backgroundImage;
  if (bi instanceof fabric.Image) {
    bi.width = (bi.width ?? 0) * wfactor;
    bi.height = (bi.height ?? 0) * hfactor;
  }

  canvas.getObjects().forEach((obj) => {
    obj.scaleX = (obj.scaleX ?? 1) * wfactor;
    obj.scaleY = (obj.scaleY ?? 1) * hfactor;
    obj.left = (obj.left ?? 0) * wfactor;
    obj.top = (obj.top ?? 0) * hfactor;
    obj.setCoords();
  });
  canvas.renderAll();
  canvas.calcOffset();
};
