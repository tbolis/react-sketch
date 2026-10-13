/**
 * @jest-environment jsdom
 */
import {
  colorNameToHex,
  hexToRgbA,
  linearDistance,
  pointerPosition,
  uuid4,
} from "./index";

describe("Utils", () => {
  it("Generates random uuid", () => {
    expect(uuid4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(uuid4()).not.toEqual(uuid4());
  });

  describe("linearDistance", () => {
    it("Calculates the distance of two points", () => {
      expect(linearDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toEqual(5);
      expect(linearDistance({ x: 3, y: 4 }, { x: 0, y: 0 })).toEqual(5);
      expect(linearDistance({ x: 7, y: 7 }, { x: 7, y: 7 })).toEqual(0);
    });
  });

  describe("hexToRgbA", () => {
    it("Converts hex codes to rgba", () => {
      expect(hexToRgbA("#ff0000")).toEqual("rgba(255,0,0,0.4)");
      expect(hexToRgbA("#0F8")).toEqual("rgba(0,255,136,0.4)");
    });

    it("Rejects invalid hex codes", () => {
      expect(() => hexToRgbA("red")).toThrow("Bad hex color");
      expect(() => hexToRgbA("#12")).toThrow("Bad hex color");
      expect(() => hexToRgbA("#gggggg")).toThrow("Bad hex color");
    });
  });

  describe("colorNameToHex", () => {
    it("Converts color names to hex, ignoring the case", () => {
      expect(colorNameToHex("red")).toEqual("#ff0000");
      expect(colorNameToHex("RebeccaPurple")).toEqual("#663399");
      expect(colorNameToHex("indianred")).toEqual("#cd5c5c");
    });

    it("Returns undefined for unknown names", () => {
      expect(colorNameToHex("not-a-color")).toBeUndefined();
      expect(colorNameToHex("constructor")).toBeUndefined();
    });
  });

  describe("pointerPosition", () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement("div");
      element.style.borderLeftWidth = "2px";
      element.style.borderTopWidth = "3px";
      element.getBoundingClientRect = () => ({ left: 10, top: 20 } as DOMRect);
      document.body.appendChild(element);
    });

    afterEach(() => {
      element.remove();
    });

    it("Is relative to the target, excluding its border", () => {
      let position: [number, number] | undefined;
      element.addEventListener("click", (event) => {
        position = pointerPosition(event);
      });
      element.dispatchEvent(new MouseEvent("click", { clientX: 50, clientY: 70 }));
      expect(position).toEqual([38, 47]);
    });

    it("Supports touch events", () => {
      const event = ({
        target: element,
        changedTouches: [{ clientX: 30, clientY: 40 }],
      } as unknown) as TouchEvent;
      expect(pointerPosition(event)).toEqual([18, 17]);
    });
  });
});
