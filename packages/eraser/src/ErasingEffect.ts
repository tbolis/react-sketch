import { Canvas, FabricObject, Group } from "fabric";
import { ClippingGroup } from "./ClippingGroup";

function walk(objects: FabricObject[]): FabricObject[] {
  return objects.flatMap((object) => {
    if (!object.erasable || object.isNotVisible()) {
      return [];
    } else if (object instanceof Group && object.erasable === "deep") {
      return walk(object.getObjects());
    } else {
      return [object];
    }
  });
}

function drawCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: Canvas,
  objects: FabricObject[]
) {
  canvas.clearContext(ctx);

  ctx.imageSmoothingEnabled = canvas.imageSmoothingEnabled;
  ctx.imageSmoothingQuality = "high";
  // @ts-expect-error node-canvas stuff
  ctx.patternQuality = "best";

  canvas._renderBackground(ctx);

  ctx.save();
  ctx.transform(...canvas.viewportTransform);
  objects.forEach((object) => object.render(ctx));
  ctx.restore();

  const clipPath = canvas.clipPath;
  if (clipPath) {
    // fabric crap
    clipPath._set("canvas", canvas);
    clipPath.shouldCache();
    clipPath._transformDone = true;
    // @ts-expect-error fabric type crap
    clipPath.renderCache({ forClipping: true });
    canvas.drawClipPathOnCanvas(
      ctx,
      clipPath as unknown as Parameters<Canvas["drawClipPathOnCanvas"]>[1]
    );
  }

  canvas._renderOverlay(ctx);
}

/**
 * Prepare the pattern for the erasing brush
 * This pattern will be drawn on the top context after clipping the main context,
 * achieving a visual effect of erasing only erasable objects.
 *
 * This is designed to support erasing a collection with both erasable and non-erasable objects while maintaining object stacking.\
 * Iterates over collections to allow nested selective erasing.\
 * Prepares objects before rendering the pattern brush.\
 * If brush is **NOT** inverted render all non-erasable objects.\
 * If brush is inverted render all objects, erasable objects without their eraser.
 * This will render the erased parts as if they were not erased in the first place, achieving an undo effect.
 *
 * Caveat:
 * Does not support erasing effects of shadows
 *
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  { inverted, opacity }: { inverted: boolean; opacity: number },
  {
    canvas,
    objects = canvas._objectsToRender || canvas._objects,
    background = canvas.backgroundImage,
    overlay = canvas.overlayImage,
  }: {
    canvas: Canvas;
    objects?: FabricObject[];
    background?: FabricObject;
    overlay?: FabricObject;
  }
) {
  // prepare tree
  const alpha = 1 - opacity;
  const restore = walk([
    ...objects,
    ...([background, overlay] as FabricObject[]).filter((d) => !!d),
  ]).map((object) => {
    if (!inverted) {
      //  render only non-erasable objects
      const opacity = object.opacity;
      object.opacity *= alpha;
      object.parent?.set("dirty", true);
      return { object, opacity };
    } else if (object.clipPath instanceof ClippingGroup) {
      //  render all objects without eraser
      object.clipPath["blockErasing"] = true;
      object.clipPath.set("dirty", true);
      object.set("dirty", true);
      return { object, clipPath: object.clipPath };
    }
    return undefined;
  });

  // draw
  drawCanvas(ctx, canvas, objects);

  // restore
  restore.forEach((entry) => {
    if (!entry) {
      return;
    }
    // An opacity of 0 is a value to restore too
    if (entry.opacity !== undefined) {
      entry.object.opacity = entry.opacity;
      entry.object.parent?.set("dirty", true);
    } else if (entry.clipPath) {
      entry.clipPath["blockErasing"] = false;
      entry.clipPath.set("dirty", true);
      entry.object.set("dirty", true);
    }
  });
}
