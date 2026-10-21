import * as Types from "./types";
import { Tools } from "./types";
import SketchField from "./components/SketchField";

/**
 * The default export is the component itself, which also carries `SketchField`
 * and `Tools`. That keeps both `<Sketch />` and the 0.5.x use
 * (`Sketch.SketchField`, `Sketch.Tools`) working.
 */
const Sketch = Object.assign(SketchField, { SketchField, Tools });

export { SketchField, Tools, Types };

export default Sketch;
