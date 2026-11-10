import * as fabric from "fabric";
import { addCapsule, StrokeSampler, type Disc } from "./geometry";
import { penOf } from "./pen";
import { PressureStroke, savedDisc } from "./PressureStroke";

/**
 * The brush of the free drawing tools. It draws as the brush of fabric does, and the stroke
 * of a pen is drawn with a width which follows its pressure when `pressureSensitive` is on:
 * a path which is filled (a {@link PressureStroke}), and is the outline of the stroke, and not a line with a width.
 * The strokes of a mouse and of a finger are not changed: they have no pressure.
 */
export class PressureBrush extends fabric.PencilBrush {
  private pressured = false;
  /** The stroke of a pen in progress */
  private sampler?: StrokeSampler;
  /** How many of the discs of the stroke are on the top canvas */
  private drawn = 0;

  get pressureSensitive(): boolean {
    return this.pressured;
  }

  set pressureSensitive(on: boolean) {
    this.pressured = on;
    penOf(this.canvas).listen(on);
  }

  onMouseDown(pointer: fabric.Point, event: { e: fabric.TPointerEvent }): void {
    this.sampler = undefined;
    if (!this.pressured || !penOf(this.canvas).pen) {
      super.onMouseDown(pointer, event);
      return;
    }
    if (!this.canvas._isMainEvent(event.e)) return;
    this.sampler = new StrokeSampler(this.width);
    this.drawn = 0;
    this._reset();
    this.addPoint(pointer);
    this.preview();
  }

  onMouseMove(pointer: fabric.Point, event: { e: fabric.TPointerEvent }): void {
    if (!this.sampler) {
      super.onMouseMove(pointer, event);
      return;
    }
    if (!this.canvas._isMainEvent(event.e)) return;
    if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) return;
    if (this.addPoint(pointer)) this.preview();
  }

  onMouseUp(event: { e: fabric.TPointerEvent }): boolean {
    if (!this.sampler) return super.onMouseUp(event);
    if (!this.canvas._isMainEvent(event.e)) return true;
    this.sampler.finish();
    this.addPath(this.sampler);
    this.sampler = undefined;
    return false;
  }

  /** Forget the stroke in progress, nothing is drawn of it */
  cancel(): void {
    this.sampler = undefined;
  }

  /** The brush of fabric draws the line again when the top canvas is drawn again */
  _render(ctx: CanvasRenderingContext2D = this.canvas.contextTop): void {
    if (!this.sampler) {
      super._render(ctx);
      return;
    }
    this.paint(ctx, 0, true);
  }

  /**
   * Add the point of the pointer to the stroke, with the pressure it has now. Points which are
   * too close to the one before are left out, as the brush of fabric does.
   */
  private addPoint({ x, y }: fabric.Point): boolean {
    const sampler = this.sampler as StrokeSampler;
    const last = sampler.last;
    const distance = this.decimate / this.canvas.getZoom();
    if (last && Math.hypot(x - last.x, y - last.y) < distance) return false;
    sampler.add(x, y, penOf(this.canvas).pressure);
    return true;
  }

  /** Draw what the last points added to the stroke on the top canvas */
  private preview(): void {
    const { contextTop: ctx } = this.canvas;
    const sampler = this.sampler as StrokeSampler;
    // A color which is not opaque would be darker where the pieces overlap, so it is drawn whole
    if (this.needsFullRender()) {
      this.canvas.clearContext(ctx);
      this.paint(ctx, 0, true);
    } else {
      this.paint(ctx, Math.max(this.drawn - 1, 0), false);
    }
    this.drawn = sampler.discs.length;
  }

  /**
   * Fill the stroke from the disc at `from`, as one shape or one piece after the other
   */
  private paint(ctx: CanvasRenderingContext2D, from: number, whole: boolean): void {
    const { discs } = this.sampler as StrokeSampler;
    const pieces: [Disc, Disc][] = [];
    for (let i = from + 1; i < discs.length; i++)
      pieces.push([discs[i - 1], discs[i]]);
    // A stroke of one disc, which is all there is until the pen moves
    if (!pieces.length && discs[from]) pieces.push([discs[from], discs[from]]);
    this._saveAndTransform(ctx);
    ctx.fillStyle = this.color;
    if (whole) ctx.beginPath();
    for (const [a, b] of pieces) {
      if (!whole) ctx.beginPath();
      addCapsule(ctx, a, b);
      if (!whole) ctx.fill();
    }
    if (whole) ctx.fill();
    ctx.restore();
  }

  /** The stroke is lifted: the outline of it is a path of the canvas */
  private addPath({ discs }: StrokeSampler): void {
    if (!discs.length) {
      this.canvas.requestRenderAll();
      return;
    }
    const path = new PressureStroke(discs.map(savedDisc), {
      fill: this.color,
      stroke: null,
      strokeWidth: 0,
    });
    this.canvas.clearContext(this.canvas.contextTop);
    this.canvas.fire("before:path:created", { path });
    this.canvas.add(path);
    this.canvas.requestRenderAll();
    path.setCoords();
    this._resetShadow();
    this.canvas.fire("path:created", { path });
  }
}
