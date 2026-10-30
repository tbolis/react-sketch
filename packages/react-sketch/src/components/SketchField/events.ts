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
  private readonly gesturing: () => boolean;
  /**
   * Whether an object was added, modified or removed since the mouse was
   * pressed. Only then the application is told of a change, so a click which
   * selects an object, or a pointer which leaves the canvas, is not one.
   */
  private changed = false;

  /**
   * @param history the history of the sketch
   * @param schedule runs the callback after the delay (in milliseconds)
   * @param gesturing whether the fingers on the screen are a gesture of the view, which draws nothing
   */
  constructor(
    history: SketchHistory,
    schedule: (callback: () => void, delay: number) => void,
    gesturing: () => boolean = () => false
  ) {
    super();
    this.history = history;
    this.schedule = schedule;
    this.gesturing = gesturing;
  }

  /**
   * Action when an object is added to the canvas. The objects which undo and
   * redo add back are not new, so they are not recorded nor announced.
   */
  public onObjectAdded({ event, tool, props }: EventInput): void {
    if (this.isPreview(event, tool)) return;
    // Only erasable objects are affected by the eraser
    if (event.target) (event.target as { erasable?: boolean }).erasable = true;
    if (this.history.replaying) return;
    this.changed = true;
    if (event.target) this.history.onObjectAdded(event.target);
    props.onObjectAdded?.(sketchEvent(event));
  }

  public onObjectModified({ event, props }: EventInput): void {
    this.changed = true;
    if (event.target) this.history.onObjectModified(event.target);
    props.onObjectModified?.(sketchEvent(event));
  }

  public onObjectRemoved({ event, tool, props }: EventInput): void {
    if (this.isPreview(event, tool)) return;
    this.changed = true;
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
    this.changed = false;
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

  /** Whether the object of the event is one the tool only shows while it draws */
  private isPreview({ target }: CanvasEvent, tool: FabricCanvasTool): boolean {
    return !!target && tool.isPreview(target);
  }

  /**
   * Tell the application that the sketch changed, shortly after the mouse was
   * released or left the canvas. Nothing is told when it did not change, and
   * a change is told once: the release which follows a mouse out has none.
   */
  private notifyChange({ event, tool, props }: EventInput): void {
    if (!tool.notifiesChange() || this.gesturing() || !this.changed) return;
    this.changed = false;
    const { onChange } = props;
    if (onChange) this.schedule(() => onChange(event.e), 10);
  }
}
