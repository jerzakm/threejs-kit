import { Point } from ".";

export function calculateIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point {
  var c2x = p3.x - p4.x; // (x3 - x4)
  var c3x = p1.x - p2.x; // (x1 - x2)
  var c2y = p3.y - p4.y; // (y3 - y4)
  var c3y = p1.y - p2.y; // (y1 - y2)

  // down part of intersection point formula
  var d = c3x * c2y - c3y * c2x;

  if (d == 0) {
    throw new Error("Number of intersection points is zero or infinity.");
  }

  // upper part of intersection point formula
  var u1 = p1.x * p2.y - p1.y * p2.x; // (x1 * y2 - y1 * x2)
  var u4 = p3.x * p4.y - p3.y * p4.x; // (x3 * y4 - y3 * x4)

  // intersection point formula

  var px = (u1 * c2x - c3x * u4) / d;
  var py = (u1 * c2y - c3y * u4) / d;

  var p = { x: px, y: py };

  return p;
}

export function calcPolygonArea(vertices: Array<{ x: number; y: number }>) {
  var total = 0;

  for (var i = 0, l = vertices.length; i < l; i++) {
    var addX = vertices[i].x;
    var addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
    var subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
    var subY = vertices[i].y;

    total += addX * addY * 0.5;
    total -= subX * subY * 0.5;
  }

  return Math.abs(total);
}

function areaOfTriangleGivenThreePoints([a, b, c]: Point[]): number {
  return Math.abs(
    (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2
  );
}

/**
 *
 * A simple algorithm to simplify a convex hull to a defined number of points.
 * It works by going through all existing edges and collapsing the one that adds the lowest possible area to the hull.
 * Given vertices A B C D:
 * - build the triangle created by the intersection of AB and CD (A') and BC.
 * - calculate its area
 * - check if it is the smallest possible area
 *
 * Once the smallest triangle has been found, remove the BC edge and add the new A' vertex to the hull.
 * Repeat until the desired number of vertices is reached.
 *
 * The simplified polygon will still include all the original vertices - something we can't guarantee
 * by just using polyline simplification
 *
 * @param convexHull A list of points representing a convexHull polyline.
 * @param desiredNumberOfPoints The number of points after simplification
 * @returns
 */
export function simplifyConvexHull(
  convexHull: Point[],
  desiredNumberOfPoints: number = 8
) {
  const simplified = convexHull.slice();

  let iterations = 0;
  while (simplified.length > desiredNumberOfPoints && iterations < 1000) {
    iterations++;

    let smallestFoundArea = Infinity;
    let smallestFoundMerge = null;

    for (let i = 0; i <= simplified.length - 1; i++) {
      const l = simplified.length;

      const indices = [i, (i + 1) % l, (i + 2) % l, (i + 3) % l];

      const p1 = simplified[indices[0]];
      const p2 = simplified[indices[1]];
      const p3 = simplified[indices[2]];
      const p4 = simplified[indices[3]];

      try {
        const pi = calculateIntersection(p1, p2, p3, p4);
        const area = areaOfTriangleGivenThreePoints([pi, p2, p3]);

        if (area < smallestFoundArea) {
          smallestFoundArea = area;
          smallestFoundMerge = {
            point: pi,
            area: area,
            indicesToRemove: [indices[1], indices[2]],
          };
        }
      } catch (e) {
        console.log(e);
      }
    }

    if (smallestFoundMerge) {
      const i1 = smallestFoundMerge.indicesToRemove[0];
      const i2 = smallestFoundMerge.indicesToRemove[1];

      if (i2 > i1) {
        simplified.splice(i2, 1);
        simplified.splice(i1, 1);
      } else {
        simplified.splice(i1, 1);
        simplified.splice(i2, 1);
      }

      simplified.splice(Math.min(i1, i2), 0, smallestFoundMerge.point);
    }
  }

  return simplified;
}

/*
 * Convex hull algorithm - Library (TypeScript)
 *
 * Copyright (c) 2021 Project Nayuki
 * https://www.nayuki.io/page/convex-hull-algorithm
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program (see COPYING.txt and COPYING.LESSER.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

export namespace convexhull {
  // Returns a new array of points representing the convex hull of
  // the given set of points. The convex hull excludes collinear points.
  // This algorithm runs in O(n log n) time.
  export function makeHull<P extends Point>(
    points: Readonly<Array<P>>
  ): Array<P> {
    let newPoints: Array<P> = points.slice();
    newPoints.sort(convexhull.POINT_COMPARATOR);
    return convexhull.makeHullPresorted(newPoints);
  }

  // Returns the convex hull, assuming that each points[i] <= points[i + 1]. Runs in O(n) time.
  export function makeHullPresorted<P extends Point>(
    points: Readonly<Array<P>>
  ): Array<P> {
    if (points.length <= 1) return points.slice();

    // Andrew's monotone chain algorithm. Positive y coordinates correspond to "up"
    // as per the mathematical convention, instead of "down" as per the computer
    // graphics convention. This doesn't affect the correctness of the result.

    let upperHull: Array<P> = [];
    for (let i = 0; i < points.length; i++) {
      const p: P = points[i];
      while (upperHull.length >= 2) {
        const q: P = upperHull[upperHull.length - 1];
        const r: P = upperHull[upperHull.length - 2];
        if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x))
          upperHull.pop();
        else break;
      }
      upperHull.push(p);
    }
    upperHull.pop();

    let lowerHull: Array<P> = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const p: P = points[i];
      while (lowerHull.length >= 2) {
        const q: P = lowerHull[lowerHull.length - 1];
        const r: P = lowerHull[lowerHull.length - 2];
        if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x))
          lowerHull.pop();
        else break;
      }
      lowerHull.push(p);
    }
    lowerHull.pop();

    if (
      upperHull.length == 1 &&
      lowerHull.length == 1 &&
      upperHull[0].x == lowerHull[0].x &&
      upperHull[0].y == lowerHull[0].y
    )
      return upperHull;
    else return upperHull.concat(lowerHull);
  }

  export function POINT_COMPARATOR(a: Point, b: Point): number {
    if (a.x < b.x) return -1;
    else if (a.x > b.x) return +1;
    else if (a.y < b.y) return -1;
    else if (a.y > b.y) return +1;
    else return 0;
  }
}
