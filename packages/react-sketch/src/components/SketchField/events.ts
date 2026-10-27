import type { FabricObject, TPointerEvent } from "fabric";
import { SketchEvent, SketchProperties } from "../../types";
import { SketchHistory } from "./history/SketchHistory";
import { AbstractEventAware, CanvasEventAware, FabricCanvasTool } from "./tools";

/**
 * The part of a canvas event the sketch looks at. Mouse events have both
 * properties, object events have a target, and some have the DOM event too.
 */
export interface CanvasEvent {
  e?: TPointerEvent;
  target?: FabricObject;
}

export interface EventInput {
  event: CanvasEvent;
  tool: FabricCanvasTool;
  props: SketchProperties;
}

/**
 * The canvas events a tool can react to, plus the ones of the sketch itself
 */
export interface SketchEventAware extends CanvasEventAware {
  // Object management
  onObjectAdded(input: EventInput): void;
}

/**
 * The event as given to the callbacks of the component. The canvas event has
 * the same shape, but its types come from the canvas library, which the
 * component does not expose.
 */
const sketchEvent = (event: CanvasEvent): SketchEvent =>
  event as unknown as SketchEvent;

/**
 * Canvas Events Manager Class
 *
 * It hands the canvas events to the selected tool, to the history of the
 * sketch and to the callbacks given as properties of the component.
 */
export class FabricCanvasEventsManager
  extends AbstractEventAware
  implements SketchEventAware
{
  private readonly history: SketchHistory;
  private readonly schedule: (callback: () => void, delay: number) => void;

  /**
   * @param history the history of the sketch
   * @param schedule runs the callback after the delay (in milliseconds)
   */
  constructor(
    history: SketchHistory,
    schedule: (callback: () => void, delay: number) => void
  ) {
    super();
    this.history = history;
    this.schedule = schedule;
  }

  /**
   * Action when an object is added to the canvas. The objects which undo and
   * redo add back are not new, so they are not recorded nor announced.
   */
  public onObjectAdded({ event, props }: EventInput): void {
    // Only erasable objects are affected by the eraser
    if (event.target) (event.target as { erasable?: boolean }).erasable = true;
    if (this.history.replaying) return;
    if (event.target) this.history.onObjectAdded(event.target);
    props.onObjectAdded?.(sketchEvent(event));
  }

  public onObjectModified({ event, props }: EventInput): void {
    if (event.target) this.history.onObjectModified(event.target);
    props.onObjectModified?.(sketchEvent(event));
  }

  public onObjectRemoved({ event, props }: EventInput): void {
    props.onObjectRemoved?.(sketchEvent(event));
  }

  public onObjectMoving({ event, props }: EventInput): void {
    props.onObjectMoving?.(sketchEvent(event));
  }

  public onObjectScaling({ event, props }: EventInput): void {
    props.onObjectScaling?.(sketchEvent(event));
  }

  public onObjectRotating({ event, props }: EventInput): void {
    props.onObjectRotating?.(sketchEvent(event));
  }

  public onMouseDown({ event, tool, props }: EventInput): void {
    tool.doMouseDown(event);
    props.onMouseDown?.(sketchEvent(event));
  }

  public onMouseMove({ event, tool, props }: EventInput): void {
    tool.doMouseMove(event);
    props.onMouseMove?.(sketchEvent(event));
  }

  public onMouseOut({ event, tool, props }: EventInput): void {
    tool.doMouseOut(event);
    this.notifyChange({ event, tool, props });
    props.onMouseOut?.(sketchEvent(event));
  }

  public onMouseUp({ event, tool, props }: EventInput): void {
    tool.doMouseUp(event);
    // The drawing is finished, so the state of the new object is final
    this.history.onMouseUp();
    this.notifyChange({ event, tool, props });
    props.onMouseUp?.(sketchEvent(event));
  }

  /**
   * Tell the application that the sketch may have changed, shortly after
   * the mouse was released or left the canvas.
   */
  private notifyChange({ event, props }: EventInput): void {
    const { onChange } = props;
    if (onChange) this.schedule(() => onChange(event.e), 10);
  }
}
