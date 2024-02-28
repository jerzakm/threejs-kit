import { BufferAttribute, BufferGeometry } from "three";
import { fillBuffer } from "./utils";

/**
 * Just a bare minimum geometry used to render the flipbook.
 */
export class ClippedFlipbookGeometry extends BufferGeometry {
  constructor(vertices: number) {
    super();
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(vertices * 3), 3)
    );
    geometry.setAttribute(
      "normal",
      new BufferAttribute(fillBuffer(vertices * 3, [0, 0, 1]), 3)
    );

    Object.assign(this, geometry);
  }
}
