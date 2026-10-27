/**
 * @jest-environment jsdom
 */
import { colorNameToHex, hexToRgbA, linearDistance } from "./index";

describe("Utils", () => {
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
});
