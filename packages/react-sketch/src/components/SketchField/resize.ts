/**
 * Track the resize of the window and update our state
 *
 * @param canvas the fabric Canvas Instance
 * @param container the HTMLDivElement we want to follow the resize with
 */
import { fabric } from "fabric";

export const autoresize = (
  canvas: fabric.Canvas,
  container: HTMLDivElement
): void => {
  const { offsetWidth, clientHeight } = container;
  const prevWidth = canvas.getWidth();
  const prevHeight = canvas.getHeight();
  const wfactor = parseFloat((offsetWidth / prevWidth).toFixed(2));
  const hfactor = parseFloat((clientHeight / prevHeight).toFixed(2));
  canvas.setWidth(offsetWidth);
  canvas.setHeight(clientHeight);
  if ("backgroundImage" in canvas) {
    // Need to scale background images as well
    const bi = canvas.backgroundImage;
    if (bi instanceof fabric.Image) {
      bi.width = bi.width * wfactor;
      bi.height = bi.height * hfactor;
    }
  }
  const objects = canvas.getObjects();
  for (const i in objects) {
    const obj = objects[i];
    const scaleX = obj.scaleX;
    const scaleY = obj.scaleY;
    const left = obj.left;
    const top = obj.top;
    const tempScaleX = scaleX * wfactor;
    const tempScaleY = scaleY * hfactor;
    const tempLeft = left * wfactor;
    const tempTop = top * hfactor;
    obj.scaleX = tempScaleX;
    obj.scaleY = tempScaleY;
    obj.left = tempLeft;
    obj.top = tempTop;
    obj.setCoords();
  }
  canvas.renderAll();
  canvas.calcOffset();
};
