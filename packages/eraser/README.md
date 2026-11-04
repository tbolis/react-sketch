# @react-sketch/eraser

The eraser brush of react-sketch. It is the code of
[@erase2d/fabric](https://github.com/ShaMan123/erase2d) 1.2.2 (`packages/fabric` and `packages/core`
of that repository, MIT, see [LICENSE.md](LICENSE.md)), kept here to change it when react-sketch needs it.

The package is private. `react-sketch` bundles it, so nothing is installed for it by the users of the
library.

Changes against the original:

- The code of `@erase2d/core` is in `src/erase.ts`, and imported from there.
- The lint rules of this repository are applied (no short-circuit statements, no `any`).
- The erasing effect restores an object whose opacity is 0, the original skipped it and left the object
  invisible.
