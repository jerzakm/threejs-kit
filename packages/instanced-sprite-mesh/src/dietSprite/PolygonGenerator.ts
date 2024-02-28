// @ts-ignore
import earcut from "earcut";
import * as buffer from "maath/buffer";
import * as misc from "maath/misc";

import { convexhull, simplifyConvexHull, calcPolygonArea } from "./geometry";
import { Point } from ".";
import { addAxis, createBufferFromListOfPoints, getNeighbours } from "./utils";
import { checkPointAlpha } from "./filters";

export type Settings = {
  scale: number;
  threshold: number;
  slices: [number, number];
  indices: [number, number];
  filter: (threshold: number) => (...rgb: number[]) => boolean;
};

const DEFAULT_SETTINGS: Settings = {
  threshold: 0.01,
  slices: [1, 1],
  indices: [0, 0],
  scale: 1,
  filter: checkPointAlpha,
};

export class PolygonGenerator {
  points: Array<Point> = [];

  data: {
    areaReduction: number;
  } = {
    areaReduction: 0,
  };

  debug = true;

  index: Uint32Array;
  positions: Float32Array;
  uv: Float32Array;

  defaultSettings = DEFAULT_SETTINGS;

  settings: Settings;

  constructor(
    img: HTMLImageElement,
    settings: Partial<Settings>,
    public vertices: number
  ) {
    this.settings = { ...this.defaultSettings, ...settings };

    const { slices } = this.settings;

    const canvas = createCanvas("bvc-image", img.width, img.height);
    this.points = this.getPoints(img, canvas);

    let convexHull = convexhull.makeHull(this.points);

    const simplified = simplifyConvexHull(convexHull, vertices);
    const normalized = simplified.map((p) => {
      let np = normalizePositions(p, [img.width, img.height], slices);

      /**
       * @todo should this be optional?
       */
      np.y = -1 * np.y;

      return np;
    });

    const { scale } = this.settings;

    this.data.areaReduction =
      1 -
      (calcPolygonArea(simplified) /
        ((img.width / slices[0]) * (img.height / slices[1]))) *
        scale;

    // make a buffer from the simplified points since earcut requires it
    const positions = createBufferFromListOfPoints(normalized);
    /**
     * Use `earcut` to triangulate the points
     * @see https://github.com/mapbox/earcut
     **/
    const index = earcut(positions, null, 2);

    // transform the buffer to 3d with 0 z [1, 2, ...] > [1, 2, 0, ...]
    this.positions = addAxis(positions, 2, () => 0) as Float32Array;
    this.index = Uint32Array.from(index);

    /**
     * @note that this calculate can be easily done in the material.
     * Removing this step would be a non-significant speed improvement
     */
    this.uv = buffer.map(positions.slice(0), 2, (v) => {
      let x = v[0] + 0.5;
      x =
        x / this.settings.slices[0] +
        (1 / this.settings.slices[0]) * this.settings.indices[0];

      let y = v[1] + 0.5;
      y =
        y / this.settings.slices[1] +
        1 -
        (1 / this.settings.slices[1]) * (this.settings.indices[1] + 1);

      return [x, y];
    }) as Float32Array;
  }

  getImageData(img: HTMLImageElement, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    /**
     * Indices
     */
    const [hi, vi] = this.settings.indices;

    /**
     * Number of slices
     */
    const [hs, vs] = this.settings.slices;

    /**
     * Size of a single slice
     */
    const w = canvas.width / hs;
    const h = canvas.height / vs;

    // get image data for hi, vi
    const imageData = ctx.getImageData(w * hi, h * vi, w, h);
    return imageData;
  }

  /**
   * Iterates over the image and returns an array of points that are over the alpha threshold.
   * It reduces the number of returned points by excluding points that are surrounded by solid pixels.
   *
   * @param img An image element with the image already loaded
   * @param canvas A canvas element to draw the image on in order to get the color values
   * @returns
   */
  getPoints(img: HTMLImageElement, canvas: HTMLCanvasElement): Point[] {
    const imageData = this.getImageData(img, canvas);
    const data = imageData.data;

    const points = [];

    const filterFn = this.settings.filter(this.settings.threshold);

    const checkNeighbours = (index: number | null) =>
      index !== null &&
      filterFn(
        data[index * 4],
        data[index * 4 + 1],
        data[index * 4 + 2],
        data[index * 4 + 3]
      );

    for (let i = 0; i < data.length; i += 4) {
      const isValidPoint = filterFn(
        data[i + 0],
        data[i + 1],
        data[i + 2],
        data[i + 3]
      );

      if (isValidPoint) {
        /**
         * This drastically reduces the total amount of points that will be included in the hull calculation
         * at the cost of checking each neighbour (4) for each valid sample.
         **/
        const neighbours = getNeighbours(i, canvas.width, canvas.height);

        // if neighbour are all valid, never add point
        if (neighbours.every(checkNeighbours)) {
          continue;
        }

        const [x, y] = misc.get2DFromIndex(i / 4, imageData.width);

        points.push({ x, y });
      }
    }

    return points;
  }
}

/**
 * Creates and returns an html canvas element.
 * Doesn't attach it to the body.
 */
const createCanvas = (id = "debug-canvas", width: number, height: number) => {
  const canvas =
    (document.querySelector(`#${id}`) as HTMLCanvasElement) ||
    document.createElement("canvas");

  canvas.id = id;

  canvas.width = width;
  canvas.height = height;

  canvas.id = id;

  return canvas;
};

const normalizePositions = (
  p: Point,
  imageSize: number[],
  slices: number[]
) => {
  return {
    x: (p.x - imageSize[0] / (2 * slices[0])) / (imageSize[0] / slices[0]),
    y: (p.y - imageSize[1] / (2 * slices[1])) / (imageSize[1] / slices[1]),
  };
};
