import { fabric } from "fabric";
import { PureComponent } from "react";
import { SketchProperties, SketchState } from "../../types";
import { UndoHistory } from "./history";
import { FabricCanvasTool } from "./tools";

export interface EventInput {
  event: fabric.IEvent;
  tool: FabricCanvasTool;
  props: SketchProperties;
  state: SketchState;
}
export interface EventCallback {
  (input: EventInput): void;
}

/**
 * Canvas Events Manager Class
 */
export class FabricCanvasEventsManager {
  private canvas: fabric.Canvas;
  private sketch: PureComponent<SketchProperties, SketchState>;

  constructor(
    canvas: fabric.Canvas,
    sketch: PureComponent<SketchProperties, SketchState>
  ) {
    this.canvas = canvas;
    this.sketch = sketch;
  }

  /**
   * Action when an object is added to the canvas
   */
  public onObjectAdded({ event, tool, props, state }: EventInput): void {
    // if (!input.state.action) {
    //   this.setState({ action: true });
    //   return;
    // }
    // const obj = event.target;
    // obj.__version = 1;
    // record current object state as json and save as originalState
    // const objState = obj.toJSON();
    // obj.__originalState = objState;
    // const state = JSON.stringify(objState);
    // object, previous state, current state
    // this._history.keep([obj, state, state]);
    // onObjectAdded(e);
  }
  public onObjectMoved({ event, tool, props, state }: EventInput): void {
    console.log("foo");
  }

  public onMouseUp({ event, tool, props, state }: EventInput): void {
    tool.doMouseUp(event);
  }
  public onMouseDown({ event, tool, props, state }: EventInput): void {
    console.log("down");
    tool.doMouseDown(event);
    // const { onMouseDown } = this.props;
    // this._selectedTool.doMouseDown(e);
    // onMouseDown(e);
  }
  public onMouseMove({ event, tool, props, state }: EventInput): void {
    console.log("move");
    tool.doMouseMove(event);
  }
  public onMouseOut({ event, tool, props, state }: EventInput): void {
    console.log("out");
    tool.doMouseOut(event);
  }
}
