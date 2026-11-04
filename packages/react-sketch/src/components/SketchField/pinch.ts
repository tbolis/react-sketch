import * as fabric from "fabric";
import { SketchView } from "../../types";

/** The view with nothing zoomed and nothing panned */
export const IDENTITY_VIEW: fabric.TMat2D = [1, 0, 0, 1, 0, 0];

/** What the gesture asks of the component it is part of */
export interface PinchHooks {
  /** A finger touches the canvas while no other does, before the canvas handles it */
  onTouch(): void;
  /** A second finger touches the canvas: the first one is no stroke any more */
  onGesture(): void;
  /** The view changed */
  onChange(view: SketchView): void;
}

/** What the gesture reads from the properties of the component, as they are now */
export interface PinchOptions {
  enabled(): boolean;
  minZoom(): number;
  maxZoom(): number;
}

/** The view of the canvas as it is: the zoom and where its origin is on the canvas */
export const viewOf = (canvas: fabric.Canvas): SketchView => {
  const [zoom, , , , x, y] = canvas.viewportTransform;
  return { zoom, x, y };
};

/**
 * Zoom and pan of the view of the canvas with two fingers: the point between
 * the fingers stays under them while the distance between them sets the zoom,
 * and moving them together pans.
 *
 * It changes the viewport transform of the canvas only. The objects stay where
 * they are, so nothing the sketch saves (`toJSON()`) or records (undo) changes.
 * fabric does not do this: its gestures need a library it no longer has, and it
 * ignores the second finger, so the touch events of the canvas are read here.
 */
export class PinchZoom {
  /** The fingers on the canvas, by identifier, in canvas pixels */
  private readonly fingers = new Map<number, fabric.Point>();
  /** The two fingers of the gesture in progress */
  private pair?: [number, number];
  /** True from the second finger until every finger left, while what the fingers do is no drawing */
  private gesture = false;
  /** The distance between the fingers, the zoom, and the point of the canvas under their middle, when the gesture began */
  private anchor?: { distance: number; zoom: number; point: fabric.Point };

  /** The element of the canvas and its document are kept: the canvas can be disposed before this is */
  private readonly upper: HTMLCanvasElement;
  private readonly doc: Document;

  constructor(
    private readonly canvas: fabric.Canvas,
    private readonly options: PinchOptions,
    private readonly hooks: PinchHooks
  ) {
    this.upper = canvas.upperCanvasEl;
    this.doc = this.upper.ownerDocument;
    this.upper.addEventListener("touchstart", this.onFirst, { capture: true });
    // The canvas handles a touch first (it listens before this does), as it starts a stroke
    // for the second finger too: that one is dropped when the gesture begins
    this.upper.addEventListener("touchstart", this.onStart);
    // The listeners of the canvas for these are on the document, the gesture goes first
    this.doc.addEventListener("touchmove", this.onMove, {
      capture: true,
      passive: false,
    });
    this.doc.addEventListener("touchend", this.onEnd, { capture: true });
    this.doc.addEventListener("touchcancel", this.onEnd, { capture: true });
  }

  get gesturing(): boolean {
    return this.gesture;
  }

  dispose(): void {
    this.upper.removeEventListener("touchstart", this.onFirst, { capture: true });
    this.upper.removeEventListener("touchstart", this.onStart);
    this.doc.removeEventListener("touchmove", this.onMove, { capture: true });
    this.doc.removeEventListener("touchend", this.onEnd, { capture: true });
    this.doc.removeEventListener("touchcancel", this.onEnd, { capture: true });
  }

  private readonly onFirst = (): void => {
    if (this.options.enabled() && !this.fingers.size) this.hooks.onTouch();
  };

  private readonly onStart = (event: TouchEvent): void => {
    if (!this.options.enabled()) return;
    Array.from(event.changedTouches).forEach((touch) =>
      this.fingers.set(touch.identifier, this.point(touch))
    );
    if (!this.pair && this.fingers.size >= 2) this.begin();
  };

  private readonly onMove = (event: TouchEvent): void => {
    if (!this.pair || !this.anchor) return;
    Array.from(event.changedTouches).forEach((touch) => {
      if (this.fingers.has(touch.identifier)) {
        this.fingers.set(touch.identifier, this.point(touch));
      }
    });
    // The tools do not see the fingers while they are a gesture
    event.stopImmediatePropagation();
    if (event.cancelable) event.preventDefault();
    this.follow();
  };

  private readonly onEnd = (event: TouchEvent): void => {
    Array.from(event.changedTouches).forEach((touch) =>
      this.fingers.delete(touch.identifier)
    );
    if (this.pair && !this.pair.every((id) => this.fingers.has(id))) {
      this.pair = this.anchor = undefined;
    }
    // The canvas handles this event after this, and it is still the gesture which ended
    if (!this.fingers.size) setTimeout(() => (this.gesture = false));
  };

  /** The second finger is down: the gesture starts from how the view is now */
  private begin(): void {
    const [first, second] = [...this.fingers.keys()];
    const [a, b] = [this.fingers.get(first)!, this.fingers.get(second)!];
    this.pair = [first, second];
    this.gesture = true;
    this.anchor = {
      distance: Math.max(a.distanceFrom(b), 1),
      zoom: this.canvas.getZoom(),
      point: a
        .midPointFrom(b)
        .transform(fabric.util.invertTransform(this.canvas.viewportTransform)),
    };
    this.hooks.onGesture();
  }

  /** Put the point of the canvas which was under the fingers under them again, at the zoom they ask for */
  private follow(): void {
    const { pair, anchor } = this;
    if (!pair || !anchor) return;
    const [a, b] = pair.map((id) => this.fingers.get(id)) as [
      fabric.Point | undefined,
      fabric.Point | undefined,
    ];
    if (!a || !b) return;
    const zoom = Math.min(
      Math.max(
        (anchor.zoom * a.distanceFrom(b)) / anchor.distance,
        this.options.minZoom()
      ),
      this.options.maxZoom()
    );
    const middle = a.midPointFrom(b);
    this.show([
      zoom,
      0,
      0,
      zoom,
      middle.x - zoom * anchor.point.x,
      middle.y - zoom * anchor.point.y,
    ]);
  }

  /**
   * Set the view, which cannot take the canvas out of sight: a quarter of its
   * smaller side stays in the window
   */
  private show(view: fabric.TMat2D): void {
    const { canvas } = this;
    const [zoom] = view;
    const [width, height] = [canvas.getWidth(), canvas.getHeight()];
    const keep = Math.min(width, height) / 4;
    view[4] = Math.min(Math.max(view[4], keep - width * zoom), width - keep);
    view[5] = Math.min(Math.max(view[5], keep - height * zoom), height - keep);
    canvas.setViewportTransform(view);
    this.hooks.onChange(viewOf(canvas));
  }

  /** The place of the finger on the canvas, in canvas pixels */
  private point({ clientX, clientY }: Touch): fabric.Point {
    const { canvas } = this;
    const box = canvas.upperCanvasEl.getBoundingClientRect();
    const [sx, sy] = [
      box.width ? canvas.getWidth() / box.width : 1,
      box.height ? canvas.getHeight() / box.height : 1,
    ];
    return new fabric.Point((clientX - box.left) * sx, (clientY - box.top) * sy);
  }
}
