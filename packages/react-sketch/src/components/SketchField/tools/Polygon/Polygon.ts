import * as fabric from "fabric";
import { CanvasEvent } from "../../events";
import { FabricCanvasTool } from "../index";
import { SketchProperties, Tool } from "../../../../types";

/** The fewest vertices of a polygon */
const MIN_VERTICES = 3;

/** How near (in screen pixels) the pointer must be to the first vertex to close the polygon */
const CLOSE_RADIUS = 10;
const CLOSE_RADIUS_TOUCH = 20;

/** Two releases this close in time (milliseconds) and in space (the radius above) are a double click */
const DOUBLE_CLICK_TIME = 400;

/** Whether the element is one the user types in, which keeps its keys */
const isEditable = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  return (
    !!element &&
    (element.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName))
  );
};

/**
 * Draws a closed shape of straight sides: each click or tap places a vertex.
 * The polygon is closed by a click or tap on the first vertex, a double click
 * or double tap, or the Enter key, and the Escape key cancels it.
 *
 * The polygon in progress is drawn on the top canvas only, it is not an
 * object of the sketch until it is closed. Then it is one `fabric.Polygon`,
 * which is one undo step.
 */
export class Polygon extends FabricCanvasTool {
  /** Called when a polygon is closed, with the polygon which was added to the canvas */
  onComplete?: (polygon: fabric.Polygon) => void;

  private width?: number;
  private color?: string;
  private fill?: string;
  /** The vertices of the polygon in progress, in canvas coordinates */
  private vertices: fabric.Point[] = [];
  /** Where the pointer is, null while it is out of the canvas */
  private pointerAt: fabric.Point | null = null;
  private isDown = false;
  private isTouch = false;
  private lastRelease?: { time: number; point: fabric.Point };

  constructor(canvas: fabric.Canvas) {
    super(canvas);
  }

  configureCanvas(props: SketchProperties): void {
    this.setInteractive(false);
    this.width = props.lineWidth ? props.lineWidth : 1;
    this.color = props.lineColor ? props.lineColor : "black";
    this.fill = props.fillColor ? props.fillColor : "transparent";
    if (this.vertices.length) this.paint();
  }

  type(): Tool {
    return Tool.POLYGON;
  }

  /**
   * The application is told when a polygon is closed, and not after each
   * vertex
   */
  notifiesChange(): boolean {
    return false;
  }

  doMouseDown(event: CanvasEvent): void {
    this.isDown = true;
    this.isTouch = this.touch(event);
    this.pointerAt = this.point(event);
    this.paint();
  }

  doMouseMove(event: CanvasEvent): void {
    if (!this.vertices.length) return;
    this.pointerAt = this.point(event);
    this.paint();
  }

  /** A press which leaves the canvas places nothing */
  doMouseOut(): void {
    this.isDown = false;
    this.pointerAt = null;
    this.paint();
  }

  /** The vertex is where the pointer is released */
  doMouseUp(event: CanvasEvent): void {
    if (!this.isDown) return;
    this.isDown = false;
    const point = this.point(event);
    const now = Date.now();
    const doubleClick =
      !!this.lastRelease &&
      now - this.lastRelease.time < DOUBLE_CLICK_TIME &&
      this.isNear(point, this.lastRelease.point);
    this.lastRelease = { time: now, point };

    // The first click of a double click has placed its vertex, the second is not another one
    if (doubleClick) {
      this.close();
      return;
    }
    if (
      this.vertices.length >= MIN_VERTICES &&
      this.isNear(point, this.vertices[0])
    ) {
      this.close();
      return;
    }
    if (!this.vertices.length) this.begin();
    this.vertices.push(point);
    this.pointerAt = point;
    this.paint();
  }

  /** Another tool takes over: the polygon is kept when it has the vertices for one */
  finish(): void {
    if (!this.close()) this.discard();
  }

  /** The polygon in progress is dropped, a closed one stays in the sketch */
  dispose(): void {
    this.discard();
    this.lastRelease = undefined;
  }

  /**
   * Add the polygon to the canvas, when there are vertices enough for it
   *
   * @returns false when there are not, and nothing was done
   */
  private close(): boolean {
    if (this.vertices.length < MIN_VERTICES) return false;
    const polygon = new fabric.Polygon(
      this.vertices.map(({ x, y }) => ({ x, y })),
      {
        stroke: this.color,
        strokeWidth: this.width,
        fill: this.fill,
        strokeLineJoin: "round",
        strokeUniform: true,
        selectable: false,
        evented: false,
      }
    );
    this.discard();
    this.canvas.add(polygon);
    this.onComplete?.(polygon);
    return true;
  }

  /** Forget the polygon in progress and take it off the top canvas */
  private discard(): void {
    if (!this.vertices.length) return;
    this.vertices = [];
    this.pointerAt = null;
    this.canvas.off("after:render", this.repaint);
    this.keyTarget.removeEventListener("keydown", this.onKeyDown);
    const ctx = this.canvas.contextTop;
    if (ctx) this.canvas.clearContext(ctx);
  }

  /** The first vertex is placed: the keys and the repaints of the canvas matter from now on */
  private begin(): void {
    this.canvas.on("after:render", this.repaint);
    this.keyTarget.addEventListener("keydown", this.onKeyDown);
  }

  /** The keys are listened to on the document of the canvas, only while a polygon is in progress */
  private get keyTarget(): Document {
    return this.canvas.upperCanvasEl.ownerDocument;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (isEditable(event.target)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.discard();
    } else if (event.key === "Enter" && this.close()) {
      event.preventDefault();
    }
  };

  /** The canvas clears its top layer when it renders, so the polygon in progress is drawn again */
  private readonly repaint = (): void => this.paint();

  private point(event: CanvasEvent): fabric.Point {
    const { x, y } = this.pointer(event);
    return new fabric.Point(x, y);
  }

  private touch(event: CanvasEvent): boolean {
    return !!event.e && fabric.util.isTouchEvent(event.e);
  }

  /** The screen size of a pixel in canvas coordinates: the radii do not grow with the zoom */
  private get pixel(): number {
    return 1 / this.canvas.getZoom();
  }

  private get radius(): number {
    return (this.isTouch ? CLOSE_RADIUS_TOUCH : CLOSE_RADIUS) * this.pixel;
  }

  private isNear(a: fabric.Point, b: fabric.Point): boolean {
    return a.distanceFrom(b) <= this.radius;
  }

  /** Whether a click where the pointer is would close the polygon */
  private get closing(): boolean {
    return (
      this.vertices.length >= MIN_VERTICES &&
      !!this.pointerAt &&
      this.isNear(this.pointerAt, this.vertices[0])
    );
  }

  /**
   * Draw the polygon in progress on the top canvas: the sides placed, the one
   * which follows the pointer, a dot on each vertex, and a ring on the first
   * vertex when a click there would close the polygon.
   */
  private paint(): void {
    if (!this.vertices.length) return;
    const { canvas, vertices, pointerAt } = this;
    const ctx = canvas.contextTop;
    // The canvas takes its top context away while it exports, and renders then
    if (!ctx) return;
    const [a, b, c, d, e, f] = canvas.viewportTransform;
    const color = this.color ?? "black";
    const width = this.width ?? 1;
    const dot = Math.max(width, 3) / 2 + this.pixel;

    canvas.clearContext(ctx);
    ctx.save();
    ctx.transform(a, b, c, d, e, f);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    vertices.forEach(({ x, y }, i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (pointerAt) ctx.lineTo(pointerAt.x, pointerAt.y);
    ctx.stroke();
    vertices.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, dot, 0, Math.PI * 2);
      ctx.fill();
    });
    if (this.closing) {
      ctx.lineWidth = 2 * this.pixel;
      ctx.beginPath();
      ctx.arc(vertices[0].x, vertices[0].y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    canvas.contextTopDirty = true;
  }
}
