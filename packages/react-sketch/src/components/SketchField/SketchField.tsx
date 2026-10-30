import * as React from "react";
import { PureComponent } from "react";
import * as fabric from "fabric";
import {
  BackgroundOptions,
  DataUrlOptions,
  ImageOptions,
  SketchData,
  SketchProperties,
  SketchValue,
  TextOptions,
  Tool,
} from "../../types";
import { CanvasEvent, FabricCanvasEventsManager, SketchEventAware } from "./events";
import { SketchHistory } from "./history/SketchHistory";
import { autoresize, scaleContent } from "./resize";
import { FabricCanvasTool } from "./tools";
import { create_tool } from "./tools/factory";
import { Eraser } from "./tools/Eraser";
import { Polygon } from "./tools/Polygon";

/**
 * The properties which always have a value, because SketchField provides
 * a default for them
 */
type DefaultedProps = Required<
  Pick<
    SketchProperties,
    | "tool"
    | "lineColor"
    | "lineWidth"
    | "fillColor"
    | "backgroundColor"
    | "opacity"
    | "undoSteps"
    | "widthCorrection"
    | "heightCorrection"
    | "forceValue"
    | "autoresize"
    | "onObjectAdded"
    | "onObjectModified"
    | "onObjectRemoved"
    | "onMouseDown"
    | "onMouseMove"
    | "onMouseUp"
    | "onMouseOut"
    | "onObjectMoving"
    | "onObjectScaling"
    | "onObjectRotating"
  >
>;

const defaultProps: DefaultedProps = {
  tool: Tool.SELECT,
  lineColor: "black",
  lineWidth: 10,
  fillColor: "transparent",
  backgroundColor: "transparent",
  opacity: 1.0,
  undoSteps: 25,
  widthCorrection: 0,
  heightCorrection: 0,
  forceValue: false,
  autoresize: true,
  onObjectAdded: () => undefined,
  onObjectModified: () => undefined,
  onObjectRemoved: () => undefined,
  onMouseDown: () => undefined,
  onMouseMove: () => undefined,
  onMouseUp: () => undefined,
  onMouseOut: () => undefined,
  onObjectMoving: () => undefined,
  onObjectScaling: () => undefined,
  onObjectRotating: () => undefined,
};

/**
 * The canvas of the sketch. Clearing it (also when a value is loaded) does not
 * announce the discarded objects as removed, as it never did: the removal of
 * an object is something the user does.
 */
class SketchCanvas extends fabric.Canvas {
  clearing = false;
  /** Called after the canvas is cleared, also when a value is loaded, before its objects are added */
  onClear?: () => void;

  clear(): void {
    this.clearing = true;
    try {
      super.clear();
    } finally {
      this.clearing = false;
    }
    this.onClear?.();
  }
}

/**
 * The two layers of the canvas which hold an image: the background image is
 * drawn under the objects, the overlay image above them
 */
type ImageLayer = "backgroundImage" | "overlayImage";

/**
 * Whether two option objects have the same content, so that options written
 * inline in a render do not count as a change
 */
const sameOptions = (
  a: BackgroundOptions = {},
  b: BackgroundOptions = {}
): boolean => {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
  );
};

/**
 * Sketch Tool based on FabricJS for React Applications
 *
 * The methods of the component (undo, redo, toJSON, ...) are available
 * through a ref, from the moment the component is mounted.
 */
class SketchField extends PureComponent<SketchProperties & DefaultedProps> {
  static defaultProps = defaultProps;

  private canvas!: SketchCanvas;
  private tool!: FabricCanvasTool;
  private history!: SketchHistory;
  private mounted = false;
  /** Counts the images asked for by layer, so that only the last one of a layer is set */
  private readonly imageLoads: Record<ImageLayer, number> = {
    backgroundImage: 0,
    overlayImage: 0,
  };
  private clipboard: Promise<fabric.FabricObject> | null = null;
  /** The pastes, which run one after the other as cloning is asynchronous */
  private pasting: Promise<unknown> = Promise.resolve();
  /** The load of a value which is running. A newer value cancels it, as the one which ends last would win */
  private loading: AbortController | null = null;
  private readonly timers = new Set<number>();
  private readonly canvasEl = React.createRef<HTMLCanvasElement>();
  private readonly containerEl = React.createRef<HTMLDivElement>();

  /**
   * Listener function for the resize of canvas and objects
   */
  private readonly _resize_listener = (): void => {
    if (this.props.autoresize) this.resize();
  };

  /**
   * Run the callback after the delay, unless the component is unmounted
   * in the meantime
   */
  private readonly schedule = (callback: () => void, delay: number): void => {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);
    this.timers.add(id);
  };

  /**
   * Whether the canvas is the one of the mounted component. It is not when a
   * callback of the canvas runs after the component was unmounted.
   */
  private isCurrent(canvas: SketchCanvas): boolean {
    return this.mounted && this.canvas === canvas;
  }

  /**
   * Bind Canvas events with Component
   */
  private _bind_canvas_events(eventAware: SketchEventAware): void {
    const events: Record<string, keyof SketchEventAware> = {
      "mouse:up": "onMouseUp",
      "mouse:down": "onMouseDown",
      "mouse:move": "onMouseMove",
      "mouse:out": "onMouseOut",
      "object:added": "onObjectAdded",
      "object:moved": "onObjectMoved",
      "object:moving": "onObjectMoving",
      "object:modified": "onObjectModified",
      "object:removed": "onObjectRemoved",
      "object:scaling": "onObjectScaling",
      "object:rotating": "onObjectRotating",
      "text:event:changed": "onTextChanged",
      "text:editing:exited": "onTextEditingExited",
      "text:editing:entered": "onTextEditingEntered",
      "text:selection:changed": "onTextSelectionChanged",
    };
    // The canvas types its events by name, which is not known here
    const canvas = this.canvas as unknown as fabric.Observable<
      Record<string, CanvasEvent>
    >;
    Object.entries(events).forEach(([name, handler]) => {
      canvas.on(name, (event) => {
        // Fabric 7 announces each object of a cleared canvas, fabric 4 did not
        if (name === "object:removed" && this.canvas.clearing) return;
        eventAware[handler]({ event, tool: this.tool, props: this.props });
      });
    });
  }

  componentDidMount(): void {
    const { backgroundColor, backgroundImage, undoSteps, value, defaultValue } =
      this.props;

    this.mounted = true;
    // The defaults of fabric 7 that differ from the ones of fabric 4 are set back:
    // right and middle clicks do not draw, there is no context menu override,
    // and a selected object is drawn on top of the others only while selected
    this.canvas = new SketchCanvas(this.canvasEl.current as HTMLCanvasElement, {
      fireRightClick: false,
      fireMiddleClick: false,
      stopContextMenu: false,
      preserveObjectStacking: false,
    });
    this.selectTool();
    this.setBackground(backgroundColor);

    // Initialize History, with maximum number of undo steps
    this.history = new SketchHistory(this.canvas, undoSteps);
    // Loading a value clears the canvas first: the history starts again with the
    // loaded objects, and only when the load works
    this.canvas.onClear = () => {
      this.history.clear();
      this.tool.reset();
    };

    // Bind Events to Actions
    this._bind_canvas_events(
      new FabricCanvasEventsManager(this.history, this.schedule)
    );

    window.addEventListener("resize", this._resize_listener);
    this.resize();

    // initialize canvas with controlled value if exists
    this.fromJSON(value || defaultValue);
    if (backgroundImage) this.applyBackgroundImage();
  }

  componentDidUpdate(prevProps: Readonly<SketchProperties>): void {
    const props = this.props;

    if (props.width !== prevProps.width || props.height !== prevProps.height) {
      this.resize();
    }

    if (props.tool !== prevProps.tool) {
      this.selectTool();
    } else if (
      props.lineColor !== prevProps.lineColor ||
      props.lineWidth !== prevProps.lineWidth ||
      props.lineStyle !== prevProps.lineStyle ||
      props.fillColor !== prevProps.fillColor
    ) {
      this.configureTool();
    }

    if (props.backgroundColor !== prevProps.backgroundColor) {
      this.setBackground(props.backgroundColor);
    }

    if (
      props.backgroundImage !== prevProps.backgroundImage ||
      (props.backgroundImage &&
        !sameOptions(props.backgroundImageOptions, prevProps.backgroundImageOptions))
    ) {
      this.applyBackgroundImage();
    }

    if (props.value !== prevProps.value || (props.value && props.forceValue)) {
      this.fromJSON(props.value);
    }
  }

  componentWillUnmount(): void {
    this.mounted = false;
    this.loading?.abort();
    window.removeEventListener("resize", this._resize_listener);
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
    this.tool.dispose();
    // The canvas element is released at once, so it can be used again (React
    // strict mode mounts twice). The rest is freed once the pending render is done.
    void this.canvas.dispose();
  }

  /**
   * Run the function with the properties of the component. The Highlighter
   * throws for a line color it cannot convert (for example "rgb(0, 0, 0)" or
   * "transparent"), so in that case the function runs again with the default
   * line color instead of breaking the component.
   */
  private withToolProps(run: (props: SketchProperties) => void): void {
    // The tool used to default to null, which meant no tool at all: the
    // objects can be moved, nothing is drawn. That is what "select" does.
    const props = { ...this.props, tool: this.props.tool ?? Tool.SELECT };
    try {
      run(props);
    } catch {
      run({ ...props, lineColor: undefined });
    }
  }

  /**
   * Use the tool of the properties, from now on
   */
  private selectTool(): void {
    this.tool?.finish();
    this.tool?.dispose();
    this.withToolProps((props) => {
      this.tool = create_tool(this.canvas, props);
      if (this.tool instanceof Polygon) {
        this.tool.onComplete = () => {
          if (this.mounted) this.props.onChange?.();
        };
      }
      if (this.tool instanceof Eraser) {
        this.tool.onErase = (erasures) => {
          if (!this.mounted) return;
          this.history.onErased(erasures);
          this.props.onChange?.();
        };
      }
    });
  }

  /**
   * Apply the line and fill properties to the tool in use
   */
  private configureTool(): void {
    this.withToolProps((props) => this.tool.configureCanvas(props));
  }

  /**
   * Fit the canvas to its container
   */
  private resize(): void {
    const container = this.containerEl.current;
    if (!container) return;
    const { widthCorrection, heightCorrection } = this.props;
    const factors = autoresize(
      this.canvas,
      container,
      widthCorrection,
      heightCorrection
    );
    if (factors) this.tool.scale(factors.x, factors.y);
  }

  /**
   * Sets the background color for this sketch
   *
   * @param color in rgba or hex format
   */
  private setBackground(color?: string): void {
    if (!color) return;
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
  }

  /**
   * Enable touch Scrolling on Canvas
   */
  enableTouchScroll = (): void => {
    this.setTouchScrolling(true);
  };

  /**
   * Disable touch Scrolling on Canvas
   */
  disableTouchScroll = (): void => {
    this.setTouchScrolling(false);
  };

  /**
   * Switch the touch scrolling of the canvas. fabric reads allowTouchScrolling
   * only when it creates the canvas elements, so the touch-action style that
   * lets the browser scroll is set here too, with the values fabric uses.
   */
  private setTouchScrolling(allow: boolean): void {
    const canvas = this.canvas;
    canvas.allowTouchScrolling = allow;
    const touchAction = allow ? "manipulation" : "none";
    canvas.upperCanvasEl.style.touchAction = touchAction;
    canvas.lowerCanvasEl.style.touchAction = touchAction;
  }

  /**
   * Add an image as object to the canvas
   *
   * @param dataUrl the image url or Data Url
   * @param options object to pass and change some options when loading image, the format of the object is:
   *
   * {
   *   left: <Number: distance from left of canvas>,
   *   top: <Number: distance from top of canvas>,
   *   scale: <Number: initial scale of image>
   *   crossOrigin: <"anonymous" | "use-credentials": request the image with CORS, so the canvas can be exported>
   * }
   */
  addImg = (dataUrl: string, options: ImageOptions = {}): void => {
    const canvas = this.canvas;
    const { crossOrigin, ...placement } = options;
    fabric.FabricImage.fromURL(dataUrl, crossOrigin ? { crossOrigin } : {}, {
      originX: "left",
      originY: "top",
    })
      .then((image) => {
        if (!this.isCurrent(canvas)) return;
        const { left, top, scale } = {
          left: Math.random() * (canvas.getWidth() - (image.width ?? 0) * 0.5),
          top: Math.random() * (canvas.getHeight() - (image.height ?? 0) * 0.5),
          scale: 0.5,
          ...placement,
        };
        image.scale(scale);
        image.set({ left, top });
        canvas.add(image);
      })
      // An image which cannot be loaded is not added
      .catch(() => undefined);
  };

  /**
   * Zoom the drawing by the factor specified
   *
   * The zoom factor is a percentage with regards the original, for example if factor is set to 2
   * it will double the size whereas if it is set to 0.5 it will half the size
   *
   * @param factor the zoom factor
   */
  zoom = (factor: number): void => {
    scaleContent(this.canvas, factor, factor);
    this.tool.scale(factor, factor);
    this.canvas.renderAll();
    this.canvas.calcOffset();
  };

  /**
   * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
   */
  undo = (): void => {
    if (this.history.undo()) {
      this.tool.reset();
      this.props.onChange?.();
    }
  };

  /**
   * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
   */
  redo = (): void => {
    if (this.history.redo()) {
      this.tool.reset();
      this.props.onChange?.();
    }
  };

  /**
   * Delegation method to check if we can perform an undo Operation, useful to disable/enable possible buttons
   *
   * @returns true if we can undo otherwise false
   */
  canUndo = (): boolean => this.history.canUndo();

  /**
   * Delegation method to check if we can perform a redo Operation, useful to disable/enable possible buttons
   *
   * @returns true if we can redo otherwise false
   */
  canRedo = (): boolean => this.history.canRedo();

  /**
   * Exports canvas element to a dataurl image. Note that when multiplier is used, cropping is scaled appropriately
   *
   * Available Options are
   * <table style="width:100%">
   *
   * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Argument</b></td><td><b>Default</b></td><td><b>Description</b></td></tr>
   * <tr><td>format</td> <td>String</td> <td><optional></td><td>the imageFormat property, then png</td><td>The format of the output image. Either "jpeg" or "png"</td></tr>
   * <tr><td>quality</td><td>Number</td><td><optional></td><td>1</td><td>Quality level (0..1). Only used for jpeg.</td></tr>
   * <tr><td>multiplier</td><td>Number</td><td><optional></td><td>1</td><td>Multiplier to scale by</td></tr>
   * <tr><td>left</td><td>Number</td><td><optional></td><td></td><td>Cropping left offset. Introduced in v1.2.14</td></tr>
   * <tr><td>top</td><td>Number</td><td><optional></td><td></td><td>Cropping top offset. Introduced in v1.2.14</td></tr>
   * <tr><td>width</td><td>Number</td><td><optional></td><td></td><td>Cropping width. Introduced in v1.2.14</td></tr>
   * <tr><td>height</td><td>Number</td><td><optional></td><td></td><td>Cropping height. Introduced in v1.2.14</td></tr>
   *
   * </table>
   *
   * @returns URL containing a representation of the object in the format specified by options.format
   */
  toDataURL = (options?: DataUrlOptions): string =>
    this.canvas.toDataURL({
      format: this.props.imageFormat,
      ...options,
    } as fabric.TDataUrlOptions);

  /**
   * Returns JSON representation of canvas
   *
   * @param propertiesToInclude Array <optional> Any properties that you might want to additionally include in the output
   * @returns the canvas as a JSON ready object
   */
  toJSON = (propertiesToInclude?: string[]): SketchData =>
    this.canvas.toObject(propertiesToInclude);

  /**
   * Populates canvas with data from the specified JSON.
   *
   * The canvas is populated a moment later, not right away. The history is
   * reset, as the objects it knows are replaced.
   *
   * The JSON is what `toJSON` returns. The JSON of 0.5.x (fabric 4) is loaded too.
   *
   * @param json JSON string or object
   */
  fromJSON = (json?: SketchValue): void => {
    if (!json) return;
    const canvas = this.canvas;
    this.schedule(() => {
      this.loading?.abort();
      const loading = (this.loading = new AbortController());
      // fabric turns the rendering of added objects off while it loads, and on
      // again only when the load works
      const { renderOnAddRemove } = canvas;
      // A value which is not valid JSON throws at once, so it is made a rejection too
      new Promise((resolve) =>
        resolve(canvas.loadFromJSON(json, undefined, { signal: loading.signal }))
      )
        .then(() => {
          if (!this.isCurrent(canvas)) return;
          // Loading a value drops the background color unless the value has one
          if (!canvas.backgroundColor)
            this.setBackground(this.props.backgroundColor);
          // The loaded objects follow the tool in use, for example they can't be
          // selected when drawing
          this.configureTool();
          // The property takes the place of the background image of the value
          if (this.props.backgroundImage) this.applyBackgroundImage();
          canvas.renderAll();
          this.props.onChange?.();
        })
        .catch((error: unknown) => {
          canvas.renderOnAddRemove = renderOnAddRemove;
          // A load which a newer value cancelled is not an error. Any other is
          // not hidden: it is thrown outside the promise, as an uncaught error,
          // and the canvas keeps what it had.
          if (!loading.signal.aborted) {
            window.setTimeout(() => {
              throw error;
            });
          }
        });
    }, 100);
  };

  /**
   * Clear the content of the canvas, this will also clear history but will return the canvas content as JSON to be
   * used as needed in order to undo the clear if possible
   *
   * @param propertiesToInclude Array <optional> Any properties that you might want to additionally include in the output
   * @returns JSON object of the canvas just cleared
   */
  clear = (propertiesToInclude?: string[]): SketchData => {
    const discarded = this.toJSON(propertiesToInclude);
    this.canvas.clear();
    // Clearing a canvas drops its background color
    this.setBackground(this.props.backgroundColor);
    return discarded;
  };

  hasSelection = (): boolean => !!this.canvas.getActiveObject();

  clearSelection = (): void => {
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  };

  /**
   * Remove selected object from the canvas
   */
  removeSelected = (): void => {
    const canvas = this.canvas;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;
    const selected =
      activeObj instanceof fabric.ActiveSelection
        ? activeObj.getObjects()
        : [activeObj];
    // Leaving the selection first gives the objects back their own position
    canvas.discardActiveObject();
    this.history.remove(selected);
    canvas.requestRenderAll();
  };

  /**
   * Copy the selected object, nothing happens when there is no selection
   */
  copy = (): void => {
    // The copy is made right away, so it is the object as it is now
    const copy = this.canvas.getActiveObject()?.clone();
    if (copy) this.clipboard = copy;
  };

  /**
   * Paste the copied object, a bit further down and to the right of the
   * previous one. Nothing happens when nothing was copied.
   */
  paste = (): void => {
    const canvas = this.canvas;
    const clipboard = this.clipboard;
    if (!clipboard) return;
    this.pasting = this.pasting
      .then(async () => {
        const copied = await clipboard;
        // clone again, so you can do multiple copies.
        const clonedObj = await copied.clone();
        if (!this.isCurrent(canvas)) return;
        canvas.discardActiveObject();
        clonedObj.set({
          left: (clonedObj.left ?? 0) + 10,
          top: (clonedObj.top ?? 0) + 10,
          evented: true,
        });
        if (clonedObj instanceof fabric.ActiveSelection) {
          // active selection needs a reference to the canvas.
          clonedObj.canvas = canvas;
          clonedObj.forEachObject((obj) => canvas.add(obj));
          clonedObj.setCoords();
        } else {
          canvas.add(clonedObj);
        }
        copied.top = (copied.top ?? 0) + 10;
        copied.left = (copied.left ?? 0) + 10;
        canvas.setActiveObject(clonedObj);
        canvas.requestRenderAll();
      })
      // A paste which fails must not stop the next ones
      .catch(() => undefined);
  };

  /**
   * Sets an image on a layer of the canvas, in place of the one it has, and
   * fits it as the options say. Only the last image asked for a layer is set,
   * also when an earlier one loads later.
   */
  private setImageLayer(
    layer: ImageLayer,
    dataUrl: string,
    options: BackgroundOptions
  ): void {
    const canvas = this.canvas;
    const load = ++this.imageLoads[layer];
    const {
      stretched,
      stretchedX,
      stretchedY,
      crossOrigin = "anonymous",
      ...imageOptions
    } = options;
    const img = new Image();
    if (crossOrigin) img.setAttribute("crossOrigin", crossOrigin);
    img.onload = () => {
      if (!this.isCurrent(canvas) || load !== this.imageLoads[layer]) return;
      const imgObj = new fabric.FabricImage(img, {
        originX: "left",
        originY: "top",
      });
      if (stretched || (stretchedX && stretchedY)) {
        // scaleToWidth and scaleToHeight keep the proportions of the image, so
        // the second would undo the first
        imgObj.set({
          scaleX: canvas.getWidth() / imgObj.width,
          scaleY: canvas.getHeight() / imgObj.height,
        });
      } else if (stretchedX) {
        imgObj.scaleToWidth(canvas.getWidth());
      } else if (stretchedY) {
        imgObj.scaleToHeight(canvas.getHeight());
      }
      imgObj.set(imageOptions);
      canvas[layer] = imgObj;
      canvas.requestRenderAll();
    };
    img.src = dataUrl;
  }

  /**
   * Removes the image of a layer, also one that is still loading. The objects
   * and the other layers are kept.
   */
  private removeImageLayer(layer: ImageLayer): void {
    this.imageLoads[layer]++;
    this.canvas[layer] = undefined;
    this.canvas.requestRenderAll();
  }

  /**
   * Sets the background from the dataUrl given
   *
   * @param dataUrl the dataUrl to be used as a background
   * @param options stretched, stretchedX and stretchedY scale the image to the canvas, crossOrigin
   * says how the image is requested (anonymous by default), the other options are options of the image
   */
  setBackgroundFromDataUrl = (
    dataUrl: string,
    options: BackgroundOptions = {}
  ): void => this.setImageLayer("backgroundImage", dataUrl, options);

  /**
   * Sets the overlay image from the dataUrl given. The overlay image is drawn above the
   * objects and does not take mouse events, so it can be an outline to draw within. It is
   * saved by `toJSON` and in the image of `toDataURL`, and it is not part of the undo history.
   *
   * @param dataUrl the dataUrl to be used as an overlay
   * @param options the options of `setBackgroundFromDataUrl`
   */
  setOverlayFromDataUrl = (dataUrl: string, options: BackgroundOptions = {}): void =>
    this.setImageLayer("overlayImage", dataUrl, options);

  /**
   * Removes the background image, also one that is still loading. The objects,
   * the overlay image and the background color are kept, and the undo history is
   * not changed (setting the background image is not part of it either).
   */
  removeBackgroundImage = (): void => this.removeImageLayer("backgroundImage");

  /**
   * Removes the overlay image, also one that is still loading. The objects, the
   * background image and the background color are kept.
   */
  removeOverlayImage = (): void => this.removeImageLayer("overlayImage");

  /**
   * Set the image of the `backgroundImage` property, or remove the image when it is gone
   */
  private applyBackgroundImage(): void {
    const { backgroundImage, backgroundImageOptions } = this.props;
    if (backgroundImage) {
      this.setBackgroundFromDataUrl(backgroundImage, backgroundImageOptions);
    } else {
      this.removeBackgroundImage();
    }
  }

  /**
   * Add a text to the center of the canvas
   *
   * @param text the text
   * @param options options of the text, for example fontSize, fill, left and top.
   * The text is centered unless left or top are given.
   */
  addText = (text: string, options: TextOptions = {}): void => {
    const canvas = this.canvas;
    const iText = new fabric.IText(text, {
      originX: "left",
      originY: "top",
      ...options,
    } as Partial<fabric.ITextProps>);
    if (options.left === undefined) {
      iText.set("left", (canvas.getWidth() - (iText.width ?? 0)) * 0.5);
    }
    if (options.top === undefined) {
      iText.set("top", (canvas.getHeight() - (iText.height ?? 0)) * 0.5);
    }
    canvas.add(iText);
  };

  render(): React.ReactElement {
    const { className, style, width, height } = this.props;
    const canvasDivStyle = {
      ...style,
      ...(width ? { width } : {}),
      height: height || 512,
    };
    return (
      <div className={className} style={canvasDivStyle} ref={this.containerEl}>
        <canvas ref={this.canvasEl}>
          Sorry, Canvas HTML5 element is not supported by your browser :(
        </canvas>
      </div>
    );
  }
}

export default SketchField;
