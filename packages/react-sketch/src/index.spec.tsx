import { render } from "@testing-library/react";
import Sketch, { SketchField, Tools, Types } from "./index";

describe("exports", () => {
  it("exports the component by name", () => {
    expect(SketchField).toBeDefined();
    expect(typeof SketchField).toEqual("function");
  });

  it("exports Tools with the names and values of 0.5.x", () => {
    expect(Tools).toEqual({
      Select: "select",
      Pencil: "pencil",
      Line: "line",
      Arrow: "arrow",
      Rectangle: "rectangle",
      RectangleLabel: "rectangle-label",
      Circle: "circle",
      Pan: "pan",
      DefaultTool: "default-tool",
      Highlighter: "highlighter",
    });
  });

  it("has a tool in Tools for every Tool", () => {
    expect(Object.values(Tools).sort()).toEqual(Object.values(Types.Tool).sort());
  });

  it("exports the types namespace, with the Tool enumeration", () => {
    expect(Types.Tool.PENCIL).toEqual("pencil");
  });

  describe("default export", () => {
    it("is the component", () => {
      expect(Sketch).toBe(SketchField);
      const { container } = render(<Sketch />);

      expect(container.querySelector("canvas")).toBeInTheDocument();
    });

    it("carries SketchField and Tools, as in 0.5.x", () => {
      expect(Sketch.SketchField).toBe(SketchField);
      expect(Sketch.Tools).toBe(Tools);
      expect(Sketch.Tools.Pencil).toEqual("pencil");

      const { container } = render(<Sketch.SketchField tool={Sketch.Tools.Line} />);

      expect(container.querySelector("canvas")).toBeInTheDocument();
    });
  });
});
