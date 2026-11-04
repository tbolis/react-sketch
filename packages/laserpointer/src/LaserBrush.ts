import * as fabric from "fabric";

/** A point of a trail, with the moment it was added (milliseconds) */
interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

/**
 * The line of one drag. While the pointer is down (`held`) the newest point
 * is as fresh as the pointer, so the head of the line does not fade.
 */
interface Trail {
  points: TrailPoint[];
  held: boolean;
}

/** A move of the pointer shorter than this (pixels) is not a new point */
const MIN_DISTANCE = 1;

const now = (): number => performance.now();

/**
 * A brush which draws a line that fades out and disappears, as a laser
 * pointer does. Nothing is added to the canvas: the line is drawn on the top
 * canvas only, so it is never part of the drawing (objects, JSON, image, undo).
 *
 * It follows `color` and `width` like any brush, and `shadow` makes it glow.
 * The line is as thick as `width` at the pointer and gets thinner towards its
 * start, until it is gone `duration` milliseconds after that part was drawn.
 */
export class LaserBrush extends fabric.BaseBrush {
  /** Milliseconds a part of the line takes to fade out */
  duration = 1000;

  private trails: Trail[] = [];
  private frame?: number;

  onMouseDown(pointer: fabric.Point, { e }: fabric.TBrushEventData): void {
    if (!this.canvas._isMainEvent(e)) return;
    const trail: Trail = { points: [], held: true };
    this.trails.push(trail);
    this.addPoint(trail, pointer);
    this.animate();
  }

  onMouseMove(pointer: fabric.Point, { e }: fabric.TBrushEventData): void {
    const trail = this.trails.find((t) => t.held);
    if (!trail || !this.canvas._isMainEvent(e)) return;
    this.addPoint(trail, pointer);
  }

  onMouseUp({ e }: fabric.TBrushEventData): boolean {
    // The line stays on its own, it fades whatever the pointer does next
    if (!this.canvas._isMainEvent(e)) return true;
    this.trails.forEach((trail) => (trail.held = false));
    return false;
  }

  /** The line which is drawn stays on its own, as when the pointer is released */
  cancel(): void {
    this.trails.forEach((trail) => (trail.held = false));
  }

  /**
   * Draw the lines on the top canvas. The canvas calls it when it renders the
   * top canvas while a line is drawn, the animation calls it on every frame.
   */
  _render(): void {
    const ctx = this.canvas.contextTop;
    const time = now();
    this._saveAndTransform(ctx);
    this._setShadow();
    ctx.fillStyle = this.color;
    // One path for every line, filled once, so the parts which overlap are not drawn twice
    ctx.beginPath();
    this.trails.forEach((trail) => this.outline(ctx, trail, time));
    ctx.fill();
    ctx.restore();
  }

  /**
   * Stop the animation and clear what is left of the lines. The brush is not
   * used after that.
   */
  dispose(): void {
    if (this.frame !== undefined) fabric.util.cancelAnimFrame(this.frame);
    this.frame = undefined;
    this.trails = [];
    if (!this.gone) this.canvas.clearContext(this.canvas.contextTop);
  }

  /** The canvas was disposed, so its contexts are not there any more */
  private get gone(): boolean {
    return !!(this.canvas.disposed || this.canvas.destroyed);
  }

  private addPoint(trail: Trail, { x, y }: fabric.Point): void {
    const last = trail.points[trail.points.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) < MIN_DISTANCE) return;
    trail.points.push({ x, y, time: now() });
  }

  private animate(): void {
    if (this.frame !== undefined) return;
    this.frame = fabric.util.requestAnimFrame(() => this.tick());
  }

  private tick(): void {
    this.frame = undefined;
    if (this.gone) {
      this.trails = [];
      return;
    }
    this.fade(now());
    this.canvas.clearContext(this.canvas.contextTop);
    // The animation runs while there is something to show
    if (!this.trails.length) return;
    this._render();
    this.animate();
  }

  /**
   * Drop the points which are faded out, and the lines which have none left
   */
  private fade(time: number): void {
    this.trails.forEach((trail) => {
      const { points } = trail;
      if (trail.held) points[points.length - 1].time = time;
      const alive = points.findIndex((p) => time - p.time < this.duration);
      points.splice(0, alive < 0 ? points.length : alive);
    });
    this.trails = this.trails.filter((trail) => trail.points.length);
  }

  /**
   * Add the shape of the line to the current path: a circle at each point
   * (the cap and the joins of a round line) and a quadrilateral between each
   * two points, each as thick as the line is where it is.
   */
  private outline(
    ctx: CanvasRenderingContext2D,
    { points }: Trail,
    time: number
  ): void {
    const radius = (p: TrailPoint): number =>
      (this.width / 2) * Math.max(0, 1 - (time - p.time) / this.duration);

    points.forEach((from, i) => {
      const r = radius(from);
      ctx.moveTo(from.x + r, from.y);
      ctx.arc(from.x, from.y, r, 0, 2 * Math.PI);

      const to = points[i + 1];
      if (!to) return;
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      // Unit vector which is perpendicular to the segment
      const nx = -(to.y - from.y) / length;
      const ny = (to.x - from.x) / length;
      const r2 = radius(to);
      // Clockwise, as the circles are, so that the shapes which overlap add up
      // and do not cancel each other out (non-zero winding)
      ctx.moveTo(from.x - nx * r, from.y - ny * r);
      ctx.lineTo(to.x - nx * r2, to.y - ny * r2);
      ctx.lineTo(to.x + nx * r2, to.y + ny * r2);
      ctx.lineTo(from.x + nx * r, from.y + ny * r);
      ctx.closePath();
    });
  }
}
