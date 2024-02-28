import {
  BufferGeometry,
  DataTexture,
  FloatType,
  RGBAFormat,
  Texture,
} from "three";
import { addAxis } from "./utils";

import { ClippedSpriteGeometry } from "./ClippedSpriteGeometry";

type FlipbookData = [
  /**
   * the geometry used to render the flipbook
   */
  BufferGeometry,
  DataTexture,
  Float32Array,
  { avg: number; min: number; max: number }
];

/**
 * Generates geometry data for a given flipbook image.
 */
export function createClippedFlipbook(
  imageOrTexture: HTMLImageElement | Texture,
  vertices: number,
  threshold: number,
  slices: [number, number]
): FlipbookData {
  const total = slices[0] * slices[1];
  const positions = new Float32Array(total * vertices * 4);

  let finalGeometry: BufferGeometry = null!;
  let totalSavings = 0;
  let minSaving = Infinity;
  let maxSaving = 0;

  /**
   * Generate the geometry for each step in the flipbook and accumulate the positions in a buffer.
   *
   * Keep one of the generated geometries as the initial one.
   *
   * @note We could also have a uvs buffer but uvs are very easily calculated in the shader with some multiplications.
   */
  for (let i = 0; i < total; i++) {
    const geometry = new ClippedSpriteGeometry(
      imageOrTexture,
      vertices,
      threshold,
      slices,
      [i % slices[0], Math.floor(i / slices[0])]
    );

    const pos = geometry.attributes.position.array;
    /**
     *  Save one of the generated geometries to use it as the flipbook geometry. Any geometry with the correct number of vertices is fine.
     */
    if (pos.length === vertices * 3 && !finalGeometry) {
      finalGeometry = geometry;
    }

    /**
     * The data texture wants to have four elements per vertex.
     */
    const posWithFourElements = addAxis(pos as Float32Array, 3, () => 1);

    positions.set(posWithFourElements, posWithFourElements.length * i);

    minSaving = Math.min(minSaving, geometry.userData.reduction);
    maxSaving = Math.max(maxSaving, geometry.userData.reduction);
    totalSavings += geometry.userData.reduction;
  }

  /**
   * We can safely 0-initialize the all elements of the positions array since positions are going to be set in the vertex shader anyway.
   */
  (finalGeometry.getAttribute("position").array as Float32Array).map(() => 0);

  /**
   * UVs are not necessary for the flipbook as they are calculated per-position and per-frame with simple operations.
   */
  finalGeometry.deleteAttribute("uv");

  const texture = new DataTexture(
    positions,
    vertices,
    total,
    RGBAFormat,
    FloatType
  );
  texture.needsUpdate = true;

  return [
    finalGeometry,
    texture,
    positions,
    { avg: totalSavings / total, min: minSaving, max: maxSaving },
  ];
}
