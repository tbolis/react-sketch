import {
  FabricObject,
  FixedLayout,
  Group,
  GroupProps,
  LayoutManager,
  Path,
  classRegistry,
} from "fabric";

export class ClippingGroup extends Group {
  static type = "clipping";

  private blockErasing = false;

  constructor(objects: FabricObject[], options: Partial<GroupProps>) {
    super(objects, {
      originX: "center",
      originY: "center",
      left: 0,
      top: 0,
      layoutManager: new LayoutManager(new FixedLayout()),
      ...options,
    });
  }

  drawObject(ctx: CanvasRenderingContext2D) {
    const paths: Path[] = [];
    const objects: FabricObject[] = [];
    this._objects.forEach((object) =>
      (object instanceof Path ? paths : objects).push(object)
    );

    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();

    if (!this.blockErasing) {
      paths.forEach((path) => {
        path.render(ctx);
      });
    }

    objects.forEach((object) => {
      object.globalCompositeOperation = object.inverted
        ? "destination-out"
        : "source-in";
      object.render(ctx);
    });
  }
}

classRegistry.setClass(ClippingGroup);
