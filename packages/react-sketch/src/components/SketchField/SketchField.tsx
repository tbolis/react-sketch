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
import * as CanvasEvents from "./events";

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class SketchField extends PureComponent<SketchProperties, SketchState> {
  private canvas!: fabric.Canvas;
  private canvasEl!: HTMLCanvasElement | null;
  private containerEl!: HTMLDivElement | null;
  private tool!: FabricCanvasTool;

  constructor(props: SketchProperties) {
    super(props);
  }

  // TODO: probably not needed since we use typescript
  static propTypes = {
    tool: PropTypes.string,
    lineWidth: PropTypes.number,
    lineColor: PropTypes.string,
  };

  static defaultProps = {
    lineColor: "black",
  };

  state = {
    action: true,
  };

  /**
   * Listener function for the resize of canvas and objects
   * @param event the UIEvent of resize event
   */
  private _resize_listener = (event: UIEvent): void => {
    this.containerEl && autoresize(this.canvas, this.containerEl);
  };

  // Helper declaration for all canvas events
  private on = (name: string, callback: EventCallback): void => {
    this.canvas.on(name, (event: fabric.IEvent) => {
      callback({
        event: event,
        tool: this.tool,
        props: this.props,
        state: this.state,
      });
    });
  };

  /**
   * Bind Canvas events with Component
   */
  private _bind_canvas_events(eventAware: CanvasEventAware): void {
    // Fabric Events
    // on("object:moved", eventsManager.onObjectMoved);
    // canvas.on("object:modified", (e) => this.callEvent(e, this._onObjectModified));
    // canvas.on("object:removed", (e) => this.callEvent(e, this._onObjectRemoved));
    this.on("mouse:up", eventAware.onMouseUp);
    this.on("mouse:down", eventAware.onMouseDown);
    this.on("mouse:move", eventAware.onMouseMove);
    this.on("mouse:out", eventAware.onMouseOut);
    // canvas.on("object:moving", (e) => this.callEvent(e, this._onObjectMoving));
    // canvas.on("object:scaling", (e) => this.callEvent(e, this._onObjectScaling));
    // canvas.on("object:rotating", (e) => this.callEvent(e, this._onObjectRotating));
    // // IText Events fired on Adding Text
    // // canvas.on("text:event:changed", console.log)
    // // canvas.on("text:selection:changed", console.log)
    // // canvas.on("text:editing:entered", console.log)
    // // canvas.on("text:editing:exited", console.log)
  }

  componentDidMount = (): void => {
    this.canvas = new fabric.Canvas(this.canvasEl);
    this.tool = create_tool(this.canvas, this.props);
    this.containerEl && autoresize(this.canvas, this.containerEl);
    window && window.addEventListener("resize", this._resize_listener);

    const eventsManager = new FabricCanvasEventsManager(this.canvas, this);
    this._bind_canvas_events(eventsManager);

    const history = new UndoHistory(10);
    this._bind_canvas_events(history);
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
