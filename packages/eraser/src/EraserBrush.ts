/*!
 * The eraser is the code of @erase2d/fabric 1.2.2 (https://github.com/ShaMan123/erase2d),
 * changed for react-sketch. Its license:
 *
 * 2024 Shachar Nencel @ShaMan123
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the “Software”), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
 * OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
import { erase, type Region } from "./erase";
import * as fabric from "fabric";
import { FabricObject, Group, Path } from "fabric";
import { ClippingGroup } from "./ClippingGroup";
import { draw } from "./ErasingEffect";

export type EventDetailMap = {
  start: fabric.TEvent<fabric.TPointerEvent>;
  move: fabric.TEvent<fabric.TPointerEvent>;
  end: {
    path: fabric.Path;
    targets: fabric.FabricObject[];
  };
  redraw: { type: "start" | "render" };
  cancel: never;
};

export type ErasingEventType = keyof EventDetailMap;

export type ErasingEvent<T extends ErasingEventType> = CustomEvent<
  EventDetailMap[T]
>;

function walk(objects: FabricObject[], path: Path): FabricObject[] {
  return objects.flatMap((object) => {
    if (!object.erasable || !object.intersectsWithObject(path)) {
      return [];
    } else if (object instanceof Group && object.erasable === "deep") {
      return walk(object.getObjects(), path);
    } else {
      return [object];
    }
  });
}

const assertClippingGroup = (object: fabric.FabricObject) => {
  const curr = object.clipPath;

  if (curr instanceof ClippingGroup) {
    return curr;
  }

  const strokeWidth = object.strokeWidth;
  const strokeWidthFactor = new fabric.Point(strokeWidth, strokeWidth);
  const strokeVector = object.strokeUniform
    ? strokeWidthFactor.divide(object.getObjectScaling())
    : strokeWidthFactor;

  const next = new ClippingGroup([], {
    width: object.width + strokeVector.x,
    height: object.height + strokeVector.y,
  });

  if (curr) {
    const { x, y } = curr.translateToOriginPoint(
      new fabric.Point(),
      curr.originX,
      curr.originY
    );
    curr.originX = curr.originY = "center";
    fabric.util.sendObjectToPlane(
      curr,
      undefined,
      fabric.util.createTranslateMatrix(x, y)
    );
    next.add(curr as FabricObject);
  }

  return (object.clipPath = next);
};

export function commitErasing(
  object: fabric.FabricObject,
  sourceInObjectPlane: fabric.Path
) {
  const clipPath = assertClippingGroup(object);
  clipPath.add(sourceInObjectPlane);
  clipPath.set("dirty", true);
  object.set("dirty", true);
}

export async function eraseObject(object: fabric.FabricObject, source: fabric.Path) {
  const clone = await source.clone();
  fabric.util.sendObjectToPlane(clone, undefined, object.calcTransformMatrix());
  commitErasing(object, clone);
  return clone;
}

export async function eraseCanvasDrawable(
  object: fabric.FabricObject,
  vpt: fabric.TMat2D | undefined,
  source: fabric.Path
) {
  const clone = await source.clone();
  const d =
    vpt &&
    object.translateToOriginPoint(
      new fabric.Point(),
      object.originX,
      object.originY
    );
  fabric.util.sendObjectToPlane(
    clone,
    undefined,
    d
      ? fabric.util.multiplyTransformMatrixArray([
          [1, 0, 0, 1, d.x, d.y],
          // apply vpt from center of drawable
          vpt,
          [1, 0, 0, 1, -d.x, -d.y],
          object.calcTransformMatrix(),
        ])
      : object.calcTransformMatrix()
  );
  commitErasing(object, clone);
  return clone;
}

const setCanvasDimensions = (
  el: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  { width, height }: fabric.TSize,
  retinaScaling = 1
) => {
  el.width = width;
  el.height = height;
  if (retinaScaling > 1) {
    el.setAttribute("width", (width * retinaScaling).toString());
    el.setAttribute("height", (height * retinaScaling).toString());
    ctx.scale(retinaScaling, retinaScaling);
  }
};

/**
 * Supports **selective** erasing: only erasable objects are affected by the eraser brush.
 *
 * Supports **{@link inverted}** erasing: the brush can "undo" erasing.
 *
 * Supports **alpha** erasing: setting the alpha channel of the `color` property controls the eraser intensity.
 *
 * In order to support selective erasing, the brush clips the entire canvas and
 * masks all non-erasable objects over the erased path, see {@link draw}.
 *
 * If **{@link inverted}** draws all objects, erasable objects without their eraser, over the erased path.
 * This achieves the desired effect of seeming to erase or undo erasing on erasable objects only.
 *
 * After erasing is done the `end` event {@link ErasingEndEvent} is fired, after which erasing will be committed to the tree.
 * @example
 * canvas = new Canvas();
 * const eraser = new EraserBrush(canvas);
 * canvas.freeDrawingBrush = eraser;
 * canvas.isDrawingMode = true;
 * eraser.on('start', (e) => {
 *    console.log('started erasing');
 *    // prevent erasing
 *    e.preventDefault();
 * });
 * eraser.on('end', (e) => {
 *    const { targets: erasedTargets, path } = e.detail;
 *    e.preventDefault(); // prevent erasing being committed to the tree
 *    eraser.commit({ targets: erasedTargets, path }); // commit manually since default was prevented
 * });
 *
 * In case of performance issues trace {@link drawEffect} calls and consider preventing it from executing
 * @example
 * const eraser = new EraserBrush(canvas);
 * eraser.on('redraw', (e) => {
 *    // prevent effect redraw on pointer down (e.g. useful if canvas didn't change)
 *    e.detail.type === 'start' && e.preventDefault());
 *    // prevent effect redraw after canvas has rendered (effect will become stale)
 *    e.detail.type === 'render' && e.preventDefault());
 * });
 */
export class EraserBrush extends fabric.PencilBrush {
  /**
   * When set to `true` the brush will create a visual effect of undoing erasing
   */
  inverted = false;

  effectContext: CanvasRenderingContext2D;

  private eventEmitter: EventTarget;
  private active = false;
  private _disposer?: VoidFunction;
  /**
   * number of points drawn by the last render, see {@link _getDirtyRegion}
   */
  private _renderedPoints = 0;

  constructor(canvas: fabric.Canvas) {
    super(canvas);
    const el = document.createElement("canvas");
    const ctx = el.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get context");
    }
    setCanvasDimensions(el, ctx, canvas, this.canvas.getRetinaScaling());
    this.effectContext = ctx;
    this.eventEmitter = new EventTarget();
  }

  /**
   * @returns disposer make sure to call it to avoid memory leaks
   */
  on<T extends ErasingEventType>(
    type: T,
    cb: (evt: ErasingEvent<T>) => unknown,
    options?: boolean | AddEventListenerOptions
  ) {
    this.eventEmitter.addEventListener(type, cb as EventListener, options);
    return () =>
      this.eventEmitter.removeEventListener(type, cb as EventListener, options);
  }

  drawEffect() {
    draw(
      this.effectContext,
      {
        opacity: new fabric.Color(this.color).getAlpha(),
        inverted: this.inverted,
      },
      { canvas: this.canvas }
    );
  }

  /**
   * @override
   */
  _setBrushStyles(ctx: CanvasRenderingContext2D = this.canvas.contextTop) {
    super._setBrushStyles(ctx);
    ctx.strokeStyle = "black";
  }

  /**
   * @override strictly speaking the eraser needs a full render only if it has opacity set.
   * However since {@link PencilBrush} is designed for subclassing that is what we have to work with.
   */
  needsFullRender(): boolean {
    return true;
  }

  /**
   * @override erase
   *
   * Composites the entire canvas.
   * Pointer moves render through {@link _renderMove} instead.
   */
  _render(ctx: CanvasRenderingContext2D = this.canvas.getTopContext()): void {
    super._render(ctx);
    erase(this.canvas.getContext(), ctx, this.effectContext);
    this._renderedPoints = this["_points"].length;
  }

  /**
   * The pixel bounds of the part of the path that changed since the last render.
   * The path is smoothed through the midpoints of its points,
   * so adding a point changes the curve from the 2 points before the last rendered one.
   * @returns `undefined` when the entire canvas has to be composited:
   * a straight line moves its end point instead of adding one, and a shadow is drawn outside of the stroke.
   */
  private _getDirtyRegion(): Region | undefined {
    if (this["_hasStraightLine"] || this.shadow) {
      return;
    }
    const points: fabric.Point[] = this["_points"];
    const from = Math.max(0, this._renderedPoints - 3);
    if (from === 0 || points.length - from < 2) {
      return;
    }
    const { canvas } = this;
    const el = canvas.getTopContext().canvas;
    const scale = canvas.getRetinaScaling();
    const t = fabric.util.multiplyTransformMatrices(
      [scale, 0, 0, scale, 0, 0],
      canvas.viewportTransform
    );
    // how far the stroke extends from its points: square caps reach the corners, miter joins up to the miter limit
    const extent = Math.max(
      this.strokeLineCap === "square" ? Math.SQRT2 : 1,
      this.strokeLineJoin === "miter" ? this.strokeMiterLimit : 1
    );
    // in pixels, with a margin for antialiasing
    const pad =
      (this.width / 2) *
        extent *
        Math.max(Math.hypot(t[0], t[1]), Math.hypot(t[2], t[3])) +
      2;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let i = from; i < points.length; i++) {
      const { x, y } = fabric.util.transformPoint(points[i], t);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const x = Math.max(0, Math.floor(minX - pad));
    const y = Math.max(0, Math.floor(minY - pad));
    const width = Math.min(el.width, Math.ceil(maxX + pad)) - x;
    const height = Math.min(el.height, Math.ceil(maxY + pad)) - y;
    if (width <= 0 || height <= 0) {
      return;
    }
    return { x, y, width, height };
  }

  /**
   * Renders only {@link region}: the rest of the top context already holds the effect of the previous render
   * and the rest of the main context is already erased by it.
   */
  private _renderRegion(region: Region) {
    const ctx = this.canvas.getTopContext();
    ctx.save();
    const transform = ctx.getTransform();
    ctx.resetTransform();
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.width, region.height);
    ctx.clip();
    ctx.clearRect(region.x, region.y, region.width, region.height);
    ctx.setTransform(transform);
    // the full path is stroked but only the region is rasterized
    fabric.PencilBrush.prototype._render.call(this, ctx);
    ctx.restore();
    erase(this.canvas.getContext(), ctx, this.effectContext, region);
    this._renderedPoints = this["_points"].length;
  }

  /**
   * Renders the point added by a pointer move:
   * only the part of the path that changed if possible, see {@link _getDirtyRegion}, the entire canvas otherwise.
   */
  private _renderMove() {
    const region = this._getDirtyRegion();
    if (region) {
      this._renderRegion(region);
      return;
    }
    this.canvas.clearContext(this.canvas.contextTop);
    this._render();
  }

  /**
   * @override {@link drawEffect}
   */
  onMouseDown(
    pointer: fabric.Point,
    context: fabric.TEvent<fabric.TPointerEvent>
  ): void {
    if (
      !this.eventEmitter.dispatchEvent(
        new CustomEvent("start", { detail: context, cancelable: true })
      )
    ) {
      return;
    }

    this.active = true;

    if (
      this.eventEmitter.dispatchEvent(
        new CustomEvent("redraw", {
          detail: { type: "start" },
          cancelable: true,
        })
      )
    ) {
      this.drawEffect();
    }

    // consider a different approach
    this._disposer = this.canvas.on("after:render", ({ ctx }) => {
      if (ctx !== this.canvas.getContext()) {
        return;
      }
      if (
        this.eventEmitter.dispatchEvent(
          new CustomEvent("redraw", {
            detail: { type: "render" },
            cancelable: true,
          })
        )
      ) {
        this.drawEffect();
      }
      this._render();
    });

    super.onMouseDown(pointer, context);
  }

  /**
   * @override run if active.
   * Same as {@link fabric.PencilBrush#onMouseMove} except that it does not clear the entire top context,
   * since {@link _renderMove} may redraw only the part of it that changed.
   */
  onMouseMove(
    pointer: fabric.Point,
    context: fabric.TEvent<fabric.TPointerEvent>
  ): void {
    if (
      !this.active ||
      !this.eventEmitter.dispatchEvent(
        new CustomEvent("move", { detail: context, cancelable: true })
      )
    ) {
      return;
    }
    const { e } = context;
    if (!this.canvas._isMainEvent(e)) {
      return;
    }
    this.drawStraightLine = !!this.straightLineKey && e[this.straightLineKey];
    if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
      return;
    }
    if (this._addPoint(pointer) && this["_points"].length > 1) {
      this._renderMove();
    }
  }

  /**
   * @override run if active, dispose of {@link drawEffect} listener
   */
  onMouseUp(context: fabric.TEvent<fabric.TPointerEvent>): boolean {
    if (this.active) super.onMouseUp(context);
    this.active = false;
    this._disposer?.();
    delete this._disposer;
    return false;
  }

  /**
   * @override {@link fabric.PencilBrush} logic
   */
  convertPointsToSVGPath(points: fabric.Point[]): fabric.util.TSimplePathData {
    return super.convertPointsToSVGPath(
      this.decimate ? this.decimatePoints(points, this.decimate) : points
    );
  }

  /**
   * @override
   */
  createPath(pathData: fabric.util.TSimplePathData) {
    const path = super.createPath(pathData);
    path.set(
      this.inverted
        ? {
            globalCompositeOperation: "source-over",
            stroke: "white",
          }
        : {
            globalCompositeOperation: "destination-out",
            stroke: "black",
            opacity: new fabric.Color(this.color).getAlpha(),
          }
    );
    return path;
  }

  async commit({
    path,
    targets,
  }: EventDetailMap["end"]): Promise<Map<fabric.FabricObject, fabric.Path>> {
    return new Map(
      await Promise.all([
        ...targets.map(async (object) => {
          return [object, await eraseObject(object, path)] as const;
        }),
        ...(
          [
            [
              this.canvas.backgroundImage,
              !this.canvas.backgroundVpt ? this.canvas.viewportTransform : undefined,
            ],
            [
              this.canvas.overlayImage,
              !this.canvas.overlayVpt ? this.canvas.viewportTransform : undefined,
            ],
          ] as const
        )
          .filter(([object]) => !!object?.erasable)
          .map(async ([object, vptFlag]) => {
            return [
              object,
              await eraseCanvasDrawable(object as FabricObject, vptFlag, path),
            ] as [fabric.FabricObject, fabric.Path];
          }),
      ])
    );
  }

  /**
   * @override handle events
   */
  _finalizeAndAddPath(): void {
    const points = this["_points"];

    if (points.length < 2) {
      this.eventEmitter.dispatchEvent(
        new CustomEvent("cancel", {
          cancelable: false,
        })
      );
      return;
    }

    const path = this.createPath(this.convertPointsToSVGPath(points));
    const targets = walk(this.canvas.getObjects(), path);

    if (
      this.eventEmitter.dispatchEvent(
        new CustomEvent("end", {
          detail: {
            path,
            targets,
          },
          cancelable: true,
        })
      )
    ) {
      void this.commit({ path, targets });
    }

    this.canvas.clearContext(this.canvas.contextTop);
    this.canvas.requestRenderAll();

    this._resetShadow();
  }

  dispose() {
    const { canvas } = this.effectContext;
    // prompt GC
    canvas.width = canvas.height = 0;
    // release ref?
    // delete this.effectContext
  }
}
