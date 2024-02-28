import { Point } from ".";
import * as buffer from "maath/buffer";

export function fillBuffer(count: number, point: number[]): Float32Array {
  const buffer = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    buffer[i * 3] = point[0];
    buffer[i * 3 + 1] = point[1];
    buffer[i * 3 + 2] = point[2];
  }

  return buffer;
}

export function addAxis(
  buffer: Float32Array,
  size: number,
  valueGenerator: (j: number) => number = () => Math.random()
): Float32Array {
  const newSize = size + 1;
  const newBuffer = new Float32Array((buffer.length / size) * newSize);

  for (let i = 0; i < buffer.length; i += size) {
    let j = (i / size) * newSize;

    newBuffer[j] = buffer[i];
    newBuffer[j + 1] = buffer[i + 1];

    if (size === 2) {
      newBuffer[j + 2] = valueGenerator(j);
    }

    if (size === 3) {
      newBuffer[j + 2] = buffer[i + 2];
      newBuffer[j + 3] = valueGenerator(j);
    }
  }

  return newBuffer;
}

export function createBufferFromListOfPoints(points: Point[]) {
  const buffer = new Float32Array(points.length * 2);

  for (let i = 0; i < points.length; i++) {
    buffer[i * 2] = points[i].x;
    buffer[i * 2 + 1] = points[i].y;
  }

  return buffer;
}

export function getUVsFromPositions(
  positions: Float32Array,
  horizontalSlices: number,
  verticalSlices: number,
  horizontalIndex: number,
  verticalIndex: number
) {
  const uv = buffer.map(positions.slice(0), 2, (v) => {
    let x = v[0] + 0.5;
    x = x / horizontalSlices + (1 / horizontalSlices) * horizontalIndex;

    let y = v[1] + 0.5;
    y = y / verticalSlices + 1 - (1 / verticalSlices) * (verticalIndex + 1);

    return [x, y];
  }) as Float32Array;

  return uv;
}

/**
 * @param i
 * @param width
 * @param height
 * @returns array of neighbouring points indices
 */
export function getNeighbours(i: number, width: number, height: number) {
  const neighbours = [];

  const x = (i % (width * 4)) / 4;
  const y = Math.floor(i / (width * 4));

  const top = y - 1;
  const bottom = y + 1;
  const left = x - 1;
  const right = x + 1;

  if (top >= 0) {
    neighbours.push(top * width + x);
  } else {
    neighbours.push(null);
  }

  if (bottom < height) {
    neighbours.push(bottom * width + x);
  } else {
    neighbours.push(null);
  }

  if (left >= 0) {
    neighbours.push(y * width + left);
  } else {
    neighbours.push(null);
  }

  if (right < width) {
    neighbours.push(y * width + right);
  } else {
    neighbours.push(null);
  }

  return neighbours;
}
