import { render } from "@testing-library/react";
import SketchField from "./SketchField";
import { Tool } from "../../types";

describe("SketchField", () => {
  it("renders a canvas inside a container div with default props", () => {
    const { container } = render(<SketchField />);
    const sketch = container.firstElementChild;

    expect(sketch).toBeInstanceOf(HTMLDivElement);
    expect(sketch?.querySelector("canvas")).toBeInTheDocument();
  });

  it("applies width and height to the container style", () => {
    const { container } = render(<SketchField width={320} height={240} />);

    expect(container.firstElementChild).toHaveStyle({
      width: "320px",
      height: "240px",
    });
  });

  it("unmounts without throwing", () => {
    const { unmount } = render(<SketchField />);

    expect(() => unmount()).not.toThrow();
  });

  it("switches the tool between pencil and line without throwing", () => {
    const { rerender } = render(<SketchField tool={Tool.PENCIL} />);

    expect(() => rerender(<SketchField tool={Tool.LINE} />)).not.toThrow();
    expect(() => rerender(<SketchField tool={Tool.PENCIL} />)).not.toThrow();
  });
});
