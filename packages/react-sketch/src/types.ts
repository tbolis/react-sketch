import * as CSS from "csstype";

/**
 * Enumeration which declares the various tools available for
 * SketchField
 */
export enum Tool {
  CIRCLE = "circle",
  LINE = "line",
  ARROW = "arrow",
  PENCIL = "pencil",
  RECTANGLE = "rectangle",
  RECTANGLE_LABEL = "rectangle-label",
  POLYGON = "polygon",
  SELECT = "select",
  PAN = "pan",
  HIGHLIGHTER = "highlighter",
  ERASER = "eraser",
  LASER_POINTER = "laser-pointer",
  DEFAULT_TOOL = "default-tool",
}

/**
 * The tools by their legacy (0.5.x) names, as in
 * `import { Tools } from "react-sketch"`. The values are the ones of {@link Tool}.
 */
export const Tools = {
  Select: Tool.SELECT,
  Pencil: Tool.PENCIL,
  Line: Tool.LINE,
  Arrow: Tool.ARROW,
  Rectangle: Tool.RECTANGLE,
  RectangleLabel: Tool.RECTANGLE_LABEL,
  Polygon: Tool.POLYGON,
  Circle: Tool.CIRCLE,
  Pan: Tool.PAN,
  DefaultTool: Tool.DEFAULT_TOOL,
  Highlighter: Tool.HIGHLIGHTER,
  Eraser: Tool.ERASER,
  LaserPointer: Tool.LASER_POINTER,
} as const;

/**
 * An object of the sketch, as seen by the event callbacks. This is the
 * canvas (fabric) object, with the properties which are the same in every
 * version of the underlying library.
 */
export interface SketchObject {
  /** Kind of the object, for example "rect", "line", "path", "i-text" */
  type?: string;
  /** Any other property of the object, including custom ones set by the application */
  [property: string]: unknown;
}

/**
 * The view of the canvas: how much it is zoomed (1 is the whole canvas), and
 * where the origin of the canvas is, in pixels
 */
export interface SketchView {
  zoom: number;
  x: number;
  y: number;
}

/**
 * Event passed to the object and mouse callbacks of {@link SketchProperties}
 */
export interface SketchEvent {
  /** The original DOM event, when the event was triggered by the user */
  e?: Event;
  /** The object the event is about (object events only) */
  target?: SketchObject;
  /** Any other property of the canvas event */
  [property: string]: unknown;
}

/**
 * Content of a sketch, as returned by `toJSON` and accepted by `value`,
 * `defaultValue` and `fromJSON`: an object, or the same object as JSON string.
 */
export type SketchValue = object | string;

/**
 * Content of a sketch as returned by `toJSON` and `clear`
 */
export type SketchData = Record<string, unknown>;

/**
 * Options of `toDataURL`
 */
export interface DataUrlOptions {
  /** Format of the image, "png" or "jpeg". Defaults to the `imageFormat` property, then "png" */
  format?: string;
  /** Quality level (0..1). Only used for jpeg. Defaults to 1 */
  quality?: number;
  /** Multiplier to scale by. Defaults to 1 */
  multiplier?: number;
  /** Cropping left offset */
  left?: number;
  /** Cropping top offset */
  top?: number;
  /** Cropping width */
  width?: number;
  /** Cropping height */
  height?: number;
}

/**
 * Options of `addImg`
 */
export interface ImageOptions {
  /** Distance from the left of the canvas. Defaults to a random position */
  left?: number;
  /** Distance from the top of the canvas. Defaults to a random position */
  top?: number;
  /** Initial scale of the image. Defaults to 0.5 */
  scale?: number;
  /**
   * How the image is requested: with "anonymous" or "use-credentials" the server
   * must send CORS headers, and the canvas can be exported afterwards. Without it
   * the image is requested as before, and a cross-origin image taints the canvas
   * (`toDataURL` throws)
   */
  crossOrigin?: "anonymous" | "use-credentials" | null;
}

/**
 * Options of `setBackgroundFromDataUrl` and `setOverlayFromDataUrl`
 */
export interface BackgroundOptions {
  /**
   * How the image is requested. Defaults to "anonymous", so the canvas can be
   * exported. Use null for a server without CORS headers: the image is shown,
   * and a cross-origin image taints the canvas (`toDataURL` throws)
   */
  crossOrigin?: "anonymous" | "use-credentials" | null;
  /** Scale the image to the width and the height of the canvas */
  stretched?: boolean;
  /** Scale the image to the width of the canvas */
  stretchedX?: boolean;
  /** Scale the image to the height of the canvas */
  stretchedY?: boolean;
  /** Any other option is passed to the canvas as an image option, for example `opacity` */
  [option: string]: unknown;
}

/**
 * Options of `addText`: the options of a canvas text object, for example
 * `fontSize`, `fill`, `left`, `top`
 */
export type TextOptions = Record<string, unknown>;

/**
 * How a line is drawn: unbroken, in dashes, in dots, or in dashes and dots.
 * The lengths follow `lineWidth`.
 */
export type LineStyle = "solid" | "dashed" | "dotted" | "dash-dot";

/**
 * Properties of the SketchField component
 */
export interface SketchProperties {
  /**
   * The tool to use. See {@link Tool} (or `Tools`). Defaults to "select"
   * (the objects can be moved, nothing is drawn), which is what the
   * component did when no tool was given.
   */
  tool?: Tool | string;
  /** The color of the line. Defaults to "black" */
  lineColor?: string;
  /** The width of the line. Defaults to 10 */
  lineWidth?: number;
  /**
   * The style of the line, see {@link LineStyle}. Defaults to "solid". The
   * pencil, line, arrow (its shaft), rectangle, rectangle label, circle and
   * polygon draw it, the highlighter, eraser and laser pointer do not.
   */
  lineStyle?: LineStyle;
  /** The fill color of the shape when applicable. Defaults to "transparent" */
  fillColor?: string;
  /** The background color of the sketch, in rgba or hex format. Defaults to "transparent" */
  backgroundColor?: string;
  /**
   * URL or data URL of the background image. It is set when the component
   * mounts and when it changes, and removed when it is gone. It takes the place
   * of the background image of `value` and `defaultValue`
   */
  backgroundImage?: string;
  /** Options of `backgroundImage`, the ones of `setBackgroundFromDataUrl` */
  backgroundImageOptions?: BackgroundOptions;
  /** The opacity of the object. Accepted for compatibility, it is not applied (as in 0.5.x). Defaults to 1.0 */
  opacity?: number;
  /** Number of undo/redo steps to maintain, read when the component mounts. Defaults to 25 */
  undoSteps?: number;
  /** Image format used by `toDataURL` when it is not given in its options, "png" or "jpeg" */
  imageFormat?: string;
  /**
   * Sketch data for controlling the sketch from outside the component. It is
   * loaded again when it changes (or on every update when `forceValue` is set)
   */
  value?: SketchValue;
  /** Set to true to load the given `value` on every update, even when it did not change. Defaults to false */
  forceValue?: boolean;
  /** Initial value of the sketch, loaded when the component mounts */
  defaultValue?: SketchValue;
  /** Correction in pixels subtracted from the width of the container when the canvas is resized. Defaults to 0 */
  widthCorrection?: number;
  /** Correction in pixels subtracted from the height of the container when the canvas is resized. Defaults to 0 */
  heightCorrection?: number;
  /**
   * Resize the canvas, and scale its objects, when the window is resized.
   * The canvas is always fitted to its container when the component mounts
   * and when `width` or `height` change. Defaults to true
   */
  autoresize?: boolean;
  /**
   * Zoom and pan the view of the canvas with two fingers, on a touch screen. The
   * objects stay where they are, so the view is not saved nor undone, and it is
   * not in the image of `toDataURL`. Defaults to true
   */
  pinchZoom?: boolean;
  /** The smallest zoom of the view, with 1 being the whole canvas. Defaults to 0.5 */
  minZoom?: number;
  /** The largest zoom of the view. Defaults to 8 */
  maxZoom?: number;
  /** Called each time the view changes, by the fingers or by `resetView()` */
  onViewChange?: (view: SketchView) => void;
  /** Width of the sketch container, in pixels */
  width?: number;
  /** Height of the sketch container, in pixels. Defaults to 512 */
  height?: number;
  /** Class name of the container div of the canvas */
  className?: string;
  /** Style of the container div of the canvas */
  style?: CSS.Properties;
  /**
   * Called after a drawing was finished (mouse up, mouse out) and after undo, redo and
   * loading a value. The argument is the DOM event of the former, nothing in the latter
   */
  onChange?: (event?: Event) => void;
  /** Called when an object is added by the user, not when undo or redo add it back */
  onObjectAdded?: (event: SketchEvent) => void;
  /** Called when an object is modified by the user (moved, scaled, rotated) */
  onObjectModified?: (event: SketchEvent) => void;
  /** Called when an object is removed from the sketch */
  onObjectRemoved?: (event: SketchEvent) => void;
  /** Called on mouse down on the canvas */
  onMouseDown?: (event: SketchEvent) => void;
  /** Called on mouse move on the canvas */
  onMouseMove?: (event: SketchEvent) => void;
  /** Called on mouse up on the canvas */
  onMouseUp?: (event: SketchEvent) => void;
  /** Called when the mouse leaves the canvas */
  onMouseOut?: (event: SketchEvent) => void;
  /** Called while an object is moved */
  onObjectMoving?: (event: SketchEvent) => void;
  /** Called while an object is scaled */
  onObjectScaling?: (event: SketchEvent) => void;
  /** Called while an object is rotated */
  onObjectRotating?: (event: SketchEvent) => void;
}
