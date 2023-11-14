import { type BufferGeometry } from "three";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";

export class InstancedSpriteMesh<T> extends InstancedUniformsMesh<T> {
  constructor(geometry: BufferGeometry, baseMaterial: T, count: number) {
    super(geometry, baseMaterial, count);
  }
}
