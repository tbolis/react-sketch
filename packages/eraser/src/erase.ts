/**
 * A rectangle in canvas pixels (ignoring any transform)
 */
export type Region = { x: number; y: number; width: number; height: number };

export const drawImage = (
  destination: CanvasRenderingContext2D,
  source: CanvasRenderingContext2D,
  globalCompositeOperation: GlobalCompositeOperation = "source-over",
  region?: Region
) => {
  destination.save();
  destination.imageSmoothingEnabled = true;
  destination.imageSmoothingQuality = "high";
  destination.globalCompositeOperation = globalCompositeOperation;
  destination.resetTransform();
  if (region) {
    const { x, y, width, height } = region;
    // composite only the region, the rest of the destination is left as is
    destination.beginPath();
    destination.rect(x, y, width, height);
    destination.clip();
    destination.drawImage(source.canvas, x, y, width, height, x, y, width, height);
  } else {
    destination.drawImage(source.canvas, 0, 0);
  }
  destination.restore();
};

/**
 *
 * @param destination context to erase
 * @param source context on which the path is drawn upon
 * @param erasingEffect effect to apply to {@link source} after clipping {@link destination}:
 * - drawing all non erasable visuals to achieve a selective erasing effect.
 * - drawing all erasable visuals without their erasers to achieve an undo erasing effect.
 * @param region limits erasing to a rectangle in canvas pixels, the rest of both contexts is left as is
 */
export const erase = (
  destination: CanvasRenderingContext2D,
  source: CanvasRenderingContext2D,
  erasingEffect?: CanvasRenderingContext2D,
  region?: Region
) => {
  // clip destination
  drawImage(destination, source, "destination-out", region);

  // draw erasing effect
  if (erasingEffect) {
    drawImage(source, erasingEffect, "source-in", region);
  } else {
    source.save();
    source.resetTransform();
    if (region) {
      source.clearRect(region.x, region.y, region.width, region.height);
    } else {
      source.clearRect(0, 0, source.canvas.width, source.canvas.height);
    }
    source.restore();
  }
};
