import type * as fabric from "fabric";

/**
 * Tells what kind of pointer is on the page, and how hard it presses. The canvas reads
 * the mouse and the touches, which do not carry the pressure, and the pointer events do:
 * they come before the mouse and the touch events of the same input, so the last one is
 * the one of the stroke the canvas is about to draw. The canvas keeps listening to the
 * mouse and the touches, as the pinch zoom is made of them.
 */
export class PenSensor {
  /** The type of the last pointer which pressed or moved: "mouse", "touch" or "pen" */
  type = "mouse";
  /** How hard it pressed, from 0 to 1 */
  pressure = 0;
  private listening = false;

  constructor(private readonly doc: Document) {}

  /** Whether the last pointer was a pen */
  get pen(): boolean {
    return this.type === "pen";
  }

  /** Start or stop listening to the pointers of the page */
  listen(on: boolean): void {
    if (on === this.listening) return;
    this.listening = on;
    const toggle = on ? "addEventListener" : "removeEventListener";
    // The capture phase comes before the listeners of the canvas, and nothing is prevented
    this.doc[toggle]("pointerdown", this.onPointer, {
      capture: true,
      passive: true,
    });
    this.doc[toggle]("pointermove", this.onPointer, {
      capture: true,
      passive: true,
    });
  }

  private readonly onPointer = (event: Event): void => {
    const { pointerType, pressure } = event as PointerEvent;
    this.type = pointerType;
    this.pressure = pressure;
  };
}

/** The sensor of each canvas, made the first time it is asked for */
const sensors = new WeakMap<fabric.Canvas, PenSensor>();

export const penOf = (canvas: fabric.Canvas): PenSensor => {
  let sensor = sensors.get(canvas);
  if (!sensor) {
    sensor = new PenSensor(canvas.upperCanvasEl.ownerDocument);
    sensors.set(canvas, sensor);
  }
  return sensor;
};

/** Stop listening for the canvas, which is going away */
export const releasePen = (canvas: fabric.Canvas): void => {
  sensors.get(canvas)?.listen(false);
  sensors.delete(canvas);
};
