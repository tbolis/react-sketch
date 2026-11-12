import * as fabric from "fabric";
import { strokePath, type Disc } from "./geometry";

/** A disc as it is saved: the x and the y of its center, and its radius */
export type SavedDisc = [number, number, number];

const round = (value: number): number => Math.round(value * 100) / 100;

/** The disc to save, at a hundredth of a pixel */
export const savedDisc = ({ x, y, r }: Disc): SavedDisc => [
  round(x),
  round(y),
  round(r),
];

/**
 * The stroke of a pen whose width follows its pressure. It is a path, which is filled, so
 * the canvas selects, moves, erases, copies and draws it as it does the others. It is saved
 * as the discs along it and not as the commands of the path, which are about twenty times
 * as long: the path is made again when the stroke is loaded.
 */
export class PressureStroke extends fabric.Path {
  static type = "PressureStroke";

  readonly discs: SavedDisc[];

  constructor(discs: SavedDisc[], options?: Partial<fabric.PathProps>) {
    super(
      strokePath(
        discs.map(([x, y, r]) => ({ x, y, r }))
      ) as fabric.TSimpleParsedCommand[],
      options
    );
    this.discs = discs;
  }

  toObject<
    T extends Omit<
      Partial<fabric.PathProps> & fabric.TClassProperties<this>,
      keyof fabric.SerializedPathProps
    >,
    K extends keyof T = never,
  >(propertiesToInclude: K[] = []) {
    // The path is not saved: the discs are, and the path is made from them when it is loaded
    const { path, ...object } = super.toObject<T, K>(propertiesToInclude);
    void path;
    return { ...object, discs: this.discs } as unknown as Pick<T, K> &
      fabric.SerializedPathProps;
  }

  static fromObject(object: Record<string, unknown>): Promise<fabric.Path> {
    return this._fromObject(object, { extraParam: "discs" }) as Promise<fabric.Path>;
  }
}

fabric.classRegistry.setClass(PressureStroke);
