import { BufferGeometry, BufferAttribute } from "three";

export const createSpriteTriangle = () => {
  const geometry = new BufferGeometry();

  const vertices = new Float32Array([
    // top
    0.0, 1.0, 0.0,
    // bot-left
    -1.0, -1.0, 0.0,
    // bot-right
    1.0, -1.0, 0.0,
  ]);
  geometry.setAttribute("position", new BufferAttribute(vertices, 3));

  const uvs = new Float32Array([
    // top
    0.5, 1,
    // bot-left
    0, 0.0,
    // bot-right
    1, 0.0,
  ]);

  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
};
