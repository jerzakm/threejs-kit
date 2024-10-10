import { InstancedMesh2 } from '@three.ez/instanced-mesh'
import { PlaneGeometry, WebGLRenderer } from 'three'

export class InstancedSpriteMesh2 extends InstancedMesh2 {
  constructor(baseMaterial: any, count: number, renderer: WebGLRenderer) {
    super(renderer, count, new PlaneGeometry(), baseMaterial)
  }
}
