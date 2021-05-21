import * as React from "react";
import PropTypes from "prop-types";
import { PureComponent } from "react";
import { autoresize } from "./resize";
import { fabric } from "fabric";
import { SketchProperties, SketchState } from "../../types";
import { create_tool } from "./tools/factory";
import { EventCallback, FabricCanvasEventsManager } from "./events";
import { CanvasEventAware, FabricCanvasTool } from "./tools";
import { uuid4 } from "../../utils";
import { UndoHistory } from "./history";

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends PureComponent<SketchProperties, SketchState> {
  private canvas!: fabric.Canvas | null;
  private canvasEl!: HTMLCanvasElement | null;
  private containerEl!: HTMLDivElement | null;
  private tool!: FabricCanvasTool;

  constructor(props: SketchProperties) {
    super(props);
  }

  static defaultProps: SketchProperties = {
    tool: "pencil",
    lineColor: "black",
    lineWidth: 1,
  };

  state = {
    action: true,
  };

  /**
   * Listener function for the resize of canvas and objects
   * @param event the UIEvent of resize event
   */
  private _resize_listener = (event: UIEvent): void => {
    autoresize(this.canvas, this.containerEl);
  };

  /**
   * Bind Canvas events with Component
   */
  private _bind_canvas_events(eventAware: CanvasEventAware): void {
    // Helper declaration for all canvas events
    const on = (name: string, callback: EventCallback): void => {
      this.canvas?.on(name, (event: fabric.IEvent) => {
        callback({
          event: event,
          tool: this.tool,
          props: this.props,
          state: this.state,
        });
      });
    };
    // Fabric Events
    on("mouse:up", eventAware.onMouseUp);
    on("mouse:down", eventAware.onMouseDown);
    on("mouse:move", eventAware.onMouseMove);
    on("mouse:out", eventAware.onMouseOut);
    on("object:moved", eventAware.onObjectMoved);
    on("object:moving", eventAware.onObjectMoving);
    on("object:modified", eventAware.onObjectModified);
    on("object:removed", eventAware.onObjectRemoved);
    on("object:scaling", eventAware.onObjectScaling);
    on("object:rotating", eventAware.onObjectRotating);
    on("text:event:changed", eventAware.onTextChanged);
    on("text:editing:exited", eventAware.onTextEditingExited);
    on("text:editing:entered", eventAware.onTextEditingEntered);
    on("text:selection:changed", eventAware.onTextSelectionChanged);
  }

  componentDidMount = (): void => {
    this.canvas = new fabric.Canvas(this.canvasEl);
    this.tool = create_tool(this.canvas, this.props);
    this.containerEl && autoresize(this.canvas, this.containerEl);
    window && window.addEventListener("resize", this._resize_listener);

    // Bind Events to Actions
    this._bind_canvas_events(new FabricCanvasEventsManager(this.canvas, this));
    this._bind_canvas_events(new UndoHistory(10));
  };

  componentDidUpdate(
    prevProps: Readonly<SketchProperties>,
    prevState: Readonly<SketchState>,
    snapshot?: any
  ): void {
    const props: Readonly<SketchProperties> = this.props;
    const state: Readonly<SketchState> = this.state;

    if (prevProps.tool !== props.tool) {
      if (this.canvas) {
        this.tool = create_tool(this.canvas, props);
      }
    }
  }

  componentWillUnmount = (): void => {
    window.removeEventListener("resize", this._resize_listener, true);
  };

  render = (): JSX.Element => {
    const { className, style, width, height } = this.props;
    const canvasDivStyle = Object.assign(
      {},
      style ? style : {},
      width ? { width: width } : {},
      height ? { height: height } : { height: 512 }
    );
    return (
      <div
        id={uuid4()}
        className={className}
        style={canvasDivStyle}
        ref={(elem) => (this.containerEl = elem)}>
        <canvas id={uuid4()} ref={(elem) => (this.canvasEl = elem)}>
          Sorry, Canvas HTML5 element is not supported by your browser :(
        </canvas>
      </div>
    );
  };
}

export default SketchField;
