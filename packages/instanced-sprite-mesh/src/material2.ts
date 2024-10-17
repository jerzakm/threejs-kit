import { createTexture_vec2 } from '@three.ez/instanced-mesh'
import { ShaderMaterial, ShaderMaterialParameters, Texture, Vector2 } from 'three'

export class SpriteMaterial2 extends ShaderMaterial {
  public override vertexShader = `
    #include <get_from_texture>
    #include <instanced_pars_vertex>

    varying vec2 vUv;
    flat varying uint vInstanceIndex;

    void main() {

      #include <instanced_vertex>

      vUv = uv;
      vInstanceIndex = instanceIndex;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`

  public override fragmentShader = `
    #include <get_from_texture>

	  uniform highp sampler2D offsetTexture;
    uniform sampler2D map;
    uniform vec2 tileSize;
    varying vec2 vUv;
    flat varying uint vInstanceIndex;

    void main() {
      vec2 offset = getVec2FromTexture( offsetTexture, vInstanceIndex );
      vec4 color = texture2D(map, vUv * tileSize + offset * tileSize);
      gl_FragColor = vec4(vUv,1.,1.);
    }`

  constructor(count: number, parameters?: ShaderMaterialParameters) {
    super(parameters)
    this.uniforms.offsetTexture = { value: createTexture_vec2(count) }
  }
}
